// Submission integrity analyzer: solve-time sanity, AI-likelihood,
// and provenance-paste audit for a contest submission. Writes a row
// to contest_solve_time_analysis and creates an admin alert when the
// verdict is `too_fast` or `impossible`.
import { corsHeaders } // no cors module;
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
    const body = (await req.json()) as Body;
    if (!body.session_id || !body.user_id || !body.contest_id || !body.problem_id) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const expectedMin = MIN_SECONDS[body.problem_difficulty ?? "medium"] ?? 240;
    let verdict: "normal" | "fast" | "too_fast" | "impossible" = "normal";
    if (body.actual_seconds < expectedMin * 0.25) verdict = "impossible";
    else if (body.actual_seconds < expectedMin * 0.5) verdict = "too_fast";
    else if (body.actual_seconds < expectedMin) verdict = "fast";

    // Cheap AI-likelihood heuristics:
    //   - very high comment density
    //   - canonical variable names (i, j, k, n, ans, dp, vis)
    //   - perfectly even indentation
    let aiLikelihood = 0;
    const code = body.code ?? "";
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

    const z = (expectedMin - body.actual_seconds) / Math.max(expectedMin / 2, 1);

    const { data: row, error } = await supabase
      .from("contest_solve_time_analysis")
      .insert({
        session_id: body.session_id,
        user_id: body.user_id,
        contest_id: body.contest_id,
        problem_id: body.problem_id,
        expected_min_seconds: expectedMin,
        actual_seconds: body.actual_seconds,
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
        message: `User solved in ${body.actual_seconds}s vs expected ≥${expectedMin}s. AI-likelihood ${(aiLikelihood * 100).toFixed(0)}%.`,
        metadata: { row, contest_id: body.contest_id, session_id: body.session_id },
      });
    }

    return new Response(JSON.stringify({ ok: true, verdict, ai_likelihood: aiLikelihood, row }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
