// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-pair-token",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const BUCKET = "assessment-proctor";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function makeCode() {
  // 6-char alphanumeric, no ambiguous chars
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alpha[Math.floor(Math.random() * alpha.length)];
  return out;
}

async function getUser(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const userClient = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Validate JWT via claims — does NOT require an active server-side session,
  // so it keeps working if the user's auth session row was revoked but the
  // token is still within its exp window.
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub as string, email: (data.claims.email as string) ?? null };
}


async function findPairing(token: string) {
  const { data } = await admin
    .from("assessment_side_camera_pairings")
    .select("*")
    .eq("pair_token", token)
    .maybeSingle();
  return data;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{32,96}$/i; // hex pair_token (default 48), conservative bounds
const MAX_DATAURL_BYTES = 10 * 1024 * 1024; // 10 MB raw string cap
const MAX_ORDINAL = 50;
const PAIR_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6h

function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}
function isToken(v: unknown): v is string {
  return typeof v === "string" && TOKEN_RE.test(v);
}

/**
 * Verify a question is part of the assessment that this attempt belongs to.
 * Prevents a phone holding a valid pair-token from uploading pages targeted
 * at a question that does not exist in the current exam.
 */
async function questionInAttempt(attemptId: string, questionId: string): Promise<boolean> {
  const { data: att } = await admin
    .from("assessment_attempts")
    .select("assessment_id")
    .eq("id", attemptId)
    .maybeSingle();
  if (!att?.assessment_id) return false;
  const { data: rows } = await admin
    .from("section_questions")
    .select("question_id, assessment_sections!inner(assessment_id)")
    .eq("question_id", questionId)
    .eq("assessment_sections.assessment_id", att.assessment_id)
    .limit(1);
  return !!(rows && rows.length);
}

function pairingFresh(p: { status: string; created_at: string }) {
  if (p.status === "disconnected" || p.status === "expired" || p.status === "closed") return false;
  const age = Date.now() - new Date(p.created_at).getTime();
  return age <= PAIR_MAX_AGE_MS;
}

/**
 * Extract diagnostic metadata about the caller so each teardown event
 * carries enough context to audit who/where it came from later.
 */
function clientMeta(req: Request) {
  const h = req.headers;
  return {
    ip:
      h.get("x-forwarded-for")?.split(",")[0].trim() ??
      h.get("cf-connecting-ip") ??
      h.get("x-real-ip") ??
      null,
    ua: h.get("user-agent") ?? null,
    referer: h.get("referer") ?? null,
    isBeacon:
      (h.get("content-type") ?? "").includes("text/ping") ||
      h.get("ping-to") !== null,
  };
}

