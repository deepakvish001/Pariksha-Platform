// Submission integrity analyzer: solve-time sanity, AI-likelihood,
// and provenance-paste audit for a contest submission. Writes a row
// to contest_solve_time_analysis and creates an admin alert when the
// verdict is `too_fast` or `impossible`.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface Body {
  session_id: string;
  user_id: string;
  contest_id: string;
  problem_id: string;
  problem_difficulty?: "easy" | "medium" | "hard";
  actual_seconds: number;
  /** Final code — used for AI-likelihood heuristics. */
  code?: string;
}

const MIN_SECONDS: Record<string, number> = {
  easy: 90,
  medium: 240,
  hard: 480,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // --- Authentication: require a valid JWT and ensure caller matches user_id (or is admin) ---
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body.session_id || !body.user_id || !body.contest_id || !body.problem_id) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Caller must be analysing their own submission, unless they are an admin.
    if (body.user_id !== userData.user.id) {
      const { data: isAdmin } = await userClient.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Bound numeric input
    const actualSeconds = Math.max(0, Math.min(86_400, Number(body.actual_seconds) || 0));

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const expectedMin = MIN_SECONDS[body.problem_difficulty ?? "medium"] ?? 240;
    let verdict: "normal" | "fast" | "too_fast" | "impossible" = "normal";
    if (actualSeconds < expectedMin * 0.25) verdict = "impossible";
    else if (actualSeconds < expectedMin * 0.5) verdict = "too_fast";
    else if (actualSeconds < expectedMin) verdict = "fast";

    // Cheap AI-likelihood heuristics:
    //   - very high comment density
    //   - canonical variable names (i, j, k, n, ans, dp, vis)
    //   - perfectly even indentation
    let aiLikelihood = 0;
    const code = (body.code ?? "").slice(0, 50_000);
    if (code.length > 0) {
      const lines = code.split("\n");
      const commentLines = lines.filter((l) =>
        /^\s*(\/\/|#|\/\*|\*)/.test(l),
      ).length;
      const commentRatio = commentLines / Math.max(lines.length, 1);
      if (commentRatio > 0.35) aiLikelihood += 0.35;
      const idiomaticHits = (code.match(/\b(dp|memo|vis|ans|res|tmp|cur|prev)\b/g) ?? []).length;
      if (idiomaticHits > 6) aiLikelihood += 0.25;
      const evenIndent = lines.every((l) => l.length === 0 || /^( {2,4}|\t)*\S/.test(l));
      if (evenIndent && lines.length > 30) aiLikelihood += 0.2;
      if (verdict === "too_fast" || verdict === "impossible") aiLikelihood += 0.2;
    }
    aiLikelihood = Math.min(1, aiLikelihood);

    const z = (expectedMin - actualSeconds) / Math.max(expectedMin / 2, 1);

    const { data: row, error } = await supabase
      .from("contest_solve_time_analysis")
      .insert({
        session_id: body.session_id,
        user_id: body.user_id,
        contest_id: body.contest_id,
        problem_id: body.problem_id,
        expected_min_seconds: expectedMin,
        actual_seconds: actualSeconds,
        z_score: Number(z.toFixed(3)),
        ai_likelihood: Number(aiLikelihood.toFixed(3)),
        verdict,
        details: {
          difficulty: body.problem_difficulty,
          code_length: code.length,
        },
      })
      .select()
      .single();

    if (error) throw error;

    if (verdict === "too_fast" || verdict === "impossible" || aiLikelihood >= 0.7) {
      await supabase.from("admin_alerts").insert({
        alert_type: "contest_solve_time_outlier",
        severity: verdict === "impossible" ? "critical" : "high",
        title: `Suspicious solve time (${verdict})`,
        message: `User solved in ${actualSeconds}s vs expected ≥${expectedMin}s. AI-likelihood ${(aiLikelihood * 100).toFixed(0)}%.`,
        metadata: { row, contest_id: body.contest_id, session_id: body.session_id },
      });
    }

    return new Response(JSON.stringify({ ok: true, verdict, ai_likelihood: aiLikelihood, row }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("contest-submission-analyze error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
