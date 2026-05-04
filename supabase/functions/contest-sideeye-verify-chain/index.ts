import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Re-walks the SHA-256 evidence chain for a session and reports any breaks.
 * Returns: { ok, links, breaks: [{ seq, reason, expected?, got? }], intact }
 * Admin-only.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: roleRow } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const { sessionId } = await req.json();
    if (!sessionId) return json({ error: "sessionId required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: chain } = await admin
      .from("sideeye_evidence_chain")
      .select("seq, kind, storage_path, sha256, prev_hash, payload, created_at")
      .eq("session_id", sessionId)
      .order("seq", { ascending: true });

    const breaks: Array<{ seq: number; reason: string; expected?: string; got?: string }> = [];
    let prevHash = "";
    let expectedSeq = 1;

    for (const link of chain ?? []) {
      if (link.seq !== expectedSeq) {
        breaks.push({ seq: link.seq, reason: "seq_gap", expected: String(expectedSeq), got: String(link.seq) });
      }
      const enc = new TextEncoder().encode(
        prevHash + JSON.stringify(link.payload) + (link.storage_path ?? ""),
      );
      const digest = await crypto.subtle.digest("SHA-256", enc);
      const computed = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if ((link.prev_hash ?? "") !== prevHash) {
        breaks.push({ seq: link.seq, reason: "prev_hash_mismatch", expected: prevHash, got: link.prev_hash ?? "" });
      }
      if (link.sha256 !== computed) {
        breaks.push({ seq: link.seq, reason: "sha256_mismatch", expected: computed, got: link.sha256 });
      }
      prevHash = link.sha256;
      expectedSeq = link.seq + 1;
    }

    // Audit-log every verification run
    await admin.from("contest_side_camera_audit_logs").insert({
      session_id: sessionId,
      user_id: user.id,
      event_type: "chain_verified",
      severity: breaks.length === 0 ? "info" : "high",
      detail: {
        verified_by: user.id,
        links: (chain ?? []).length,
        breaks_count: breaks.length,
        intact: breaks.length === 0,
      },
    });

    return json({
      ok: true,
      session_id: sessionId,
      verified_at: new Date().toISOString(),
      verified_by: user.id,
      links: (chain ?? []).length,
      intact: breaks.length === 0,
      breaks,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
