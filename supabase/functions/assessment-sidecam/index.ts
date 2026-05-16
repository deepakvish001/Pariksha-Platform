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
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await userClient.auth.getUser();
  return data.user;
}

async function findPairing(token: string) {
  const { data } = await admin
    .from("assessment_side_camera_pairings")
    .select("*")
    .eq("pair_token", token)
    .maybeSingle();
  return data;
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
      return json({
        status: p.status,
        pairCode: p.pair_code,
        pairingId: p.id,
        attemptId: p.attempt_id,
        lastSeenAt: p.last_seen_at,
        pairedAt: p.paired_at,
      });
    }

    // ---- CONNECT (phone announces ready) ---------------------------------
    if (action === "connect") {
      const token = url.searchParams.get("token") ?? "";
      const p = await findPairing(token);
      if (!p) return json({ error: "not_found" }, 404);
      const now = new Date().toISOString();
      await admin
        .from("assessment_side_camera_pairings")
        .update({ status: "paired", paired_at: p.paired_at ?? now, last_seen_at: now })
        .eq("id", p.id);
      await admin.from("attempt_events").insert({
        attempt_id: p.attempt_id,
        kind: "side_eye_connected",
        payload: { pairingId: p.id } as never,
      });
      return json({ ok: true });
    }

    // ---- DISCONNECT ------------------------------------------------------
    if (action === "disconnect") {
      const token = url.searchParams.get("token") ?? "";
      const p = await findPairing(token);
      if (!p) return json({ error: "not_found" }, 404);
      await admin
        .from("assessment_side_camera_pairings")
        .update({ status: "disconnected" })
        .eq("id", p.id);
      await admin.from("attempt_events").insert({
        attempt_id: p.attempt_id,
        kind: "side_eye_lost",
        payload: { pairingId: p.id } as never,
      });
      return json({ ok: true });
    }

    // ---- UPLOAD (phone posts a JPEG every ~5s) ---------------------------
    if (action === "upload") {
      const token = req.headers.get("x-pair-token") ?? url.searchParams.get("token") ?? "";
      if (!token) return json({ error: "token required" }, 400);
      const p = await findPairing(token);
      if (!p) return json({ error: "not_found" }, 404);
      if (p.status === "disconnected" || p.status === "expired")
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

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
