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

    const { token, deviceUserAgent, deviceFingerprint } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pair, error: pErr } = await admin
      .from("contest_side_camera_pairings")
      .select("*")
      .eq("pairing_token", token)
      .maybeSingle();

    if (pErr || !pair) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (pair.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Token belongs to a different account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(pair.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await admin
      .from("contest_side_camera_pairings")
      .update({
        status: "paired",
        paired_at: new Date().toISOString(),
        last_heartbeat_at: new Date().toISOString(),
        device_user_agent: deviceUserAgent ?? null,
        device_fingerprint: deviceFingerprint ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pair.id);

    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("contest_sessions")
      .update({ side_camera_status: "paired" })
      .eq("id", pair.session_id);

    await admin.from("contest_side_camera_audit_logs").insert({
      session_id: pair.session_id,
      user_id: user.id,
      event_type: "paired",
      severity: "info",
      detail: { device_user_agent: deviceUserAgent ?? null, device_fingerprint: deviceFingerprint ?? null },
    });

    return new Response(
      JSON.stringify({ ok: true, sessionId: pair.session_id, pairingId: pair.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
