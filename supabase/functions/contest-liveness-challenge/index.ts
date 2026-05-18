// Layer 3 — Active liveness challenges.
//
// Two modes:
//   POST { mode: "issue", sessionId } → picks a random challenge type, inserts
//     a pending row, returns { challengeId, type, prompt, expiresAt }.
//   POST { mode: "submit", challengeId, imageDataUrl } → calls Gemini vision
//     to verify the candidate's webcam frame against the prompt. Updates the
//     row and, on failure / timeout, self-reports a critical violation so the
//     contest-violation-engine can auto-terminate the session.
//
// All requests verify Layer 5 signed transport when headers are present.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verifySignedRequest, readSignedHeaders } from "../_shared/contest-signing.ts";

type ChallengeType = "fingers" | "head_turn" | "color_card";

function randomChallenge(): { type: ChallengeType; prompt: Record<string, unknown> } {
  const r = Math.random();
  if (r < 0.5) {
    const n = 1 + Math.floor(Math.random() * 5); // 1..5 fingers
    return { type: "fingers", prompt: { count: n, hint: `Hold up exactly ${n} finger(s) to your webcam.` } };
  } else if (r < 0.85) {
    const dir = Math.random() < 0.5 ? "left" : "right";
    return { type: "head_turn", prompt: { direction: dir, hint: `Turn your head fully to the ${dir}.` } };
  } else {
    const colors = ["red", "green", "blue", "yellow"];
    const c = colors[Math.floor(Math.random() * colors.length)];
    return { type: "color_card", prompt: { color: c, hint: `Hold a ${c} object next to your face.` } };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};

    if (readSignedHeaders(req)) {
      const v = await verifySignedRequest(req, rawBody);
      if (!v.ok) return json({ error: `Invalid signature: ${v.reason}` }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // ---- ISSUE ----
    if (body.mode === "issue") {
      const sessionId: string | undefined = body.sessionId;
      if (!sessionId) return json({ error: "sessionId required" }, 400);

      const { data: session } = await admin
        .from("contest_sessions")
        .select("id, contest_id, user_id, is_active, terminated_at")
        .eq("id", sessionId)
        .maybeSingle();
      if (!session || session.user_id !== user.id) return json({ error: "Forbidden" }, 403);
      if (!session.is_active || session.terminated_at) return json({ error: "session not active" }, 410);

      // Skip if a pending challenge is already in flight.
      const { data: pending } = await admin
        .from("contest_liveness_challenges")
        .select("id")
        .eq("session_id", sessionId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (pending) return json({ ok: true, challengeId: pending.id, alreadyPending: true });

      const c = randomChallenge();
      const { data: inserted, error: insErr } = await admin
        .from("contest_liveness_challenges")
        .insert({
          session_id: sessionId,
          contest_id: session.contest_id,
          user_id: session.user_id,
          challenge_type: c.type,
          prompt: c.prompt,
        })
        .select("id, challenge_type, prompt, expires_at")
        .single();
      if (insErr) return json({ error: insErr.message }, 500);

      return json({
        ok: true,
        challengeId: inserted.id,
        type: inserted.challenge_type,
        prompt: inserted.prompt,
        expiresAt: inserted.expires_at,
      });
    }

    // ---- SUBMIT ----
    if (body.mode === "submit") {
      const challengeId: string | undefined = body.challengeId;
      const imageDataUrl: string | undefined = body.imageDataUrl;
      if (!challengeId || !imageDataUrl) return json({ error: "challengeId + imageDataUrl required" }, 400);
      if (!imageDataUrl.startsWith("data:image/") || imageDataUrl.length > 2_500_000) {
        return json({ error: "invalid image payload" }, 400);
      }

      const { data: ch } = await admin
        .from("contest_liveness_challenges")
        .select("id, session_id, contest_id, user_id, challenge_type, prompt, status, expires_at")
        .eq("id", challengeId)
        .maybeSingle();
      if (!ch || ch.user_id !== user.id) return json({ error: "Forbidden" }, 403);
      if (ch.status !== "pending") return json({ ok: true, status: ch.status, alreadyResolved: true });

      const expired = new Date(ch.expires_at).getTime() < Date.now();
      if (expired) {
        await admin.from("contest_liveness_challenges").update({
          status: "timeout",
          responded_at: new Date().toISOString(),
        }).eq("id", ch.id);
        await reportViolation(admin, ch, "high", "liveness_timeout", { challenge_type: ch.challenge_type });
        return json({ ok: false, status: "timeout" });
      }

      if (!LOVABLE_API_KEY) {
        return json({ error: "AI not configured" }, 500);
      }

      // Build a per-type verification prompt.
      const prompt = ch.prompt as Record<string, unknown>;
      let userText = "";
      const schemaProps: Record<string, unknown> = { pass: { type: "boolean" }, confidence: { type: "number" }, reason: { type: "string" } };
      if (ch.challenge_type === "fingers") {
        userText = `Count the number of extended fingers held up toward the camera by the visible person. Expected: ${prompt.count}. Pass only if the count matches exactly AND exactly one human face is visible.`;
        schemaProps.observed_count = { type: "integer" };
      } else if (ch.challenge_type === "head_turn") {
        userText = `The person should be turning their head fully to the ${prompt.direction}. Pass only if the head is clearly rotated to the ${prompt.direction} (ear visible, not just eyes glanced) AND exactly one face is visible.`;
        schemaProps.observed_direction = { type: "string" };
      } else {
        userText = `The person should be holding an object that is predominantly ${prompt.color} next to their face. Pass only if a clearly ${prompt.color} object is held within ~30cm of the face AND exactly one face is visible.`;
        schemaProps.observed_color = { type: "string" };
      }

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You verify a proctored liveness check. Be strict. Reply only via the tool call." },
            {
              role: "user",
              content: [
                { type: "text", text: userText },
                { type: "image_url", image_url: { url: imageDataUrl } },
              ],
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "verdict",
              parameters: { type: "object", properties: schemaProps, required: ["pass", "confidence", "reason"], additionalProperties: false },
            },
          }],
          tool_choice: { type: "function", function: { name: "verdict" } },
        }),
      });

      let verdict: { pass: boolean; confidence: number; reason: string } = { pass: false, confidence: 0, reason: "ai_unreachable" };
      if (aiResp.ok) {
        const j = await aiResp.json();
        const argStr = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        try { verdict = JSON.parse(argStr ?? "{}"); } catch { /* keep default */ }
      } else if (aiResp.status === 429) {
        return json({ error: "Rate limit, please retry" }, 429);
      } else if (aiResp.status === 402) {
        return json({ error: "AI credits exhausted" }, 402);
      }

      const passed = !!verdict.pass && (verdict.confidence ?? 0) >= 0.6;

      await admin.from("contest_liveness_challenges").update({
        status: passed ? "passed" : "failed",
        responded_at: new Date().toISOString(),
        ai_verdict: verdict as unknown as Record<string, unknown>,
      }).eq("id", ch.id);

      if (!passed) {
        await reportViolation(admin, ch, "critical", "liveness_failed", {
          challenge_type: ch.challenge_type,
          prompt: ch.prompt,
          verdict,
        });
      }

      return json({ ok: passed, verdict });
    }

    return json({ error: "unknown mode" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

async function reportViolation(
  admin: ReturnType<typeof createClient>,
  ch: { session_id: string; contest_id: string; user_id: string },
  severity: "warn" | "high" | "critical",
  type: string,
  meta: Record<string, unknown>,
) {
  try {
    await admin.from("contest_violations").insert({
      contest_id: ch.contest_id,
      user_id: ch.user_id,
      session_id: ch.session_id,
      type,
      severity,
      meta,
    });
  } catch { /* best-effort */ }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
