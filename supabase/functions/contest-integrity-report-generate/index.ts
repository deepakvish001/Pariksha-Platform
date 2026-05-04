// Auto-generates / refreshes a contest_integrity_reports row by
// aggregating all proctoring signals for a contest:
//  - sessions count
//  - flagged sessions (admin_alerts severity high+)
//  - DQ count (contest_dq_signoffs status='approved')
//  - viva count (contest_viva_queue)
//  - top reasons / breakdown by signal type
// Admin-only (verifies role server-side).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface Body { contest_id: string; publish?: boolean }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = (await req.json()) as Body;
    const supabase = createClient(supabaseUrl, serviceKey);

    const [
      sessionsRes,
      dqRes,
      vivaRes,
      alertsRes,
      signoffsRes,
      solveRes,
      crossRes,
    ] = await Promise.all([
      supabase.from("contest_sessions").select("*", { count: "exact", head: true }).eq("contest_id", body.contest_id),
      supabase.from("contest_dq_signoffs").select("*", { count: "exact", head: true }).eq("contest_id", body.contest_id).eq("status", "approved"),
      supabase.from("contest_viva_queue").select("*", { count: "exact", head: true }).eq("contest_id", body.contest_id),
      supabase.from("admin_alerts").select("alert_type, severity").contains("metadata", { contest_id: body.contest_id }).limit(500),
      supabase.from("contest_dq_signoffs").select("proposed_reason").eq("contest_id", body.contest_id),
      supabase.from("contest_solve_time_analysis").select("verdict").eq("contest_id", body.contest_id),
      supabase.from("contest_cross_similarity").select("similarity, match_source").eq("source_contest_id", body.contest_id),
    ]);

    const alerts = alertsRes.data ?? [];
    const flaggedCount = alerts.filter((a: { severity: string }) => a.severity === "high" || a.severity === "critical").length;
    const alertBreakdown: Record<string, number> = {};
    alerts.forEach((a: { alert_type: string }) => { alertBreakdown[a.alert_type] = (alertBreakdown[a.alert_type] ?? 0) + 1; });
    const verdictBreakdown: Record<string, number> = {};
    (solveRes.data ?? []).forEach((s: { verdict: string }) => { verdictBreakdown[s.verdict] = (verdictBreakdown[s.verdict] ?? 0) + 1; });
    const crossSourceBreakdown: Record<string, number> = {};
    (crossRes.data ?? []).forEach((c: { match_source: string }) => { crossSourceBreakdown[c.match_source] = (crossSourceBreakdown[c.match_source] ?? 0) + 1; });
    const dqReasons: Record<string, number> = {};
    (signoffsRes.data ?? []).forEach((s: { proposed_reason: string }) => { dqReasons[s.proposed_reason] = (dqReasons[s.proposed_reason] ?? 0) + 1; });

    const summary = {
      generated_at: new Date().toISOString(),
      alerts_total: alerts.length,
      alert_breakdown: alertBreakdown,
      solve_time_breakdown: verdictBreakdown,
      cross_similarity_breakdown: crossSourceBreakdown,
      dq_reason_breakdown: dqReasons,
    };

    const upsert = {
      contest_id: body.contest_id,
      total_participants: sessionsRes.count ?? 0,
      flagged_count: flaggedCount,
      dq_count: dqRes.count ?? 0,
      viva_count: vivaRes.count ?? 0,
      summary,
      is_published: body.publish === true,
      published_at: body.publish ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("contest_integrity_reports")
      .upsert(upsert, { onConflict: "contest_id" })
      .select()
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, report: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
