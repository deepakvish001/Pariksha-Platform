import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Generates a downloadable JSON integrity report for a single side-camera session.
 * Aggregates pairings, frames (with severity breakdown), recordings,
 * audit logs, and any related proctor findings.
 *
 * Admin-only.
 */
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

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [
      { data: session },
      { data: pairings },
      { data: frames },
      { data: recordings },
      { data: audit },
      { data: findings },
      { data: chain },
      { data: pauses },
    ] = await Promise.all([
      admin.from("contest_sessions").select("*").eq("id", sessionId).maybeSingle(),
      admin.from("contest_side_camera_pairings").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
      admin.from("contest_side_camera_frames").select("*").eq("session_id", sessionId).order("captured_at", { ascending: true }),
      admin.from("contest_side_camera_recordings").select("*").eq("session_id", sessionId).order("started_at", { ascending: true }),
      admin.from("contest_side_camera_audit_logs").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
      admin.from("contest_proctor_findings").select("*").eq("session_id", sessionId).contains("raw", { source: "side_camera" }),
      admin.from("sideeye_evidence_chain").select("*").eq("session_id", sessionId).order("seq", { ascending: true }),
      admin.from("sideeye_session_pauses").select("*").eq("session_id", sessionId).order("paused_at", { ascending: true }),
    ]);

    const breakdown = (frames ?? []).reduce<Record<string, number>>((acc, f: any) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    }, {});

    const flagsByKind: Record<string, number> = {};
    for (const f of frames ?? []) {
      const s: any = (f as any).ai_summary ?? {};
      if (s.secondary_device) flagsByKind.secondary_device = (flagsByKind.secondary_device ?? 0) + 1;
      if (s.extra_person) flagsByKind.extra_person = (flagsByKind.extra_person ?? 0) + 1;
      if (s.candidate_absent) flagsByKind.candidate_absent = (flagsByKind.candidate_absent ?? 0) + 1;
      if (s.earpiece_visible) flagsByKind.earpiece_visible = (flagsByKind.earpiece_visible ?? 0) + 1;
      if (s.looking_down_at_notes) flagsByKind.looking_down_at_notes = (flagsByKind.looking_down_at_notes ?? 0) + 1;
    }

    const totalRecBytes = (recordings ?? []).reduce((sum: number, r: any) => sum + (r.byte_size ?? 0), 0);

    // Walk evidence chain to verify each link's hash.
    const chainBreaks: Array<{ seq: number; reason: string }> = [];
    let prevHash = "";
    for (const link of chain ?? []) {
      const expected = new TextEncoder().encode(
        prevHash + JSON.stringify(link.payload) + (link.storage_path ?? ""),
      );
      const digest = await crypto.subtle.digest("SHA-256", expected);
      const computed = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (link.prev_hash !== prevHash) chainBreaks.push({ seq: link.seq, reason: "prev_hash_mismatch" });
      if (link.sha256 !== computed) chainBreaks.push({ seq: link.seq, reason: "sha256_mismatch" });
      prevHash = link.sha256;
    }

    const report = {
      generated_at: new Date().toISOString(),
      generated_by: user.id,
      session: session ? {
        id: session.id, contest_id: session.contest_id, user_id: session.user_id,
        side_camera_required: session.side_camera_required,
        side_camera_status: session.side_camera_status,
        started_at: session.started_at, ended_at: session.ended_at,
      } : null,
      summary: {
        frames_total: (frames ?? []).length,
        recordings_total: (recordings ?? []).length,
        recording_bytes: totalRecBytes,
        pairings_total: (pairings ?? []).length,
        severity_breakdown: breakdown,
        flag_kind_breakdown: flagsByKind,
        findings_total: (findings ?? []).length,
        pauses_total: (pauses ?? []).length,
        evidence_chain_links: (chain ?? []).length,
        evidence_chain_intact: chainBreaks.length === 0,
        evidence_chain_breaks: chainBreaks,
      },
      pairings,
      recordings,
      audit_logs: audit,
      findings,
      pauses,
      evidence_chain: chain,
      frames: (frames ?? []).slice(-200),
    };

    await admin.from("contest_side_camera_audit_logs").insert({
      session_id: sessionId,
      user_id: session?.user_id ?? user.id,
      event_type: "report_generated",
      severity: "info",
      detail: { generated_by: user.id, summary: report.summary },
    });

    return new Response(JSON.stringify(report, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="sideeye-report-${sessionId}.json"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
