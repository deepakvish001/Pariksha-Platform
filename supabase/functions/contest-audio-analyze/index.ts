// Edge function: contest-audio-analyze
// Receives a short audio snippet path (in `contest-audio` bucket) and runs
// Gemini multimodal audio analysis to (a) transcribe, (b) count distinct
// voices, (c) detect coaching/help-seeking keywords. Persists the result
// to `contest_audio_events` and logs a violation when severity ≥ 'flag'.
//
// Body: { contest_id: string, session_id: string, storage_path: string,
//         duration_sec?: number }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface Body {
  contest_id?: string;
  session_id?: string;
  storage_path?: string;
  duration_sec?: number;
}

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const { contest_id, session_id, storage_path, duration_sec }: Body = await req.json();
    if (!contest_id || !session_id || !storage_path) {
      return json({ error: "contest_id, session_id, storage_path required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Download the audio bytes (private bucket → service role) and base64 it
    // for the Gemini multimodal call.
    const { data: file, error: dlErr } = await admin.storage.from("contest-audio").download(storage_path);
    if (dlErr || !file) return json({ error: `download failed: ${dlErr?.message}` }, 500);
    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf.length > 5_000_000) return json({ error: "audio snippet too large (>5MB)" }, 413);
    // base64 encode without exceeding stack limits (chunked).
    let b64 = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < buf.length; i += chunkSize) {
      b64 += btoa(String.fromCharCode(...buf.subarray(i, i + chunkSize)));
    }
    const mimeType = storage_path.endsWith(".webm") ? "audio/webm"
      : storage_path.endsWith(".ogg") ? "audio/ogg"
      : storage_path.endsWith(".mp3") ? "audio/mpeg"
      : "audio/wav";

    let transcript = "";
    let voicesDetected: number | null = null;
    let coachingKeywords: string[] = [];
    let severity: "info" | "warn" | "flag" = "info";
    let analysis: Record<string, unknown> = {};

    if (LOVABLE_API_KEY) {
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
                "You audit audio snippets from an online coding contest. The participant should be alone and silent (or quietly thinking aloud). Detect: (1) any words spoken, (2) how many distinct human voices are present, (3) whether anyone is dictating code, asking another person for help, reading instructions to the candidate, or coaching them. Be conservative — background TV or ambient music is NOT coaching.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Analyze this short audio snippet from a contest participant." },
                {
                  type: "input_audio",
                  input_audio: { data: b64, format: mimeType.replace("audio/", "") },
                },
              ],
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "report_audio",
              description: "Return audio analysis",
              parameters: {
                type: "object",
                properties: {
                  transcript: { type: "string", maxLength: 2000 },
                  voices_detected: { type: "integer", minimum: 0, maximum: 10 },
                  coaching_keywords: { type: "array", items: { type: "string" } },
                  is_coaching: { type: "boolean" },
                  is_dictating_code: { type: "boolean" },
                  reasoning: { type: "string", maxLength: 300 },
                },
                required: ["transcript", "voices_detected", "is_coaching", "is_dictating_code"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "report_audio" } },
        }),
      });

      if (aiResp.status === 429) return json({ error: "AI rate limited" }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted" }, 402);

      if (aiResp.ok) {
        const aiJson = await aiResp.json();
        const args = aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) {
          try {
            const parsed = JSON.parse(args);
            transcript = parsed.transcript ?? "";
            voicesDetected = parsed.voices_detected ?? null;
            coachingKeywords = Array.isArray(parsed.coaching_keywords) ? parsed.coaching_keywords.slice(0, 10) : [];
            analysis = {
              is_coaching: !!parsed.is_coaching,
              is_dictating_code: !!parsed.is_dictating_code,
              reasoning: parsed.reasoning ?? "",
            };
            // Severity rubric:
            //   flag  — coaching detected OR ≥2 voices OR code dictation
            //   warn  — coaching keywords present
            //   info  — otherwise
            if (parsed.is_coaching || parsed.is_dictating_code || (voicesDetected ?? 0) >= 2) {
              severity = "flag";
            } else if (coachingKeywords.length > 0) {
              severity = "warn";
            }
          } catch {
            analysis = { parse_error: true };
          }
        }
      }
    }

    // Persist as the user
    await userClient.from("contest_audio_events").insert({
      contest_id,
      user_id: userId,
      session_id,
      storage_path,
      duration_sec: duration_sec ?? null,
      transcript,
      voices_detected: voicesDetected,
      coaching_keywords: coachingKeywords,
      severity,
      analysis,
    });

    if (severity === "flag") {
      await userClient.rpc("contest_log_violation", {
        _contest_id: contest_id,
        _session_id: session_id,
        _type: "audio_suspicious",
        _severity: "flag",
        _meta: {
          voices: voicesDetected,
          keywords: coachingKeywords.slice(0, 5),
          analysis,
        },
      });
    }

    return json({ severity, voices_detected: voicesDetected, transcript, coaching_keywords: coachingKeywords });
  } catch (e) {
    console.error("contest-audio-analyze error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
