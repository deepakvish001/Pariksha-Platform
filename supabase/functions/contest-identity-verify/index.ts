// Edge function: contest-identity-verify
// Compares a participant's selfie against either (a) their submitted ID
// document (initial check at honor-code time) or (b) a recent webcam snapshot
// (periodic re-check). Uses Lovable AI Gemini vision via tool calling for
// face-match scoring. Persists the result to `contest_identity_checks` and
// logs a violation if verdict === 'failed'.
//
// Body: { contest_id: string, session_id?: string, kind: 'initial' | 'recheck',
//         selfie_path: string, id_document_path?: string }
// Returns: { verdict: 'verified'|'failed'|'pending', match_score, reasoning }

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
  session_id?: string | null;
  kind?: "initial" | "recheck";
  selfie_path?: string;
  id_document_path?: string | null;
  // For rechecks where the comparison reference is an existing snapshot path
  // in `contest-proctor` rather than an ID document.
  reference_snapshot_path?: string | null;
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

    const body: Body = await req.json();
    const { contest_id, session_id, kind = "initial", selfie_path, id_document_path, reference_snapshot_path } = body;
    if (!contest_id || typeof contest_id !== "string") return json({ error: "contest_id required" }, 400);
    if (!selfie_path || typeof selfie_path !== "string") return json({ error: "selfie_path required" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve reference path: ID for initial, snapshot for recheck (fallback ID).
    const refPath = kind === "recheck" ? (reference_snapshot_path ?? id_document_path) : id_document_path;
    if (!refPath) return json({ error: "reference image (id_document_path or reference_snapshot_path) required" }, 400);

    // Sign both image URLs (60s) so the Gemini API can fetch them.
    const selfieBucket = "contest-identity";
    const refBucket = kind === "recheck" && reference_snapshot_path ? "contest-proctor" : "contest-identity";

    const [selfieSigned, refSigned] = await Promise.all([
      admin.storage.from(selfieBucket).createSignedUrl(selfie_path, 60),
      admin.storage.from(refBucket).createSignedUrl(refPath, 60),
    ]);
    if (selfieSigned.error || !selfieSigned.data?.signedUrl) {
      return json({ error: `Could not sign selfie: ${selfieSigned.error?.message}` }, 500);
    }
    if (refSigned.error || !refSigned.data?.signedUrl) {
      return json({ error: `Could not sign reference: ${refSigned.error?.message}` }, 500);
    }

    let matchScore: number | null = null;
    let verdict: "verified" | "failed" | "pending" = "pending";
    let reasoning = "AI not configured";

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
                "You verify identity for an online coding contest. You receive two images: a selfie and a reference (either a government ID photo or a prior webcam snapshot). Compare the faces. Be conservative: only return a high score if you are confident the same person is in both images. If either image is blurry, partially obscured, has multiple people, or shows no face, return a low score with reasoning.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: `Selfie (current) and reference (${kind === "initial" ? "government ID" : "prior snapshot"}). Compare and score.` },
                { type: "image_url", image_url: { url: selfieSigned.data.signedUrl } },
                { type: "image_url", image_url: { url: refSigned.data.signedUrl } },
              ],
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "report_match",
              description: "Return identity-match assessment",
              parameters: {
                type: "object",
                properties: {
                  match_score: { type: "number", minimum: 0, maximum: 1, description: "Confidence 0..1 that selfie and reference are the same person" },
                  same_person: { type: "boolean" },
                  reasoning: { type: "string", maxLength: 400 },
                  flags: {
                    type: "array",
                    items: { type: "string", enum: ["multiple_faces", "no_face", "blurry", "obscured", "lighting"] },
                  },
                },
                required: ["match_score", "same_person", "reasoning"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "report_match" } },
        }),
      });

      if (aiResp.status === 429) return json({ error: "AI rate limited, try again shortly" }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted" }, 402);

      if (aiResp.ok) {
        const aiJson = await aiResp.json();
        const args = aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) {
          try {
            const parsed = JSON.parse(args);
            matchScore = typeof parsed.match_score === "number" ? parsed.match_score : null;
            reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning : "ok";
            // Verdict thresholds: ≥0.75 verified, <0.4 failed, otherwise pending (manual review)
            if (matchScore !== null) {
              if (parsed.same_person && matchScore >= 0.75) verdict = "verified";
              else if (matchScore < 0.4 || parsed.same_person === false) verdict = "failed";
              else verdict = "pending";
            }
          } catch {
            reasoning = "AI response parse failed";
          }
        }
      } else {
        reasoning = `AI gateway error ${aiResp.status}`;
      }
    }

    // Persist as the user (so RLS user-insert-own applies) — use the user-scoped client.
    const insertRes = await userClient
      .from("contest_identity_checks")
      .insert({
        contest_id,
        user_id: userId,
        session_id: session_id ?? null,
        kind,
        selfie_path,
        id_document_path: id_document_path ?? null,
        match_score: matchScore,
        verdict,
        reasoning,
      })
      .select("id")
      .single();

    if (insertRes.error) {
      console.error("contest_identity_checks insert failed:", insertRes.error);
    }

    // Failed verdict → log a violation (severity 'flag')
    if (verdict === "failed" && session_id) {
      await userClient.rpc("contest_log_violation", {
        _contest_id: contest_id,
        _session_id: session_id,
        _type: "identity_mismatch",
        _severity: "flag",
        _meta: { match_score: matchScore, kind },
      });
    }

    return json({ verdict, match_score: matchScore, reasoning });
  } catch (e) {
    console.error("contest-identity-verify error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
