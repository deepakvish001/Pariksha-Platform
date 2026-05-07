// Edge function: contest-screen-frame-analyze
// Tier 5: Periodically samples the participant's screen-share and asks
// Gemini-vision to detect forbidden apps/windows visible on screen
// (ChatGPT, Copilot, Stack Overflow, second IDE, messaging apps, etc.).
// Inserts into `contest_screen_share_audits`. High-confidence detections
// log a `contest_violations` row so the existing strike system applies.
//
// Body: { contest_id: string, session_id: string, storage_path: string,
//         surface_kind?: 'monitor'|'window'|'browser'|'unknown' }

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
  session_id?: string;
  storage_path?: string;
  surface_kind?: "monitor" | "window" | "browser" | "unknown";
}

interface AiResult {
  forbidden_apps: string[];        // e.g. ["chatgpt", "copilot", "stackoverflow"]
  detected_windows: { name: string; confidence: number }[];
  is_forbidden: boolean;
  summary: string;
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
    if (!body?.contest_id || !body?.session_id || !body?.storage_path) {
      return json({ error: "contest_id, session_id, storage_path required" }, 400);
    }

    let result: AiResult = {
      forbidden_apps: [],
      detected_windows: [],
      is_forbidden: false,
      summary: "AI not configured.",
    };

    if (LOVABLE_API_KEY) {
      const { data: signed } = await admin.storage
        .from("contest-screen-frames")
        .createSignedUrl(body.storage_path, 60);
      if (!signed?.signedUrl) return json({ error: "Could not sign frame URL" }, 500);

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
                "You audit screenshots of a coding-contest participant's screen. Detect any visible window/app that is FORBIDDEN during a contest. Forbidden examples: ChatGPT, Claude, Gemini chat UI, GitHub Copilot Chat, Cursor chat, Phind, Perplexity, Stack Overflow, LeetCode/HackerRank/Codeforces problem pages, GeeksforGeeks, any messaging app (Discord/Slack/WhatsApp/Telegram/Teams), email client showing a question, a SECOND code editor not the contest UI, a PDF or doc with code. Allowed: the contest's own browser tab, a single terminal showing local compiler output, Parikshaa UI itself. Be conservative — only flag windows you can identify with text/logo/UI elements. Return only structured output.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Identify forbidden apps in this screenshot." },
                { type: "image_url", image_url: { url: signed.signedUrl } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_screen",
                description: "Return forbidden apps detected on screen",
                parameters: {
                  type: "object",
                  properties: {
                    forbidden_apps: {
                      type: "array",
                      items: { type: "string" },
                      description: "Short canonical names of forbidden apps detected",
                    },
                    detected_windows: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          confidence: { type: "number", minimum: 0, maximum: 1 },
                        },
                        required: ["name", "confidence"],
                        additionalProperties: false,
                      },
                    },
                    is_forbidden: { type: "boolean" },
                    summary: { type: "string", maxLength: 300 },
                  },
                  required: ["forbidden_apps", "detected_windows", "is_forbidden", "summary"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_screen" } },
        }),
      });

      if (aiResp.status === 429) return json({ error: "AI rate limited" }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted" }, 402);
      if (!aiResp.ok) {
        const t = await aiResp.text();
        console.error("ai error", aiResp.status, t);
      } else {
        const aiJson = await aiResp.json();
        const args = aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) result = JSON.parse(args) as AiResult;
      }
    }

    // Severity rubric:
    //   flag  — any forbidden_apps detected with high confidence
    //   warn  — surface_kind switched to 'window'/'browser' (caller decides)
    //   info  — clean
    const hasHighConf = result.detected_windows.some((w) => w.confidence >= 0.7);
    const severity: "info" | "warn" | "flag" =
      result.is_forbidden && hasHighConf
        ? "flag"
        : (body.surface_kind === "window" || body.surface_kind === "browser")
          ? "warn"
          : "info";

    await admin.from("contest_screen_share_audits").insert({
      contest_id: body.contest_id,
      user_id: userId,
      session_id: body.session_id,
      storage_path: body.storage_path,
      surface_kind: body.surface_kind ?? null,
      forbidden_apps: result.forbidden_apps,
      detected_windows: result.detected_windows,
      severity,
      ai_summary: result.summary,
    });

    if (severity === "flag") {
      await userClient.rpc("contest_log_violation", {
        _contest_id: body.contest_id,
        _session_id: body.session_id,
        _type: "forbidden_app_on_screen",
        _severity: "flag",
        _meta: {
          apps: result.forbidden_apps.slice(0, 8),
          windows: result.detected_windows.slice(0, 8),
        },
      });
    }

    return json({ severity, ...result });
  } catch (e) {
    console.error("contest-screen-frame-analyze error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
