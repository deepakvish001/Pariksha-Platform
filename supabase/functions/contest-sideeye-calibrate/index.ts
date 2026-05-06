// Edge function: contest-sideeye-calibrate
// Records a 60-second pre-contest baseline for a candidate's side-camera view.
// The client sends a small set of sampled frames (data URLs); the function asks
// Lovable AI to count visible faces and describe the room, then stores the
// rolling average + a room fingerprint. This baseline is later used by
// `contest-sideeye-frame-analyze` to suppress false-positive "extra person"
// flags caused by static posters or family photos in the room.
//
// Body: { sessionId: string, contestId: string, samples: string[] (data URLs, max 6) }
// Returns: { ok: true, face_count_avg: number, sample_count: number }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { sessionId, contestId, samples } = await req.json();
    if (!sessionId || !contestId || !Array.isArray(samples) || samples.length === 0) {
      return json({ error: "sessionId, contestId, samples[] required" }, 400);
    }
    const limited = samples.slice(0, 6);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    let totalFaces = 0;
    let counted = 0;
    let fingerprint = "";

    for (const dataUrl of limited) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You analyze a side-angle webcam baseline frame. Return only via the tool call." },
            {
              role: "user",
              content: [
                { type: "text", text: "Baseline calibration frame. Count human faces visible and describe the room briefly." },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "baseline",
              parameters: {
                type: "object",
                properties: {
                  face_count: { type: "integer" },
                  room_summary: { type: "string", description: "<=120 chars: layout, lighting, fixed objects." },
                },
                required: ["face_count", "room_summary"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "baseline" } },
        }),
      });
      if (!aiResp.ok) continue;
      const j = await aiResp.json();
      const argStr = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      try {
        const a = JSON.parse(argStr ?? "{}");
        if (typeof a.face_count === "number") {
          totalFaces += a.face_count;
          counted += 1;
        }
        if (a.room_summary) fingerprint += a.room_summary + "|";
      } catch (_) { /* ignore */ }
    }

    if (counted === 0) return json({ error: "All baseline frames failed analysis" }, 502);

    const faceAvg = totalFaces / counted;

    // Hash the fingerprint to a stable short string
    const enc = new TextEncoder().encode(fingerprint);
    const digest = await crypto.subtle.digest("SHA-256", enc);
    const fpHash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await admin.from("sideeye_calibration_baselines").upsert({
      session_id: sessionId,
      contest_id: contestId,
      user_id: user.id,
      baseline: { fingerprint_raw: fingerprint.slice(0, 1000) },
      face_count_avg: faceAvg,
      lighting_profile: null,
      room_fingerprint: fpHash,
      sample_count: counted,
      captured_at: new Date().toISOString(),
    }, { onConflict: "session_id" });

    return json({ ok: true, face_count_avg: faceAvg, sample_count: counted });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
