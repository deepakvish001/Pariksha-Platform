// Compute Placement Readiness Score (PRS) for the authenticated user.
// Aggregates DSA mastery, SRS retention, contest performance, resume score,
// and consistency (streak) into a single 0-100 score with breakdown.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function levelFor(score: number): string {
  if (score >= 85) return "interview-ready";
  if (score >= 70) return "advanced";
  if (score >= 50) return "intermediate";
  if (score >= 25) return "beginner";
  return "starter";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Pull signals in parallel
    const [quizRes, srsRes, contestRes, resumeRes, streakRes, xpRes] = await Promise.all([
      supabase.from("quiz_results").select("score,total_questions,accuracy,completed_at")
        .eq("user_id", userId).order("completed_at", { ascending: false }).limit(50),
      supabase.from("quiz_spaced_repetition").select("correct_streak,review_count")
        .eq("user_id", userId).limit(500),
      supabase.from("contest_submissions").select("verdict,points_awarded,submitted_at")
        .eq("user_id", userId).order("submitted_at", { ascending: false }).limit(100),
      supabase.from("resume_analyses").select("overall_score,created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
      supabase.from("arena_streaks").select("current_streak,longest_streak,last_active_date")
        .eq("user_id", userId).maybeSingle(),
      supabase.from("xp_transactions").select("amount").eq("user_id", userId),
    ]);

    const quizzes = quizRes.data ?? [];
    const srs = srsRes.data ?? [];
    const contests = contestRes.data ?? [];
    const resume = resumeRes.data?.[0];
    const streak = streakRes.data;
    const totalXp = (xpRes.data ?? []).reduce((a: number, r: any) => a + (r.amount ?? 0), 0);

    // --- DSA score: avg accuracy across last 20 quizzes scaled by volume
    const recentQuizzes = quizzes.slice(0, 20);
    const avgAcc = recentQuizzes.length
      ? recentQuizzes.reduce((a: number, q: any) => a + Number(q.accuracy ?? 0), 0) / recentQuizzes.length
      : 0;
    const volumeBoost = Math.min(20, quizzes.length); // up to +20
    const dsa_score = clamp(avgAcc * 0.8 + volumeBoost);

    // --- SRS score: % of cards with correct_streak >= 3 (mastered)
    const mastered = srs.filter((c: any) => (c.correct_streak ?? 0) >= 3).length;
    const srs_density = srs.length ? (mastered / srs.length) * 100 : 0;
    const srs_volume = Math.min(20, Math.floor(srs.length / 5));
    const srs_score = clamp(srs_density * 0.8 + srs_volume);

    // --- Contest score: accepted ratio + recent activity
    const accepted = contests.filter((c: any) => c.verdict === "accepted").length;
    const acceptedRatio = contests.length ? (accepted / contests.length) * 100 : 0;
    const contestActivity = Math.min(30, contests.length * 2);
    const contest_score = clamp(acceptedRatio * 0.7 + contestActivity);

    // --- Resume score: latest overall_score (0-100)
    const resume_score = clamp(resume?.overall_score ?? 0);

    // --- Consistency score: current streak (cap 30) + longest streak (cap 30) + recent active
    const cur = streak?.current_streak ?? 0;
    const lng = streak?.longest_streak ?? 0;
    const recentlyActive = streak?.last_active_date
      ? (Date.now() - new Date(streak.last_active_date).getTime()) / 86400000 < 3
      : false;
    const consistency_score = clamp((Math.min(30, cur) * 100) / 30 * 0.5 +
      (Math.min(30, lng) * 100) / 30 * 0.3 + (recentlyActive ? 20 : 0));

    // --- Weighted composite
    const score = clamp(
      dsa_score * 0.30 +
      srs_score * 0.15 +
      contest_score * 0.25 +
      resume_score * 0.15 +
      consistency_score * 0.15,
    );

    const breakdown = {
      signals: {
        quizzes: quizzes.length,
        srs_cards: srs.length,
        srs_mastered: mastered,
        contest_submissions: contests.length,
        contest_accepted: accepted,
        resume_overall: resume?.overall_score ?? null,
        current_streak: cur,
        longest_streak: lng,
        total_xp: totalXp,
      },
      weights: { dsa: 0.30, srs: 0.15, contest: 0.25, resume: 0.15, consistency: 0.15 },
    };

    const payload = {
      user_id: userId,
      score,
      dsa_score,
      srs_score,
      contest_score,
      resume_score,
      consistency_score,
      breakdown,
      level: levelFor(score),
      computed_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from("placement_readiness_scores")
      .upsert(payload, { onConflict: "user_id" });

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, prs: payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
