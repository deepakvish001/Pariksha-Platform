import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { pairingId } = await req.json();
    if (!pairingId) {
      return new Response(JSON.stringify({ error: "pairingId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pair } = await admin
      .from("contest_side_camera_pairings")
      .select("user_id, session_id")
      .eq("id", pairingId)
      .maybeSingle();
    if (!pair || pair.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect recovery from a long gap
    const { data: prevPair } = await admin
      .from("contest_side_camera_pairings")
      .select("last_heartbeat_at, status")
      .eq("id", pairingId)
      .maybeSingle();

    const now = Date.now();
    const prevTs = prevPair?.last_heartbeat_at ? new Date(prevPair.last_heartbeat_at).getTime() : now;
    const gapMs = now - prevTs;
    const recovered = prevPair?.status === "lost" || gapMs > 30_000;

    await admin
      .from("contest_side_camera_pairings")
      .update({
        last_heartbeat_at: new Date().toISOString(),
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", pairingId);

    await admin
      .from("contest_sessions")
      .update({ side_camera_status: "active" })
      .eq("id", pair.session_id);

    await admin.from("contest_side_camera_audit_logs").insert({
      session_id: pair.session_id,
      user_id: user.id,
      event_type: recovered ? "stream_recovered" : "heartbeat",
      severity: "info",
      detail: { gap_ms: gapMs },
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
