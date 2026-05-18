// Layer 6 — Post-attempt forensic chain seal.
//
// Two modes:
//
//   POST { mode: "seal", sessionId }
//     - Auth: candidate (own session) or admin / contest owner.
//     - Only valid after the session has ended (terminated_at OR submitted_at
//       OR contest.ends_at < now). Idempotent — first-write-wins.
//     - Collects forensic components, builds a deterministic canonical JSON,
//       computes sha256(root) and HMAC-SHA256(root, server_secret), persists
//       to contest_session_seals.
//
//   POST { mode: "verify", sessionId }
//     - Public read (anyone can verify integrity of a sealed session).
//     - Recomputes the root from current DB state, compares to stored
//       root_hash + HMAC. Returns { valid, expected_root, stored_root,
//       hmac_valid, drift: { componentName: { stored, current } } }.
//
// HMAC key: SUPABASE_SERVICE_ROLE_KEY (server-only, never leaves the function).
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type SupabaseAdmin = ReturnType<typeof createClient>;

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Stable JSON: sorted keys + no whitespace, so the hash is deterministic. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonical((value as Record<string, unknown>)[k])).join(",") + "}";
}

interface Components {
  session: Record<string, unknown>;
  violations: { count: number; head_hash: string };
  submissions: { count: number; head_hash: string };
  liveness: { count: number; passed: number; failed: number };
  behavioral: { calibrated: boolean; mean_inter_key_ms: number | null };
  sideeye: { chain_count: number; head_sha256: string | null };
}

