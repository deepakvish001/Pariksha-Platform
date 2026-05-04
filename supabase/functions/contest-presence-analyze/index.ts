// Edge function: contest-presence-analyze
// Tier 5: Continuous face/gaze/presence analysis. Pulls the most recent
// 1-3 webcam snapshots for the participant and asks Gemini-vision to
// extract structured findings (face count, gaze, phone, second screen,
// second person, earbuds). Inserts to `contest_proctor_findings` and
// — when severity is `flag` — also logs a `contest_violations` row so
// the existing strike system & admin alerts fire.
//
// Body: { contest_id: string, session_id?: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Body {
  contest_id?: string;
  session_id?: string | null;
}

interface AiFinding {
  face_count: number;
  gaze_direction: "on_screen" | "off_screen" | "unknown";
  phone_detected: boolean;
  second_screen_detected: boolean;
  second_person_detected: boolean;
  earbuds_detected: boolean;
  summary: string;
}

function severityFor(f: AiFinding): "info" | "warn" | "flag" {
  // Hard fails — flag immediately
  if (f.second_person_detected || f.phone_detected || f.second_screen_detected) return "flag";
  if (f.face_count === 0) return "warn";          // brief out-of-frame
  if (f.face_count >= 2) return "flag";           // someone helping
  if (f.gaze_direction === "off_screen") return "warn";
  if (f.earbuds_detected) return "warn";
  return "info";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: userData, error: uErr } = await userClient.auth.getUser();
    if (uErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = (await req.json()) as Body;
    if (!body?.contest_id) return json({ error: "contest_id required" }, 400);

    if (!LOVABLE_API_KEY) {
      return json({ skipped: true, reason: "AI key not configured" });
    }

    // Get latest 2 snapshots
    const { data: snaps } = await admin
      .from("contest_proctor_snapshots")
      .select("id, storage_path, captured_at")
      .eq("contest_id", body.contest_id)
      .eq("user_id", userId)
      .order("captured_at", { ascending: false })
      .limit(2);

    if (!snaps || snaps.length === 0) {
      return json({ skipped: true, reason: "no snapshots yet" });
    }

    // Sign URLs
    const imageContents: Array<{ type: string; image_url: { url: string } }> = [];
    for (const s of snaps) {
      const { data: signed } = await admin.storage
        .from("contest-proctor")
        .createSignedUrl(s.storage_path, 60);
      if (signed?.signedUrl) {
        imageContents.push({ type: "image_url", image_url: { url: signed.signedUrl } });
      }
    }
    if (imageContents.length === 0) {
      return json({ skipped: true, reason: "no readable snapshots" });
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
              "You audit webcam snapshots from a coding contest. Return strict structured findings only. Conservative: prefer 'unknown' or false over guesses. Do not invent objects you cannot clearly see. 'face_count' counts only clearly visible human faces. 'gaze_direction' is 'on_screen' if the candidate is looking roughly toward the camera/screen, 'off_screen' if clearly looking away for the majority of the frame, else 'unknown'. 'second_person_detected' requires a second clearly visible face or torso. 'phone_detected' requires a recognizable mobile phone in frame. 'second_screen_detected' requires a clearly visible additional monitor/TV/laptop screen behind or beside the candidate.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze these snapshots and return findings." },
              ...imageContents,
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_findings",
              description: "Return structured proctor findings",
              parameters: {
                type: "object",
                properties: {
                  face_count: { type: "integer", minimum: 0, maximum: 10 },
                  gaze_direction: { type: "string", enum: ["on_screen", "off_screen", "unknown"] },
                  phone_detected: { type: "boolean" },
                  second_screen_detected: { type: "boolean" },
                  second_person_detected: { type: "boolean" },
                  earbuds_detected: { type: "boolean" },
                  summary: { type: "string", maxLength: 300 },
                },
                required: [
                  "face_count", "gaze_direction", "phone_detected",
                  "second_screen_detected", "second_person_detected",
                  "earbuds_detected", "summary",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_findings" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "AI rate limited" }, 429);
    if (aiResp.status === 402) return json({ error: "AI credits exhausted" }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("ai error", aiResp.status, t);
      return json({ error: "AI error" }, 500);
    }

    const aiJson = await aiResp.json();
    const args = aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return json({ error: "AI returned no findings" }, 500);
    const finding: AiFinding = JSON.parse(args);
    const severity = severityFor(finding);

    await admin.from("contest_proctor_findings").insert({
      contest_id: body.contest_id,
      user_id: userId,
      session_id: body.session_id ?? null,
      snapshot_id: snaps[0].id,
      face_count: finding.face_count,
      gaze_direction: finding.gaze_direction,
      phone_detected: finding.phone_detected,
      second_screen_detected: finding.second_screen_detected,
      second_person_detected: finding.second_person_detected,
      earbuds_detected: finding.earbuds_detected,
      severity,
      ai_summary: finding.summary,
      raw: finding as unknown as Record<string, unknown>,
    });

    if (severity === "flag" && body.session_id) {
      await userClient.rpc("contest_log_violation", {
        _contest_id: body.contest_id,
        _session_id: body.session_id,
        _type: finding.second_person_detected
          ? "second_person_detected"
          : finding.phone_detected
            ? "phone_detected"
            : finding.second_screen_detected
              ? "second_screen_detected"
              : "presence_anomaly",
        _severity: "flag",
        _meta: finding as unknown as Record<string, unknown>,
      });
    }

    return json({ severity, ...finding });
  } catch (e) {
    console.error("contest-presence-analyze error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
