import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Admin pause / resume of a SideEye session.
 * Body: { sessionId: string, action: "pause" | "resume", reason?: string }
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

    // Verify admin
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const sessionId = body?.sessionId as string | undefined;
    const action = body?.action as "pause" | "resume" | undefined;
    const reason = (body?.reason as string | undefined) ?? null;
    if (!sessionId || !action || !["pause", "resume"].includes(action)) {
      return json({ error: "sessionId and action ('pause'|'resume') required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "pause") {
      await admin.from("sideeye_session_pauses").insert({
        session_id: sessionId,
        paused_by: user.id,
        reason,
      });
      await admin.from("contest_side_camera_audit_logs").insert({
        session_id: sessionId,
        user_id: user.id,
        event_type: "session_paused",
        severity: "info",
        detail: { reason, paused_by: user.id },
      });
    } else {
      // Find latest open pause and close it
      const { data: openPause } = await admin
        .from("sideeye_session_pauses")
        .select("id")
        .eq("session_id", sessionId)
        .is("resumed_at", null)
        .order("paused_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (openPause?.id) {
        await admin
          .from("sideeye_session_pauses")
          .update({ resumed_at: new Date().toISOString() })
          .eq("id", openPause.id);
      }
      await admin.from("contest_side_camera_audit_logs").insert({
        session_id: sessionId,
        user_id: user.id,
        event_type: "session_resumed",
        severity: "info",
        detail: { resumed_by: user.id },
      });
    }

    return json({ ok: true });
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