async function buildComponents(admin: SupabaseAdmin, sessionId: string, contestId: string, userId: string): Promise<Components> {
  const [sessRes, vRes, subRes, livRes, baseRes, seRes] = await Promise.all([
    admin.from("contest_sessions")
      .select("id, contest_id, user_id, started_at, submitted_at, terminated_at, terminated_reason, is_active")
      .eq("id", sessionId).maybeSingle(),
    admin.from("contest_violations")
      .select("id, type, severity, created_at, meta")
      .eq("session_id", sessionId).order("created_at", { ascending: true }),
    admin.from("contest_submissions")
      .select("id, problem_id, verdict, created_at, score")
      .eq("session_id", sessionId).order("created_at", { ascending: true }),
    admin.from("contest_liveness_challenges")
      .select("id, challenge_type, status, responded_at")
      .eq("session_id", sessionId).order("issued_at", { ascending: true }),
    admin.from("contest_behavioral_baselines")
      .select("mean_inter_key_ms")
      .eq("session_id", sessionId).maybeSingle(),
    admin.from("sideeye_evidence_chain")
      .select("seq, sha256")
      .eq("session_id", sessionId).order("seq", { ascending: false }).limit(1),
  ]);

  const violations = (vRes.data ?? []) as Array<Record<string, unknown>>;
  const submissions = (subRes.data ?? []) as Array<Record<string, unknown>>;
  const liveness = (livRes.data ?? []) as Array<{ status: string }>;
  const sideeye = (seRes.data ?? []) as Array<{ seq: number; sha256: string }>;

  const vHead = await sha256Hex(canonical(violations));
  const sHead = await sha256Hex(canonical(submissions));

  return {
    session: {
      id: sessionId,
      contest_id: contestId,
      user_id: userId,
      started_at: sessRes.data?.started_at ?? null,
      submitted_at: sessRes.data?.submitted_at ?? null,
      terminated_at: sessRes.data?.terminated_at ?? null,
      terminated_reason: sessRes.data?.terminated_reason ?? null,
    },
    violations: { count: violations.length, head_hash: vHead },
    submissions: { count: submissions.length, head_hash: sHead },
    liveness: {
      count: liveness.length,
      passed: liveness.filter((l) => l.status === "passed").length,
      failed: liveness.filter((l) => l.status === "failed" || l.status === "timeout").length,
    },
    behavioral: {
      calibrated: !!baseRes.data,
      mean_inter_key_ms: baseRes.data ? Number(baseRes.data.mean_inter_key_ms) : null,
    },
    sideeye: {
      chain_count: sideeye[0]?.seq ?? 0,
      head_sha256: sideeye[0]?.sha256 ?? null,
    },
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const { mode, sessionId } = body as { mode: string; sessionId: string };
    if (!sessionId) return json({ error: "sessionId required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // ---- VERIFY (public) ----
    if (mode === "verify") {
      const { data: seal } = await admin.from("contest_session_seals")
        .select("*").eq("session_id", sessionId).maybeSingle();
      if (!seal) return json({ ok: false, error: "not_sealed" }, 404);

      const components = await buildComponents(admin, sessionId, seal.contest_id, seal.user_id);
      const expectedRoot = await sha256Hex(canonical(components));
      const expectedHmac = await hmacHex(SERVICE_KEY, expectedRoot);
      const valid = expectedRoot === seal.root_hash;
      const hmacValid = expectedHmac === seal.hmac;

      const stored = seal.components as Components;
      const drift: Record<string, { stored: unknown; current: unknown }> = {};
      for (const k of Object.keys(components) as Array<keyof Components>) {
        const cur = canonical(components[k]);
        const sto = canonical(stored?.[k]);
        if (cur !== sto) drift[k] = { stored: stored?.[k], current: components[k] };
      }

      return json({
        ok: true, valid, hmac_valid: hmacValid,
        stored_root: seal.root_hash, expected_root: expectedRoot,
        sealed_at: seal.sealed_at, drift,
      });
    }

    // ---- SEAL (auth required) ----
    if (mode === "seal") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ error: "Unauthorized" }, 401);

      const { data: session } = await admin.from("contest_sessions")
        .select("id, contest_id, user_id, submitted_at, terminated_at, started_at")
        .eq("id", sessionId).maybeSingle();
      if (!session) return json({ error: "not_found" }, 404);

      // Permission: owner candidate, contest creator, or platform admin.
      const isOwner = session.user_id === user.id;
      let canSeal = isOwner;
      if (!canSeal) {
        const { data: contest } = await admin.from("contests")
          .select("created_by, ends_at").eq("id", session.contest_id).maybeSingle();
        if (contest?.created_by === user.id) canSeal = true;
        if (!canSeal) {
          const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
          if (isAdmin) canSeal = true;
        }
      }
      if (!canSeal) return json({ error: "Forbidden" }, 403);

      // Session must be over.
      const { data: contestRow } = await admin.from("contests")
        .select("ends_at").eq("id", session.contest_id).maybeSingle();
      const ended = !!session.submitted_at || !!session.terminated_at
        || (contestRow?.ends_at && new Date(contestRow.ends_at).getTime() < Date.now());
      if (!ended) return json({ error: "session_not_ended" }, 409);

      // Idempotent — first-write-wins.
      const { data: existing } = await admin.from("contest_session_seals")
        .select("root_hash, hmac, sealed_at").eq("session_id", sessionId).maybeSingle();
      if (existing) return json({ ok: true, alreadySealed: true, ...existing });

      const components = await buildComponents(admin, sessionId, session.contest_id, session.user_id);
      const root = await sha256Hex(canonical(components));
      const hmac = await hmacHex(SERVICE_KEY, root);

      const { error } = await admin.from("contest_session_seals").insert({
        session_id: sessionId,
        contest_id: session.contest_id,
        user_id: session.user_id,
        root_hash: root,
        hmac,
        components,
        sealed_by: user.id,
      });
      if (error) {
        // Race against concurrent sealer — re-read.
        const { data: again } = await admin.from("contest_session_seals")
          .select("root_hash, hmac, sealed_at").eq("session_id", sessionId).maybeSingle();
        if (again) return json({ ok: true, alreadySealed: true, ...again });
        return json({ error: error.message }, 500);
      }

      return json({ ok: true, sealed: true, root_hash: root, hmac });
    }

    return json({ error: "unknown mode" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
