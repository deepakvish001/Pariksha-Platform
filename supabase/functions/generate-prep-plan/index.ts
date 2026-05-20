// Generate a company-targeted prep plan using Lovable AI Gateway.
// Input: target_company_id (must belong to caller). Reads target row, the user's
// current PRS, and produces a weekly study plan (jsonb) saved to company_prep_plans.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const targetId = body?.target_company_id as string | undefined;
    if (!targetId) {
      return new Response(JSON.stringify({ error: "target_company_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: target, error: tErr } = await supabase
      .from("target_companies").select("*").eq("id", targetId).eq("user_id", userId).maybeSingle();
    if (tErr || !target) {
      return new Response(JSON.stringify({ error: "Target not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prs } = await supabase
      .from("placement_readiness_scores").select("*").eq("user_id", userId).maybeSingle();

    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are a senior placement coach for Indian tech students. Output a JSON plan ONLY (no prose). Schema:
{
  "summary": string,
  "focus_areas": string[],
  "weeks": [{ "week": number, "theme": string, "goals": string[], "topics": string[], "problems": string[], "deliverables": string[] }]
}`;

    const user = `Target: ${target.company_name} — ${target.role}
Timeline: ${target.timeline_weeks} weeks
Current Placement Readiness Score: ${prs?.score ?? "unknown"} (DSA ${prs?.dsa_score ?? "?"} / SRS ${prs?.srs_score ?? "?"} / Contest ${prs?.contest_score ?? "?"} / Resume ${prs?.resume_score ?? "?"} / Consistency ${prs?.consistency_score ?? "?"}).
Notes: ${target.notes ?? "none"}

Build a ${target.timeline_weeks}-week plan tailored to ${target.company_name}'s known interview pattern. Prioritize the user's weakest sub-scores. Each week must have 3-6 specific DSA topics, 5-10 problem titles, and at least one deliverable (mock interview, project, mock contest, etc.).`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI error: ${t.slice(0, 200)}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let plan: any;
    try { plan = JSON.parse(content); } catch { plan = { raw: content }; }

    const { data: saved, error: upErr } = await supabase
      .from("company_prep_plans")
      .insert({
        user_id: userId,
        target_company_id: targetId,
        plan,
        model: "google/gemini-2.5-flash",
        generated_at: new Date().toISOString(),
      })
      .select().maybeSingle();

    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, plan: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