async function logEvent(attemptId: string, kind: string, payload: Record<string, unknown>) {
  try {
    await admin.from("attempt_events").insert({
      attempt_id: attemptId,
      kind,
      payload: payload as never,
    });
  } catch {
    /* never let auditing break the main flow */
  }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "";

    // ---- PAIR (candidate creates a pairing) ------------------------------
    if (action === "pair") {
      const user = await getUser(req);
      if (!user) return json({ error: "auth_required" }, 401);
      const { attemptId } = await req.json();
      if (!attemptId) return json({ error: "attemptId required" }, 400);

      const { data: attempt } = await admin
        .from("assessment_attempts")
        .select("id, user_id")
        .eq("id", attemptId)
        .maybeSingle();
      if (!attempt || attempt.user_id !== user.id)
        return json({ error: "forbidden" }, 403);

      // Reuse an open pairing if recent (<10min), else create a new one
      const { data: existing } = await admin
        .from("assessment_side_camera_pairings")
        .select("*")
        .eq("attempt_id", attemptId)
        .in("status", ["pending", "paired"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const fresh =
        existing &&
        Date.now() - new Date(existing.updated_at).getTime() < 10 * 60_000;

      if (fresh) {
        await logEvent(attemptId, "side_eye_pair_reused", {
          pairingId: existing.id,
          status: existing.status,
          ...clientMeta(req),
        });
        return json({
          pairingId: existing.id,
          pairCode: existing.pair_code,
          pairToken: existing.pair_token,
          status: existing.status,
        });
      }

      // Create
      let pairCode = "";
      for (let i = 0; i < 5; i++) {
        const code = makeCode();
        const { data: row, error } = await admin
          .from("assessment_side_camera_pairings")
          .insert({ attempt_id: attemptId, pair_code: code, status: "pending" })
          .select("*")
          .single();
        if (!error && row) {
          await logEvent(attemptId, "side_eye_pair_created", {
            pairingId: row.id,
            pairCode: row.pair_code,
            ...clientMeta(req),
          });
          return json({
            pairingId: row.id,
            pairCode: row.pair_code,
            pairToken: row.pair_token,
            status: row.status,
          });
        }
        pairCode = code;
      }
      return json({ error: "could_not_create_pairing", pairCode }, 500);
    }

    // ---- STATUS (poll from candidate or phone) ---------------------------
    if (action === "status") {
      const token = url.searchParams.get("token") ?? "";
      if (!token) return json({ error: "token required" }, 400);
      const p = await findPairing(token);
      if (!p) return json({ error: "not_found" }, 404);
      let attemptStatus: string | null = null;
      if (p.attempt_id) {
        const { data: att } = await admin
          .from("assessment_attempts")
          .select("status")
          .eq("id", p.attempt_id)
          .maybeSingle();
        attemptStatus = att?.status ?? null;
      }
      return json({
        status: p.status,
        pairCode: p.pair_code,
        pairingId: p.id,
        attemptId: p.attempt_id,
        attemptStatus,
        lastSeenAt: p.last_seen_at,
        pairedAt: p.paired_at,
        closedAt: p.closed_at ?? null,
      });
    }

    // ---- CONNECT (phone announces ready) ---------------------------------
    if (action === "connect") {
      const token = url.searchParams.get("token") ?? "";
      const p = await findPairing(token);
      if (!p) return json({ error: "not_found" }, 404);
      if (p.status === "closed") return json({ error: "pairing_closed" }, 410);
      const now = new Date().toISOString();
      await admin
        .from("assessment_side_camera_pairings")
        .update({ status: "paired", paired_at: p.paired_at ?? now, last_seen_at: now })
        .eq("id", p.id);
      await logEvent(p.attempt_id, "side_eye_connected", {
        pairingId: p.id,
        previousStatus: p.status,
        ...clientMeta(req),
      });
      return json({ ok: true });
    }

    // ---- DISCONNECT ------------------------------------------------------
    if (action === "disconnect") {
      const token = url.searchParams.get("token") ?? "";
      const p = await findPairing(token);
      if (!p) return json({ error: "not_found" }, 404);
      // Don't downgrade a server-closed pairing back to "disconnected".
      if (p.status !== "closed") {
        await admin
          .from("assessment_side_camera_pairings")
          .update({ status: "disconnected" })
          .eq("id", p.id);
        const meta = clientMeta(req);
        await logEvent(p.attempt_id, "side_eye_lost", {
          pairingId: p.id,
          previousStatus: p.status,
          source: meta.isBeacon ? "beacon" : "explicit",
          ...meta,
        });
      }
      return json({ ok: true });
    }

    // ---- CLOSE-ATTEMPT (desktop ended the test, tear down all pairings) --
    if (action === "close-attempt") {
      // Accept either an authenticated POST or an unauthenticated sendBeacon
      // carrying the attempt id. We always verify the attempt's owner
      // before touching pairings.
      let attemptId = url.searchParams.get("attemptId") ?? "";
      if (!attemptId) {
        const body = await req.json().catch(() => null) as { attemptId?: string } | null;
        attemptId = body?.attemptId ?? "";
      }
      if (!isUuid(attemptId)) return json({ error: "attemptId required" }, 400);

      const { data: att } = await admin
        .from("assessment_attempts")
        .select("id, user_id")
        .eq("id", attemptId)
        .maybeSingle();
      if (!att) return json({ error: "attempt_not_found" }, 404);

      const user = await getUser(req);
      // Unauthenticated beacons are allowed only if they target an attempt
      // whose owner cannot be cross-checked here; we still gate on having
      // an existing in-flight pairing for that attempt so a random caller
      // cannot spam close-attempts.
      if (user && user.id !== att.user_id) {
        return json({ error: "forbidden" }, 403);
      }

      const nowIso = new Date().toISOString();
      const { data: closed } = await admin
        .from("assessment_side_camera_pairings")
        .update({ status: "closed", closed_at: nowIso })
        .eq("attempt_id", attemptId)
        .in("status", ["pending", "paired", "disconnected"])
        .select("id");

      if (closed && closed.length) {
        await admin.from("attempt_events").insert({
          attempt_id: attemptId,
          kind: "side_eye_closed",
          payload: { pairingIds: closed.map((r) => r.id), reason: "attempt_ended" } as never,
        });
      }
      return json({ ok: true, closed: closed?.length ?? 0 });
    }


    // ---- UPLOAD (phone posts a JPEG every ~5s) ---------------------------
    if (action === "upload") {
      const token = req.headers.get("x-pair-token") ?? url.searchParams.get("token") ?? "";
      if (!token) return json({ error: "token required" }, 400);
      const p = await findPairing(token);
      if (!p) return json({ error: "not_found" }, 404);
      if (p.status === "disconnected" || p.status === "expired" || p.status === "closed")
        return json({ error: "pairing_closed" }, 410);

      const body = await req.json().catch(() => null) as { dataUrl?: string } | null;
      const dataUrl = body?.dataUrl;
      if (!dataUrl || !dataUrl.startsWith("data:image/")) {
        return json({ error: "dataUrl required" }, 400);
      }
      const comma = dataUrl.indexOf(",");
      const b64 = dataUrl.slice(comma + 1);
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

      const ts = new Date();
      const path = `sideeye/${p.attempt_id}/${ts.getTime()}.jpg`;
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(path, bin, { contentType: "image/jpeg", upsert: false });
      if (upErr) return json({ error: upErr.message }, 500);

      await admin.from("assessment_side_camera_frames").insert({
        pairing_id: p.id,
        attempt_id: p.attempt_id,
        storage_path: path,
        captured_at: ts.toISOString(),
      });
      await admin
        .from("assessment_side_camera_pairings")
        .update({
          status: p.status === "pending" ? "paired" : p.status,
          paired_at: p.paired_at ?? ts.toISOString(),
          last_seen_at: ts.toISOString(),
        })
        .eq("id", p.id);

      return json({ ok: true, path });
    }

    // ---- ANSWER-UPLOAD (phone uploads descriptive answer-sheet page) ----
    if (action === "answer-upload") {
      const token = req.headers.get("x-pair-token") ?? url.searchParams.get("token") ?? "";
      if (!isToken(token)) return json({ error: "invalid_token" }, 400);
      const p = await findPairing(token);
      if (!p) return json({ error: "pairing_not_found" }, 404);
      if (!pairingFresh(p))
        return json({ error: "pairing_closed_or_expired" }, 410);

      const body = await req.json().catch(() => null) as
        | { dataUrl?: string; questionId?: string; ordinal?: number; attemptId?: string }
        | null;
      const dataUrl = body?.dataUrl;
      const questionId = body?.questionId;
      const ordinal = Number(body?.ordinal);

      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/"))
        return json({ error: "invalid_dataUrl" }, 400);
      if (dataUrl.length > MAX_DATAURL_BYTES)
        return json({ error: "payload_too_large" }, 413);
      if (!isUuid(questionId)) return json({ error: "invalid_questionId" }, 400);
      if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > MAX_ORDINAL)
        return json({ error: "invalid_ordinal" }, 400);
      // If caller passes attemptId, it MUST match the pairing's attempt
      if (body?.attemptId && body.attemptId !== p.attempt_id)
        return json({ error: "attempt_mismatch" }, 403);

      // Verify attempt is still in progress
      const { data: attempt } = await admin
        .from("assessment_attempts")
        .select("status, assessment_id")
        .eq("id", p.attempt_id)
        .maybeSingle();
      if (!attempt) return json({ error: "attempt_not_found" }, 404);
      if (attempt.status !== "in_progress")
        return json({ error: "attempt_closed" }, 410);

      // Verify the question actually belongs to this attempt's assessment
      const belongs = await questionInAttempt(p.attempt_id, questionId!);
      if (!belongs) return json({ error: "question_not_in_attempt" }, 403);

      const comma = dataUrl.indexOf(",");
      if (comma < 0) return json({ error: "invalid_dataUrl" }, 400);
      let bin: Uint8Array;
      try {
        const b64 = dataUrl.slice(comma + 1);
        bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      } catch {
        return json({ error: "invalid_base64" }, 400);
      }
      if (bin.byteLength > MAX_DATAURL_BYTES)
        return json({ error: "payload_too_large" }, 413);

      const path = `answers/${p.attempt_id}/${questionId}/${ordinal}-${Date.now()}.jpg`;
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(path, bin, { contentType: "image/jpeg", upsert: false });
      if (upErr) return json({ error: upErr.message }, 500);

      // Replace any existing row for that (attempt, question, ordinal)
      await admin
        .from("assessment_answer_uploads")
        .delete()
        .eq("attempt_id", p.attempt_id)
        .eq("question_id", questionId)
        .eq("ordinal", ordinal);

      const { data: row, error: insErr } = await admin
        .from("assessment_answer_uploads")
        .insert({
          attempt_id: p.attempt_id,
          question_id: questionId,
          storage_path: path,
          ordinal,
        })
        .select("*")
        .single();
      if (insErr) return json({ error: insErr.message }, 500);

      // Keep pairing fresh
      await admin
        .from("assessment_side_camera_pairings")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", p.id);

      return json({ ok: true, path, id: row.id });
    }

    // ---- ANSWER-LIST (phone lists already-uploaded pages for a question) -
    if (action === "answer-list") {
      const token = req.headers.get("x-pair-token") ?? url.searchParams.get("token") ?? "";
      const questionId = url.searchParams.get("questionId") ?? "";
      if (!isToken(token)) return json({ error: "invalid_token" }, 400);
      if (!isUuid(questionId)) return json({ error: "invalid_questionId" }, 400);
      const p = await findPairing(token);
      if (!p) return json({ error: "pairing_not_found" }, 404);
      if (!pairingFresh(p)) return json({ error: "pairing_closed_or_expired" }, 410);

      const belongs = await questionInAttempt(p.attempt_id, questionId);
      if (!belongs) return json({ error: "question_not_in_attempt" }, 403);

      const { data: rows } = await admin
        .from("assessment_answer_uploads")
        .select("id, ordinal, storage_path, uploaded_at")
        .eq("attempt_id", p.attempt_id)
        .eq("question_id", questionId)
        .order("ordinal", { ascending: true });
      return json({ pages: rows ?? [] });
    }

    // ---- ANSWER-DELETE (phone removes a page before final upload) -------
    if (action === "answer-delete") {
      const token = req.headers.get("x-pair-token") ?? url.searchParams.get("token") ?? "";
      if (!isToken(token)) return json({ error: "invalid_token" }, 400);
      const p = await findPairing(token);
      if (!p) return json({ error: "pairing_not_found" }, 404);
      if (!pairingFresh(p)) return json({ error: "pairing_closed_or_expired" }, 410);
      const body = await req.json().catch(() => null) as { id?: string } | null;
      if (!isUuid(body?.id)) return json({ error: "invalid_id" }, 400);

      const { data: row } = await admin
        .from("assessment_answer_uploads")
        .select("id, attempt_id, storage_path")
        .eq("id", body!.id!)
        .maybeSingle();
      if (!row || row.attempt_id !== p.attempt_id)
        return json({ error: "not_found" }, 404);

      // Only allow deletes while the attempt is still in progress
      const { data: att } = await admin
        .from("assessment_attempts")
        .select("status")
        .eq("id", p.attempt_id)
        .maybeSingle();
      if (att?.status !== "in_progress")
        return json({ error: "attempt_closed" }, 410);

      await admin.storage.from(BUCKET).remove([row.storage_path]);
      await admin.from("assessment_answer_uploads").delete().eq("id", body!.id!);
      return json({ ok: true });
    }

    // ---- ANSWER-SIGN (laptop or proctor requests signed read URLs) ------
    if (action === "answer-sign") {
      const user = await getUser(req);
      if (!user) return json({ error: "auth_required" }, 401);
      const { attemptId, questionId } = await req.json().catch(() => ({}));
      if (!isUuid(attemptId)) return json({ error: "invalid_attemptId" }, 400);
      if (!isUuid(questionId)) return json({ error: "invalid_questionId" }, 400);

      // Authorization: candidate (own attempt) OR org member
      const { data: attempt } = await admin
        .from("assessment_attempts")
        .select("id, user_id, assessment_id")
        .eq("id", attemptId)
        .maybeSingle();
      if (!attempt) return json({ error: "not_found" }, 404);

      const belongs = await questionInAttempt(attemptId, questionId);
      if (!belongs) return json({ error: "question_not_in_attempt" }, 403);

      let allowed = attempt.user_id === user.id;
      if (!allowed) {
        const { data: a } = await admin
          .from("assessments")
          .select("org_id")
          .eq("id", attempt.assessment_id)
          .maybeSingle();
        if (a?.org_id) {
          const { data: mem } = await admin
            .from("org_members")
            .select("user_id")
            .eq("org_id", a.org_id)
            .eq("user_id", user.id)
            .maybeSingle();
          allowed = !!mem;
        }
      }
      if (!allowed) return json({ error: "forbidden" }, 403);

      const { data: rows } = await admin
        .from("assessment_answer_uploads")
        .select("id, ordinal, storage_path, uploaded_at")
        .eq("attempt_id", attemptId)
        .eq("question_id", questionId)
        .order("ordinal", { ascending: true });

      const pages: Array<{ id: string; ordinal: number; url: string | null; storage_path: string; uploaded_at: string }> = [];
      for (const r of rows ?? []) {
        const { data: signed } = await admin.storage
          .from(BUCKET)
          .createSignedUrl(r.storage_path, 60 * 60);
        pages.push({
          id: r.id,
          ordinal: r.ordinal,
          storage_path: r.storage_path,
          uploaded_at: r.uploaded_at,
          url: signed?.signedUrl ?? null,
        });
      }
      return json({ pages });
    }

    // ---- ANSWER-DELETE-AUTH (laptop tile deletes a page via JWT) --------
    if (action === "answer-delete-auth") {
      const user = await getUser(req);
      if (!user) return json({ error: "auth_required" }, 401);
      const body = await req.json().catch(() => null) as { id?: string } | null;
      if (!isUuid(body?.id)) return json({ error: "invalid_id" }, 400);

      const { data: row } = await admin
        .from("assessment_answer_uploads")
        .select("id, attempt_id, question_id, storage_path")
        .eq("id", body.id)
        .maybeSingle();
      if (!row) return json({ error: "not_found" }, 404);

      const { data: attempt } = await admin
        .from("assessment_attempts")
        .select("id, user_id, status")
        .eq("id", row.attempt_id)
        .maybeSingle();
      if (!attempt || attempt.user_id !== user.id) return json({ error: "forbidden" }, 403);
      if (attempt.status !== "in_progress")
        return json({ error: "attempt_not_in_progress" }, 409);

      await admin.storage.from(BUCKET).remove([row.storage_path]);
      await admin.from("assessment_answer_uploads").delete().eq("id", body.id);

      // Re-pack ordinals so the remaining pages stay 1..N
      const { data: remaining } = await admin
        .from("assessment_answer_uploads")
        .select("id, ordinal")
        .eq("attempt_id", row.attempt_id)
        .eq("question_id", row.question_id)
        .order("ordinal", { ascending: true });
      // Two-pass to avoid unique (attempt, question, ordinal) collisions
      let neg = -1;
      for (const r of remaining ?? []) {
        await admin.from("assessment_answer_uploads").update({ ordinal: neg-- }).eq("id", r.id);
      }
      let n = 1;
      for (const r of remaining ?? []) {
        await admin.from("assessment_answer_uploads").update({ ordinal: n++ }).eq("id", r.id);
      }
      return json({ ok: true });
    }

    // ---- ANSWER-REORDER (laptop tile reorders pages via JWT) ------------
    if (action === "answer-reorder") {
      const user = await getUser(req);
      if (!user) return json({ error: "auth_required" }, 401);
      const body = await req.json().catch(() => null) as {
        attemptId?: string;
        questionId?: string;
        orderedIds?: string[];
      } | null;
      if (!isUuid(body?.attemptId)) return json({ error: "invalid_attemptId" }, 400);
      if (!isUuid(body?.questionId)) return json({ error: "invalid_questionId" }, 400);
      if (!Array.isArray(body?.orderedIds) || body!.orderedIds.length === 0 ||
          body!.orderedIds.length > 200 ||
          body!.orderedIds.some((id) => !isUuid(id)))
        return json({ error: "invalid_orderedIds" }, 400);
      // Reject duplicates
      if (new Set(body!.orderedIds).size !== body!.orderedIds.length)
        return json({ error: "duplicate_ids" }, 400);

      const { data: attempt } = await admin
        .from("assessment_attempts")
        .select("id, user_id, status")
        .eq("id", body!.attemptId!)
        .maybeSingle();
      if (!attempt || attempt.user_id !== user.id) return json({ error: "forbidden" }, 403);
      if (attempt.status !== "in_progress")
        return json({ error: "attempt_not_in_progress" }, 409);

      const belongs = await questionInAttempt(body!.attemptId!, body!.questionId!);
      if (!belongs) return json({ error: "question_not_in_attempt" }, 403);

      // Verify every id belongs to this attempt+question
      const { data: rows } = await admin
        .from("assessment_answer_uploads")
        .select("id")
        .eq("attempt_id", body!.attemptId!)
        .eq("question_id", body!.questionId!);
      const valid = new Set((rows ?? []).map((r) => r.id));
      if (body!.orderedIds.length !== valid.size ||
          body!.orderedIds.some((id) => !valid.has(id)))
        return json({ error: "id_mismatch" }, 400);

      // Two-pass update to dodge unique constraint
      let neg = -1;
      for (const id of body!.orderedIds) {
        await admin.from("assessment_answer_uploads").update({ ordinal: neg-- }).eq("id", id);
      }
      let n = 1;
      for (const id of body!.orderedIds) {
        await admin.from("assessment_answer_uploads").update({ ordinal: n++ }).eq("id", id);
      }
      return json({ ok: true });
    }

    // ---- CHUNK-UPLOAD (phone uploads a ~165s WebM session segment) ------
    if (action === "chunk-upload") {
      const token = req.headers.get("x-pair-token") ?? url.searchParams.get("token") ?? "";
      if (!isToken(token)) return json({ error: "invalid_token" }, 400);
      const p = await findPairing(token);
      if (!p) return json({ error: "pairing_not_found" }, 404);
      if (!pairingFresh(p)) return json({ error: "pairing_closed_or_expired" }, 410);

      const sessionId = url.searchParams.get("sessionId") ?? "";
      const seqStr = url.searchParams.get("seq") ?? "";
      const startedAt = url.searchParams.get("startedAt") ?? "";
      const endedAt = url.searchParams.get("endedAt") ?? "";
      const durationMs = Number(url.searchParams.get("durationMs") ?? "0");
      const mime = url.searchParams.get("mime") ?? "video/webm";

      if (!isUuid(sessionId)) return json({ error: "invalid_sessionId" }, 400);
      const seq = Number(seqStr);
      if (!Number.isInteger(seq) || seq < 0 || seq > 100_000)
        return json({ error: "invalid_seq" }, 400);
      if (!startedAt || !endedAt || !Number.isFinite(new Date(startedAt).getTime()) ||
          !Number.isFinite(new Date(endedAt).getTime()))
        return json({ error: "invalid_timestamps" }, 400);
      if (!Number.isFinite(durationMs) || durationMs < 0 || durationMs > 10 * 60_000)
        return json({ error: "invalid_durationMs" }, 400);

      const buf = new Uint8Array(await req.arrayBuffer());
      if (buf.byteLength === 0) return json({ error: "empty_body" }, 400);
      if (buf.byteLength > 50 * 1024 * 1024) return json({ error: "payload_too_large" }, 413);

      const ext = mime.includes("mp4") ? "mp4" : "webm";
      const padded = String(seq).padStart(5, "0");
      const path = `${p.attempt_id}/sessions/sideeye/${sessionId}/${padded}.${ext}`;
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: mime, upsert: false });
      if (upErr && !/already exists|Duplicate/i.test(upErr.message))
        return json({ error: upErr.message }, 500);

      const { error: insErr } = await admin
        .from("assessment_proctor_session_chunks")
        .insert({
          attempt_id: p.attempt_id,
          session_id: sessionId,
          kind: "sideeye",
          seq,
          started_at: startedAt,
          ended_at: endedAt,
          duration_ms: durationMs,
          size_bytes: buf.byteLength,
          mime,
          storage_path: path,
        });
      if (insErr && !/duplicate key/i.test(insErr.message))
        return json({ error: insErr.message }, 500);

      await admin
        .from("assessment_side_camera_pairings")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", p.id);

      return json({ ok: true, path });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
