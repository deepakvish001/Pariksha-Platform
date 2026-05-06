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

    const { sessionId, storagePath, dataUrl, idempotencyKey } = await req.json();
    if (!sessionId || !storagePath || !dataUrl) {
      return new Response(JSON.stringify({ error: "sessionId, storagePath, dataUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin0 = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency: if the same key was processed before, return cached result.
    const idemKey = idempotencyKey ?? `${sessionId}:${storagePath}`;
    {
      const { data: existing } = await admin0
        .from("sideeye_idempotency")
        .select("result")
        .eq("key", idemKey)
        .eq("function_name", "contest-sideeye-frame-analyze")
        .maybeSingle();
      if (existing?.result) {
        return new Response(JSON.stringify({ ...existing.result, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
                confidence: { type: "string", enum: ["low", "medium", "high"], description: "Model confidence in the verdict; use low for ambiguous frames." },
                face_count: { type: "integer", description: "Number of human faces visible (0,1,2+)." },
                notes: { type: "string" },
              },
              required: ["extra_person", "secondary_device", "looking_down_at_notes", "candidate_absent", "earpiece_visible", "severity", "confidence", "face_count", "notes"],
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
      // Push to dead-letter queue so a cron retries up to 5x.
      const { data: sessRow } = await admin0
        .from("contest_sessions")
        .select("contest_id")
        .eq("id", sessionId)
        .maybeSingle();
      await admin0.from("sideeye_failed_analyses").insert({
        session_id: sessionId,
        contest_id: sessRow?.contest_id ?? null,
        payload: { storagePath, idemKey },
        error: `AI ${aiResp.status}: ${t.slice(0, 500)}`,
        retry_count: 0,
        next_retry_at: new Date(Date.now() + 60_000).toISOString(),
      });
      return new Response(JSON.stringify({ error: "AI analysis failed", queued: true }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const args = aiJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let summary: any = {};
    try { summary = args ? JSON.parse(args) : {}; } catch { summary = {}; }
    const severity = summary.severity ?? "info";
    let confidence: "low" | "medium" | "high" = (summary.confidence ?? "medium") as any;

    // Calibration-aware suppression: if a baseline exists for this session and
    // the current face_count matches the baseline (e.g. a static poster), demote
    // extra_person to low confidence to cut false positives.
    try {
      const { data: baseline } = await admin0
        .from("sideeye_calibration_baselines")
        .select("face_count_avg, room_fingerprint")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (baseline && typeof summary.face_count === "number" && typeof baseline.face_count_avg === "number") {
        const baseFaces = Math.round(Number(baseline.face_count_avg));
        if (summary.extra_person && summary.face_count <= baseFaces) {
          summary.extra_person = false;
          summary.notes = `[calibrated:matches baseline ${baseFaces}] ${summary.notes ?? ""}`.slice(0, 1000);
          confidence = "low";
        }
      }
    } catch (_) { /* ignore */ }

    const admin = admin0;

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

    // Append to tamper-evident evidence chain (SHA-256 linked).
    try {
      const { data: prev } = await admin
        .from("sideeye_evidence_chain")
        .select("seq, sha256")
        .eq("session_id", sessionId)
        .order("seq", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextSeq = (prev?.seq ?? 0) + 1;
      const prevHash = prev?.sha256 ?? "";
      const payload = { storage_path: storagePath, severity, summary };
      const enc = new TextEncoder().encode(prevHash + JSON.stringify(payload) + storagePath);
      const digest = await crypto.subtle.digest("SHA-256", enc);
      const sha256 = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      await admin.from("sideeye_evidence_chain").insert({
        session_id: sessionId,
        user_id: user.id,
        seq: nextSeq,
        kind: "frame",
        storage_path: storagePath,
        sha256,
        prev_hash: prevHash,
        payload,
      });
    } catch (chainErr) {
      console.warn("evidence chain append failed", chainErr);
    }


    // Load admin-configurable thresholds (singleton row).
    const { data: settings } = await admin
      .from("sideeye_notification_settings")
      .select("min_severity, escalate_kinds, recipient_user_ids, notify_all_admins")
      .eq("singleton", true)
      .maybeSingle();

    const minSev: string = settings?.min_severity ?? "medium";
    const escalateKinds: string[] = settings?.escalate_kinds ?? ["secondary_device", "candidate_absent"];
    const sevRank: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

    let findingSeverity: "info" | "warn" | "flag" | "fatal" =
      severity === "critical" ? "fatal" :
      severity === "high" ? "flag" :
      severity === "medium" ? "warn" : "info";

    // Force-escalate configured anomaly kinds to at least "flag" so admins are notified.
    const triggeredKind = escalateKinds.find((k) => !!summary[k]);
    if (triggeredKind && (findingSeverity === "info" || findingSeverity === "warn")) {
      findingSeverity = "flag";
    }

    // Suppress notifications below the admin-configured min severity.
    const meetsThreshold = (sevRank[severity] ?? 0) >= (sevRank[minSev] ?? 2);

    if (meetsThreshold && (findingSeverity === "warn" || findingSeverity === "flag" || findingSeverity === "fatal")) {
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
          confidence,
          phone_detected: !!summary.secondary_device,
          second_person_detected: !!summary.extra_person,
          earbuds_detected: !!summary.earpiece_visible,
          ai_summary: `Side camera: ${summary.notes ?? ""}`.slice(0, 1000),
          raw: { source: "side_camera", confidence, anomaly_kind: summary.secondary_device ? "secondary_device" : summary.candidate_absent ? "candidate_absent" : summary.extra_person ? "extra_person" : "side_camera", ...summary },
        });

        // Direct extra-recipient notifications (configurable list).
        const extraRecipients = settings?.recipient_user_ids ?? [];
        if (!settings?.notify_all_admins && extraRecipients.length > 0) {
          const rows = extraRecipients.map((uid: string) => ({
            user_id: uid,
            type: "contest_sideeye_finding",
            title: "Side camera anomaly",
            message: `Side camera flagged: ${summary.notes ?? triggeredKind ?? "anomaly"}`.slice(0, 500),
            data: {
              contest_id: sess.contest_id,
              session_id: sessionId,
              user_id: user.id,
              severity: findingSeverity,
              kind: triggeredKind ?? null,
            },
          }));
          await admin.from("notifications").insert(rows);
        }
      }
    }

    const result = { ok: true, summary, severity, confidence };
    // Cache for idempotency replays.
    await admin.from("sideeye_idempotency").upsert({
      key: idemKey,
      function_name: "contest-sideeye-frame-analyze",
      result,
    }, { onConflict: "key,function_name" });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
