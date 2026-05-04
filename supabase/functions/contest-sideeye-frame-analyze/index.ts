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

    const { sessionId, storagePath, dataUrl } = await req.json();
    if (!sessionId || !storagePath || !dataUrl) {
      return new Response(JSON.stringify({ error: "sessionId, storagePath, dataUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a remote-proctoring vision analyzer. Analyze a side-angle photo of a candidate's room (1-2m from candidate). Detect: extra people, secondary phones/tablets/monitors visible, candidate looking down at notes, candidate absent from chair, earpieces. Reply via the report_finding tool only.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this side-camera frame." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_finding",
            description: "Report what is visible in this side-camera frame.",
            parameters: {
              type: "object",
              properties: {
                extra_person: { type: "boolean" },
                secondary_device: { type: "boolean" },
                looking_down_at_notes: { type: "boolean" },
                candidate_absent: { type: "boolean" },
                earpiece_visible: { type: "boolean" },
                severity: { type: "string", enum: ["info", "low", "medium", "high", "critical"] },
                notes: { type: "string" },
              },
              required: ["extra_person", "secondary_device", "looking_down_at_notes", "candidate_absent", "earpiece_visible", "severity", "notes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_finding" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const args = aiJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let summary: any = {};
    try { summary = args ? JSON.parse(args) : {}; } catch { summary = {}; }
    const severity = summary.severity ?? "info";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await admin.from("contest_side_camera_frames").insert({
      session_id: sessionId,
      user_id: user.id,
      storage_path: storagePath,
      ai_summary: summary,
      severity,
    });

    // Audit log every analyzed frame
    await admin.from("contest_side_camera_audit_logs").insert({
      session_id: sessionId,
      user_id: user.id,
      event_type: "frame_analyzed",
      severity,
      detail: { storage_path: storagePath, summary },
    });

    // Force-escalate the two anomalies the user explicitly cares about:
    // secondary device sighting and empty chair (candidate absent).
    let findingSeverity: "info" | "warn" | "flag" | "fatal" =
      severity === "critical" ? "fatal" :
      severity === "high" ? "flag" :
      severity === "medium" ? "warn" : "info";

    if (summary.secondary_device || summary.candidate_absent) {
      // bump to at least "flag" — this triggers admin notifications
      // via existing trg_notify_proctor_finding_flag.
      if (findingSeverity === "info" || findingSeverity === "warn") {
        findingSeverity = "flag";
      }
    }

    if (findingSeverity === "warn" || findingSeverity === "flag" || findingSeverity === "fatal") {
      const { data: sess } = await admin
        .from("contest_sessions")
        .select("contest_id")
        .eq("id", sessionId)
        .maybeSingle();

      if (sess?.contest_id) {
        await admin.from("contest_proctor_findings").insert({
          contest_id: sess.contest_id,
          session_id: sessionId,
          user_id: user.id,
          severity: findingSeverity,
          phone_detected: !!summary.secondary_device,
          second_person_detected: !!summary.extra_person,
          earbuds_detected: !!summary.earpiece_visible,
          ai_summary: `Side camera: ${summary.notes ?? ""}`.slice(0, 1000),
          raw: { source: "side_camera", anomaly_kind: summary.secondary_device ? "secondary_device" : summary.candidate_absent ? "candidate_absent" : summary.extra_person ? "extra_person" : "side_camera", ...summary },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, summary, severity }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
