// Post-contest pairwise similarity scan.
// - Admin-only (verifies role server-side via the user JWT).
// - Accepts { contest_id, problem_slug?, autoflag_threshold?, autodq_threshold? }.
// - For each problem (or just one), pulls accepted contest submissions,
//   joins to code_submissions for the source, normalizes, and computes
//   pairwise Jaccard similarity on token n-grams as the cheap first pass.
// - Pairs above the AI threshold are re-scored with Gemini for a structured
//   verdict + rationale (so admins get human-readable "why").
// - Inserts/upserts contest_similarity_pairs.
// - Auto-DQ via contest_force_dq for sim >= autodq_threshold; auto-enroll
//   into viva queue for sim >= autoflag_threshold.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- similarity helpers ----------
function normalizeCode(src: string): string {
  // strip comments + collapse whitespace; keeps language-agnostic structure
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/.*$/gm, " ")
    .replace(/(^|\s)#.*$/gm, " ")
    .replace(/['"`][\s\S]*?['"`]/g, "STR")
    .replace(/\b\d+\b/g, "NUM")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenNgrams(src: string, n = 5): Set<string> {
  const tokens = src.match(/[a-z_][a-z0-9_]*|[(){}\[\];,.:+\-*/=<>!&|^%~?]/g) ?? [];
  const out = new Set<string>();
  for (let i = 0; i + n <= tokens.length; i++) {
    out.add(tokens.slice(i, i + n).join(" "));
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  const small = a.size < b.size ? a : b;
  const large = a.size < b.size ? b : a;
  for (const t of small) if (large.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

// ---------- AI re-scoring ----------
async function aiSimilarity(
  apiKey: string,
  codeA: string,
  codeB: string,
): Promise<{ similarity: number; rationale: string } | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a code-plagiarism reviewer. Compare two solutions to the same problem and decide how likely one was copied from the other (variable renames, reordering, comments stripped — still a copy).",
          },
          {
            role: "user",
            content: `Solution A:\n\n\`\`\`\n${codeA.slice(0, 6000)}\n\`\`\`\n\nSolution B:\n\n\`\`\`\n${codeB.slice(0, 6000)}\n\`\`\``,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_similarity",
              description: "Return similarity score and a short rationale.",
              parameters: {
                type: "object",
                properties: {
                  similarity: {
                    type: "number",
                    description: "0-1 — likelihood the two solutions share authorship/copying.",
                  },
                  rationale: {
                    type: "string",
                    description: "<=160 chars, what makes them similar/different.",
                  },
                },
                required: ["similarity", "rationale"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_similarity" } },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    const parsed = JSON.parse(args);
    const sim = Math.max(0, Math.min(1, Number(parsed.similarity) || 0));
    return { similarity: sim, rationale: String(parsed.rationale ?? "") };
  } catch (e) {
    console.warn("aiSimilarity failed", (e as Error).message);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const auth = req.headers.get("Authorization") ?? "";

    // Verify caller is admin using their JWT
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const contestId: string = body.contest_id;
    const problemSlug: string | undefined = body.problem_slug;
    const autoflag: number = typeof body.autoflag_threshold === "number" ? body.autoflag_threshold : 0.85;
    const autodq: number = typeof body.autodq_threshold === "number" ? body.autodq_threshold : 0.95;
    if (!contestId) return json({ error: "contest_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Pull accepted submissions for the contest (per problem)
    let q = admin
      .from("contest_submissions")
      .select("user_id, problem_slug, submission_id")
      .eq("contest_id", contestId)
      .eq("verdict", "Accepted")
      .not("submission_id", "is", null);
    if (problemSlug) q = q.eq("problem_slug", problemSlug);
    const { data: subs, error: subsErr } = await q;
    if (subsErr) return json({ error: subsErr.message }, 500);
    if (!subs || subs.length === 0) return json({ ok: true, scanned: 0, pairs: 0 });

    // Group by problem
    const byProblem = new Map<string, { user_id: string; submission_id: string }[]>();
    for (const s of subs) {
      const arr = byProblem.get(s.problem_slug) ?? [];
      arr.push({ user_id: s.user_id, submission_id: s.submission_id! });
      byProblem.set(s.problem_slug, arr);
    }

    let pairsInserted = 0;
    let scanned = 0;
    const dqUsers = new Set<string>();
    const vivaUsers = new Set<string>();

    for (const [slug, list] of byProblem.entries()) {
      // Fetch source code
      const ids = list.map((x) => x.submission_id);
      const { data: codes } = await admin
        .from("code_submissions")
        .select("id, source_code")
        .in("id", ids);
      const codeById = new Map<string, string>();
      for (const c of codes ?? []) codeById.set(c.id, c.source_code);

      // Pre-compute n-grams
      const tokens: { user_id: string; sub_id: string; src: string; ng: Set<string> }[] = [];
      for (const item of list) {
        const src = codeById.get(item.submission_id);
        if (!src) continue;
        const norm = normalizeCode(src);
        tokens.push({
          user_id: item.user_id,
          sub_id: item.submission_id,
          src,
          ng: tokenNgrams(norm, 5),
        });
      }

      for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          const A = tokens[i], B = tokens[j];
          if (A.user_id === B.user_id) continue;
          scanned++;
          const cheap = jaccard(A.ng, B.ng);
          if (cheap < 0.4) continue; // skip clearly distinct pairs

          let finalSim = cheap;
          let rationale = `Jaccard 5-gram = ${(cheap * 100).toFixed(0)}%`;
          if (cheap >= 0.6 && LOVABLE_API_KEY) {
            const ai = await aiSimilarity(LOVABLE_API_KEY, A.src, B.src);
            if (ai) {
              finalSim = Math.max(cheap, ai.similarity);
              rationale = ai.rationale;
            }
          }

          const [ua, ub, sa, sb] =
            A.user_id < B.user_id
              ? [A.user_id, B.user_id, A.sub_id, B.sub_id]
              : [B.user_id, A.user_id, B.sub_id, A.sub_id];

          let verdict: "clean" | "flag" | "dq" = "clean";
          if (finalSim >= autodq) verdict = "dq";
          else if (finalSim >= autoflag) verdict = "flag";

          // Upsert pair (unique-ish: same users + problem + submissions)
          const { error: upErr } = await admin
            .from("contest_similarity_pairs")
            .insert({
              contest_id: contestId,
              problem_slug: slug,
              user_a: ua,
              user_b: ub,
              submission_a: sa,
              submission_b: sb,
              similarity: finalSim,
              method: cheap >= 0.6 ? "gemini+jaccard" : "jaccard",
              verdict,
              rationale,
            });
          if (!upErr) pairsInserted++;

          if (verdict === "dq") {
            dqUsers.add(ua);
            dqUsers.add(ub);
          } else if (verdict === "flag") {
            vivaUsers.add(ua);
            vivaUsers.add(ub);
          }
        }
      }
    }

    // Apply consequences
    for (const uid of dqUsers) {
      await admin.rpc("contest_force_dq", {
        _contest_id: contestId,
        _user_id: uid,
        _reason: "auto: code similarity ≥ DQ threshold",
      });
    }
    if (vivaUsers.size > 0) {
      const rows = [...vivaUsers].map((uid) => ({
        contest_id: contestId,
        user_id: uid,
        problem_slug: problemSlug ?? null,
        reason: "Code similarity above flag threshold",
        source: "auto",
        status: "pending",
      }));
      await admin.from("contest_viva_queue").upsert(rows, {
        onConflict: "contest_id,user_id,problem_slug",
        ignoreDuplicates: true,
      });
    }

    return json({
      ok: true,
      scanned,
      pairs: pairsInserted,
      dq_users: dqUsers.size,
      viva_users: vivaUsers.size,
      thresholds: { autoflag, autodq },
    });
  } catch (e) {
    console.error("contest-similarity-scan error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
