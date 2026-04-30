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
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { functionName = null, limit = 50 } = await req.json().catch(() => ({}));
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    // Pull recent edge function HTTP logs from analytics
    const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
    const filterClause = functionName
      ? `WHERE event_message ILIKE '%${String(functionName).replace(/[^a-zA-Z0-9_-]/g, "")}%'`
      : "";

    const sql = `
      SELECT id, function_edge_logs.timestamp, event_message,
             response.status_code, request.method,
             m.function_id, m.execution_time_ms
      FROM function_edge_logs
        CROSS JOIN UNNEST(metadata) AS m
        CROSS JOIN UNNEST(m.response) AS response
        CROSS JOIN UNNEST(m.request) AS request
      ${filterClause}
      ORDER BY timestamp DESC
      LIMIT ${safeLimit}
    `;

    const url = `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/logs.all?sql=${encodeURIComponent(sql)}`;
    const apiKey = Deno.env.get("SUPABASE_MGMT_API_KEY");

    if (!apiKey) {
      // Fallback: return empty result with hint instead of erroring
      return new Response(
        JSON.stringify({
          data: [],
          warning:
            "Analytics access requires SUPABASE_MGMT_API_KEY secret. Showing empty result.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const json = await res.json();
    return new Response(JSON.stringify(json), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
