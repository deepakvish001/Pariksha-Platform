// Re-runs identity / honor checks for a single session and enqueues the
// participant into the viva queue if recent identity checks failed (>=95%
// confidence of mismatch) or other auto-flag heuristics trigger.
// Body: { contest_id: string, session_id: string }
// Admin-only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const contestId: string = body.contest_id;
    const sessionId: string = body.session_id;
    if (!contestId || !sessionId) return json({ error: "contest_id and session_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: session, error: sErr } = await admin
      .from("contest_sessions")
      .select("id, user_id, contest_id")
      .eq("id", sessionId)
      .single();
    if (sErr || !session) return json({ error: "session not found" }, 404);
    if (session.contest_id !== contestId) return json({ error: "contest mismatch" }, 400);

    // Recent identity checks for this session
    const { data: checks } = await admin
      .from("contest_identity_checks")
      .select("id, verdict, match_score, kind, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(20);

    const failed = (checks ?? []).filter((c) => c.verdict === "failed");
    const lowMatch = (checks ?? []).filter(
      (c) => typeof c.match_score === "number" && c.match_score < 0.5,
    );

    // Recent fatal/flag violations on this session
    const { data: violations } = await admin
      .from("contest_violations")
      .select("id, type, severity, created_at")
      .eq("session_id", sessionId)
      .in("severity", ["flag", "fatal"])
      .order("created_at", { ascending: false })
      .limit(20);

    const enqueue = failed.length > 0 || lowMatch.length > 0 || (violations ?? []).length > 0;

    let vivaInserted = 0;
    if (enqueue) {
      const reasonParts: string[] = [];
      if (failed.length) reasonParts.push(`${failed.length} failed identity check(s)`);
      if (lowMatch.length) reasonParts.push(`${lowMatch.length} low-match selfie(s)`);
      if ((violations ?? []).length) reasonParts.push(`${(violations ?? []).length} flagged violation(s)`);

      const { error: insErr } = await admin
        .from("contest_viva_queue")
        .upsert(
          {
            contest_id: contestId,
            user_id: session.user_id,
            problem_slug: null,
            reason: `Admin viva re-scan: ${reasonParts.join(", ")}`,
            source: "auto",
            status: "pending",
          },
          { onConflict: "contest_id,user_id,problem_slug", ignoreDuplicates: false },
        );
      if (!insErr) vivaInserted = 1;
    }

    return json({
      ok: true,
      session_id: sessionId,
      checks_reviewed: (checks ?? []).length,
      failed_checks: failed.length,
      low_match_checks: lowMatch.length,
      flagged_violations: (violations ?? []).length,
      enqueued_to_viva: vivaInserted > 0,
    });
  } catch (e) {
    console.error("contest-viva-scan error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
