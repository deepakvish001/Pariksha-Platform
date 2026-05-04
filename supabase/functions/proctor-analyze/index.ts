// Edge function: proctor-analyze
// Computes a trust score (0-100) for a contest participant by combining
// heuristic violation counts with a Lovable AI vision pass over the
// most recent webcam snapshots.
//
// Auth: requires a logged-in user (verify_jwt = true). The caller must
// be the participant or an admin of the contest.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  contest_id: string;
  session_id?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SERVICE);

    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = (await req.json()) as Body;
    if (!body?.contest_id) return json({ error: "contest_id required" }, 400);

    // Pull violations + recent snapshots
    const { data: violations } = await adminClient
      .from("contest_violations")
      .select("type, severity, created_at")
      .eq("contest_id", body.contest_id)
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 30 * 60_000).toISOString());

    const { data: snapshots } = await adminClient
      .from("contest_proctor_snapshots")
      .select("storage_path, captured_at")
      .eq("contest_id", body.contest_id)
      .eq("user_id", userId)
      .order("captured_at", { ascending: false })
      .limit(3);

    const { data: chunks } = await adminClient
      .from("contest_screen_recordings")
      .select("started_at")
      .eq("contest_id", body.contest_id)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(1);

    // Heuristic score
    const vCount = violations?.length ?? 0;
    const fsExits = (violations ?? []).filter((v) => v.type === "fullscreen_exit").length;
    const screenStops = (violations ?? []).filter((v) => v.type === "screen_share_stopped").length;
    let heuristic = 100 - 8 * vCount - 15 * fsExits - 25 * screenStops;
    const lastChunk = chunks?.[0]?.started_at ? new Date(chunks[0].started_at).getTime() : 0;
    if (Date.now() - lastChunk > 120_000) heuristic -= 20;
    heuristic = Math.max(0, Math.min(100, heuristic));

    // Optional AI vision pass (only when key + snapshots available)
    let aiMultiplier = 1.0;
    const reasons: string[] = [];
    if (vCount > 0) reasons.push(`${vCount} recent violations`);
    if (fsExits > 0) reasons.push(`${fsExits} fullscreen exit(s)`);
    if (screenStops > 0) reasons.push(`${screenStops} screen-share stop(s)`);

    if (LOVABLE_API_KEY && snapshots && snapshots.length > 0) {
      try {
        const imageContents: Array<{ type: string; image_url: { url: string } }> = [];
        for (const s of snapshots) {
          const { data: signed } = await adminClient.storage
            .from("contest-proctor")
            .createSignedUrl(s.storage_path, 60);
          if (signed?.signedUrl) {
            imageContents.push({ type: "image_url", image_url: { url: signed.signedUrl } });
          }
        }
        if (imageContents.length > 0) {
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
                    "You audit webcam snapshots from an online coding contest. Evaluate each image for: a single visible candidate face, no other people, no phones or secondary screens, eyes facing the screen. Be conservative — only flag clearly suspicious behavior.",
                },
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Rate trust 0-100 and list short reasons. Reply JSON only." },
                    ...imageContents,
                  ],
                },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "report",
                  description: "Return trust assessment",
                  parameters: {
                    type: "object",
                    properties: {
                      trust: { type: "integer", minimum: 0, maximum: 100 },
                      reasons: { type: "array", items: { type: "string" } },
                    },
                    required: ["trust", "reasons"],
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "report" } },
            }),
          });
          if (aiResp.ok) {
            const aiJson = await aiResp.json();
            const args = aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
            if (args) {
              const parsed = JSON.parse(args);
              if (typeof parsed.trust === "number") {
                aiMultiplier = Math.max(0.3, Math.min(1.0, parsed.trust / 100));
              }
              if (Array.isArray(parsed.reasons)) {
                reasons.push(...parsed.reasons.slice(0, 3));
              }
            }
          }
        }
      } catch (e) {
        console.error("ai vision pass failed", e);
      }
    }

    const final = Math.max(0, Math.min(100, Math.round(heuristic * aiMultiplier)));
    const risk = final >= 80 ? "low" : final >= 50 ? "medium" : "high";

    await adminClient.from("contest_trust_scores").insert({
      contest_id: body.contest_id,
      user_id: userId,
      session_id: body.session_id ?? null,
      score: final,
      risk,
      reasons,
    });

    return json({ ok: true, score: final, risk, reasons });
  } catch (e) {
    console.error("proctor-analyze error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
