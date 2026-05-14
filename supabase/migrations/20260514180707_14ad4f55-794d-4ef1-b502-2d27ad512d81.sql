
-- =========================================================================
-- 1. quiz_results: lock down to owner-only reads, expose leaderboards via RPCs
-- =========================================================================

DROP POLICY IF EXISTS "Authenticated users can view quiz results for leaderboard" ON public.quiz_results;

CREATE POLICY "Users can view their own quiz results"
ON public.quiz_results
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Per-quiz-type leaderboard (used by QuizLeaderboard.tsx).
-- Returns top-N rows joined with public profile info. STABLE so it can be cached.
CREATE OR REPLACE FUNCTION public.get_quiz_leaderboard(
  p_quiz_type      text,
  p_difficulty     text DEFAULT NULL,
  p_since          timestamptz DEFAULT NULL,
  p_order_by_total boolean DEFAULT false,
  p_limit          integer DEFAULT 20
)
RETURNS TABLE (
  id                  uuid,
  user_id             uuid,
  quiz_type           text,
  score               integer,
  total_questions     integer,
  accuracy            numeric,
  avg_time_seconds    integer,
  total_time_seconds  integer,
  completed_at        timestamptz,
  full_name           text,
  avatar_url          text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qr.id,
    qr.user_id,
    qr.quiz_type,
    qr.score,
    qr.total_questions,
    qr.accuracy,
    qr.avg_time_seconds,
    qr.total_time_seconds,
    qr.completed_at,
    p.full_name,
    p.avatar_url
  FROM public.quiz_results qr
  LEFT JOIN public.profiles p ON p.user_id = qr.user_id
  WHERE qr.quiz_type = p_quiz_type
    AND (p_difficulty IS NULL OR qr.difficulty = p_difficulty)
    AND (p_since IS NULL OR qr.completed_at >= p_since)
  ORDER BY
    qr.accuracy DESC,
    CASE WHEN p_order_by_total THEN qr.total_time_seconds ELSE qr.avg_time_seconds END ASC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

-- Aggregated fundamentals leaderboard (used by FundamentalsLeaderboard.tsx).
-- p_type: 'all' | 'languages' | 'oops'
CREATE OR REPLACE FUNCTION public.get_fundamentals_leaderboard(
  p_type  text DEFAULT 'all',
  p_since timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  user_id          uuid,
  full_name        text,
  avatar_url       text,
  total_quizzes    bigint,
  total_score      bigint,
  total_questions  bigint,
  avg_accuracy     integer,
  best_accuracy    integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT qr.user_id, qr.score, qr.total_questions, qr.accuracy
    FROM public.quiz_results qr
    WHERE (p_since IS NULL OR qr.completed_at >= p_since)
      AND CASE p_type
            WHEN 'languages' THEN qr.quiz_type LIKE 'language-%'
            WHEN 'oops'      THEN qr.quiz_type LIKE 'oops-%'
            ELSE (qr.quiz_type LIKE 'language-%' OR qr.quiz_type LIKE 'oops-%')
          END
  ),
  agg AS (
    SELECT
      f.user_id,
      COUNT(*)                          AS total_quizzes,
      SUM(f.score)::bigint              AS total_score,
      SUM(f.total_questions)::bigint    AS total_questions,
      ROUND(AVG(f.accuracy))::integer   AS avg_accuracy,
      ROUND(MAX(f.accuracy))::integer   AS best_accuracy
    FROM filtered f
    GROUP BY f.user_id
  )
  SELECT
    a.user_id,
    p.full_name,
    p.avatar_url,
    a.total_quizzes,
    a.total_score,
    a.total_questions,
    a.avg_accuracy,
    a.best_accuracy
  FROM agg a
  LEFT JOIN public.profiles p ON p.user_id = a.user_id
  ORDER BY a.avg_accuracy DESC, a.total_quizzes DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

-- Restrict execution to signed-in users; revoke from anon.
REVOKE ALL ON FUNCTION public.get_quiz_leaderboard(text, text, timestamptz, boolean, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_fundamentals_leaderboard(text, timestamptz, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quiz_leaderboard(text, text, timestamptz, boolean, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fundamentals_leaderboard(text, timestamptz, integer) TO authenticated;


-- =========================================================================
-- 2. user_achievements: remove client-side INSERT, add server-side validator
-- =========================================================================

DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;

-- Recomputes which achievements the calling user has actually earned by
-- reading their real quiz_results and user_topic_progress data (server-trusted).
-- Inserts any earned-but-not-yet-recorded achievements and returns the new IDs
-- so the client can render the celebration UI.
CREATE OR REPLACE FUNCTION public.award_earned_achievements()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing text[];
  v_earned text[] := ARRAY[]::text[];
  v_topics_completed integer;
  v_revision_topics integer;
  v_streak integer;
  v_quiz_streak integer;
  v_dates date[];
  v_d date;
  v_prev date;
  v_run integer;
  -- quiz aggregates
  v_perfect_count integer;
  v_speed_demon_count integer;
  v_hard_count integer;
  v_acc80_count integer;
  v_perfect_aptitude boolean;
  v_perfect_dsa boolean;
  v_perfect_sql boolean;
  -- fundamentals
  v_fund_count integer;
  v_fund_acc80 integer;
  v_fund_mastery integer;
  v_fund_streak integer;
  -- system design
  v_sd_count integer;
  v_sd_acc80 integer;
  v_sd_hld_perfect boolean;
  v_sd_lld_perfect boolean;
  -- research
  v_research_count integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT COALESCE(array_agg(achievement_id), ARRAY[]::text[])
    INTO v_existing
    FROM public.user_achievements
   WHERE user_id = v_user;

  -- ---------- topic / streak / revision metrics ----------
  SELECT COUNT(*) FILTER (WHERE completed),
         COUNT(*) FILTER (WHERE is_revision)
    INTO v_topics_completed, v_revision_topics
    FROM public.user_topic_progress
   WHERE user_id = v_user;

  -- consecutive-day completion streak
  SELECT COALESCE(array_agg(DISTINCT (updated_at AT TIME ZONE 'UTC')::date ORDER BY (updated_at AT TIME ZONE 'UTC')::date DESC), ARRAY[]::date[])
    INTO v_dates
    FROM public.user_topic_progress
   WHERE user_id = v_user AND completed;
  v_streak := 0;
  v_prev := (now() AT TIME ZONE 'UTC')::date;
  v_run := 0;
  FOREACH v_d IN ARRAY v_dates LOOP
    IF v_run = 0 AND (v_d = v_prev OR v_d = v_prev - 1) THEN
      v_run := 1;
      v_prev := v_d;
    ELSIF v_d = v_prev - 1 THEN
      v_run := v_run + 1;
      v_prev := v_d;
    ELSIF v_d = v_prev THEN
      CONTINUE;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  v_streak := v_run;

  -- ---------- quiz aggregates ----------
  SELECT
    COUNT(*) FILTER (WHERE accuracy = 100),
    COUNT(*) FILTER (WHERE avg_time_seconds < 15),
    COUNT(*) FILTER (WHERE difficulty = 'Hard'),
    COUNT(*) FILTER (WHERE accuracy >= 80),
    bool_or(accuracy = 100 AND quiz_type = 'aptitude'),
    bool_or(accuracy = 100 AND quiz_type = 'dsa'),
    bool_or(accuracy = 100 AND quiz_type = 'sql')
  INTO v_perfect_count, v_speed_demon_count, v_hard_count, v_acc80_count,
       v_perfect_aptitude, v_perfect_dsa, v_perfect_sql
  FROM public.quiz_results WHERE user_id = v_user;

  -- quiz-day streak
  SELECT COALESCE(array_agg(DISTINCT (completed_at AT TIME ZONE 'UTC')::date ORDER BY (completed_at AT TIME ZONE 'UTC')::date DESC), ARRAY[]::date[])
    INTO v_dates
    FROM public.quiz_results WHERE user_id = v_user;
  v_quiz_streak := 0;
  v_prev := (now() AT TIME ZONE 'UTC')::date;
  v_run := 0;
  FOREACH v_d IN ARRAY v_dates LOOP
    IF v_run = 0 AND (v_d = v_prev OR v_d = v_prev - 1) THEN
      v_run := 1; v_prev := v_d;
    ELSIF v_d = v_prev - 1 THEN
      v_run := v_run + 1; v_prev := v_d;
    ELSIF v_d = v_prev THEN
      CONTINUE;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  v_quiz_streak := v_run;

  -- ---------- fundamentals (language-* / oops-*) ----------
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE accuracy >= 80),
    (SELECT COUNT(DISTINCT quiz_type) FROM public.quiz_results
       WHERE user_id = v_user
         AND (quiz_type LIKE 'language-%' OR quiz_type LIKE 'oops-%')
         AND accuracy >= 90)
  INTO v_fund_count, v_fund_acc80, v_fund_mastery
  FROM public.quiz_results
  WHERE user_id = v_user
    AND (quiz_type LIKE 'language-%' OR quiz_type LIKE 'oops-%');

  -- fundamentals-day streak
  SELECT COALESCE(array_agg(DISTINCT (completed_at AT TIME ZONE 'UTC')::date ORDER BY (completed_at AT TIME ZONE 'UTC')::date DESC), ARRAY[]::date[])
    INTO v_dates
    FROM public.quiz_results
   WHERE user_id = v_user
     AND (quiz_type LIKE 'language-%' OR quiz_type LIKE 'oops-%');
  v_fund_streak := 0; v_prev := (now() AT TIME ZONE 'UTC')::date; v_run := 0;
  FOREACH v_d IN ARRAY v_dates LOOP
    IF v_run = 0 AND (v_d = v_prev OR v_d = v_prev - 1) THEN
      v_run := 1; v_prev := v_d;
    ELSIF v_d = v_prev - 1 THEN
      v_run := v_run + 1; v_prev := v_d;
    ELSIF v_d = v_prev THEN
      CONTINUE;
    ELSE EXIT;
    END IF;
  END LOOP;
  v_fund_streak := v_run;

  -- ---------- system design (hld-* / lld-*) ----------
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE accuracy >= 80),
    bool_or(accuracy = 100 AND quiz_type LIKE 'hld-%'),
    bool_or(accuracy = 100 AND quiz_type LIKE 'lld-%')
  INTO v_sd_count, v_sd_acc80, v_sd_hld_perfect, v_sd_lld_perfect
  FROM public.quiz_results
  WHERE user_id = v_user
    AND (quiz_type LIKE 'hld-%' OR quiz_type LIKE 'lld-%');

  -- ---------- research (job-portal-*) ----------
  SELECT COUNT(*) INTO v_research_count
  FROM public.quiz_results
  WHERE user_id = v_user AND quiz_type LIKE 'job-portal-%';

  -- ---------- evaluate every known achievement_id ----------
  -- Helper inline: append to v_earned if condition holds and not already owned.
  -- topics_completed milestones
  IF v_topics_completed >= 1   AND NOT ('first_topic'  = ANY(v_existing)) THEN v_earned := v_earned || 'first_topic'; END IF;
  IF v_topics_completed >= 10  AND NOT ('topics_10'    = ANY(v_existing)) THEN v_earned := v_earned || 'topics_10';   END IF;
  IF v_topics_completed >= 50  AND NOT ('topics_50'    = ANY(v_existing)) THEN v_earned := v_earned || 'topics_50';   END IF;
  IF v_topics_completed >= 100 AND NOT ('topics_100'   = ANY(v_existing)) THEN v_earned := v_earned || 'topics_100';  END IF;
  IF v_topics_completed >= 250 AND NOT ('topics_250'   = ANY(v_existing)) THEN v_earned := v_earned || 'topics_250';  END IF;
  IF v_topics_completed >= 500 AND NOT ('topics_500'   = ANY(v_existing)) THEN v_earned := v_earned || 'topics_500';  END IF;
  -- streak_days
  IF v_streak >= 3  AND NOT ('streak_3'  = ANY(v_existing)) THEN v_earned := v_earned || 'streak_3';  END IF;
  IF v_streak >= 7  AND NOT ('streak_7'  = ANY(v_existing)) THEN v_earned := v_earned || 'streak_7';  END IF;
  IF v_streak >= 14 AND NOT ('streak_14' = ANY(v_existing)) THEN v_earned := v_earned || 'streak_14'; END IF;
  IF v_streak >= 30 AND NOT ('streak_30' = ANY(v_existing)) THEN v_earned := v_earned || 'streak_30'; END IF;
  -- revision
  IF v_revision_topics >= 10 AND NOT ('revision_10' = ANY(v_existing)) THEN v_earned := v_earned || 'revision_10'; END IF;
  IF v_revision_topics >= 50 AND NOT ('revision_50' = ANY(v_existing)) THEN v_earned := v_earned || 'revision_50'; END IF;
  -- quiz
  IF v_perfect_count >= 1     AND NOT ('quiz_perfect_score' = ANY(v_existing)) THEN v_earned := v_earned || 'quiz_perfect_score'; END IF;
  IF v_speed_demon_count >= 1 AND NOT ('quiz_speed_demon'   = ANY(v_existing)) THEN v_earned := v_earned || 'quiz_speed_demon';   END IF;
  IF v_hard_count >= 5        AND NOT ('quiz_brain_master'  = ANY(v_existing)) THEN v_earned := v_earned || 'quiz_brain_master';  END IF;
  IF v_acc80_count >= 10      AND NOT ('quiz_accuracy_80'   = ANY(v_existing)) THEN v_earned := v_earned || 'quiz_accuracy_80';   END IF;
  IF v_quiz_streak >= 5       AND NOT ('quiz_streak_5'      = ANY(v_existing)) THEN v_earned := v_earned || 'quiz_streak_5';      END IF;
  IF v_perfect_aptitude AND v_perfect_dsa AND v_perfect_sql
                              AND NOT ('quiz_triple_crown'  = ANY(v_existing)) THEN v_earned := v_earned || 'quiz_triple_crown';  END IF;
  -- fundamentals
  IF v_fund_count >= 1   AND NOT ('fundamentals_first_quiz'    = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_first_quiz';    END IF;
  IF v_fund_count >= 5   AND NOT ('fundamentals_quiz_5'        = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_quiz_5';        END IF;
  IF v_fund_count >= 20  AND NOT ('fundamentals_quiz_20'       = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_quiz_20';       END IF;
  IF v_fund_acc80 >= 5   AND NOT ('fundamentals_accuracy_80'   = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_accuracy_80';   END IF;
  IF v_fund_acc80 >= 10  AND NOT ('fundamentals_accuracy_90'   = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_accuracy_90';   END IF;
  IF v_fund_count >= 1 AND EXISTS (SELECT 1 FROM public.quiz_results
       WHERE user_id = v_user AND (quiz_type LIKE 'language-%' OR quiz_type LIKE 'oops-%') AND accuracy = 100)
                          AND NOT ('fundamentals_perfect'      = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_perfect';      END IF;
  IF v_fund_mastery >= 1 AND NOT ('fundamentals_mastery'        = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_mastery';      END IF;
  IF v_fund_mastery >= 2 AND NOT ('fundamentals_master'         = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_master';       END IF;
  IF v_fund_streak >= 7  AND NOT ('fundamentals_streak_7'       = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_streak_7';     END IF;
  IF v_fund_streak >= 14 AND NOT ('fundamentals_streak_14'      = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_streak_14';    END IF;
  IF v_fund_streak >= 30 AND NOT ('fundamentals_streak_30'      = ANY(v_existing)) THEN v_earned := v_earned || 'fundamentals_streak_30';    END IF;
  -- system design
  IF v_sd_count >= 1   AND NOT ('system_design_first_quiz'   = ANY(v_existing)) THEN v_earned := v_earned || 'system_design_first_quiz';   END IF;
  IF v_sd_count >= 5   AND NOT ('system_design_quiz_5'       = ANY(v_existing)) THEN v_earned := v_earned || 'system_design_quiz_5';       END IF;
  IF v_sd_count >= 15  AND NOT ('system_design_quiz_15'      = ANY(v_existing)) THEN v_earned := v_earned || 'system_design_quiz_15';      END IF;
  IF v_sd_acc80 >= 5   AND NOT ('system_design_accuracy_80'  = ANY(v_existing)) THEN v_earned := v_earned || 'system_design_accuracy_80';  END IF;
  IF v_sd_acc80 >= 10  AND NOT ('system_design_accuracy_90'  = ANY(v_existing)) THEN v_earned := v_earned || 'system_design_accuracy_90';  END IF;
  IF v_sd_hld_perfect  AND NOT ('system_design_hld_perfect'  = ANY(v_existing)) THEN v_earned := v_earned || 'system_design_hld_perfect';  END IF;
  IF v_sd_lld_perfect  AND NOT ('system_design_lld_perfect'  = ANY(v_existing)) THEN v_earned := v_earned || 'system_design_lld_perfect';  END IF;
  IF v_sd_hld_perfect AND v_sd_lld_perfect AND NOT ('system_design_master' = ANY(v_existing)) THEN v_earned := v_earned || 'system_design_master'; END IF;
  -- research
  IF v_research_count >= 1 AND NOT ('research_first_quiz' = ANY(v_existing)) THEN v_earned := v_earned || 'research_first_quiz'; END IF;
  IF v_research_count >= 5 AND NOT ('research_quiz_5'     = ANY(v_existing)) THEN v_earned := v_earned || 'research_quiz_5';     END IF;

  -- Insert any newly-earned achievements; idempotent thanks to unique constraint.
  IF array_length(v_earned, 1) IS NOT NULL THEN
    INSERT INTO public.user_achievements (user_id, achievement_id)
    SELECT v_user, unnest(v_earned)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;

  RETURN v_earned;
END;
$$;

REVOKE ALL ON FUNCTION public.award_earned_achievements() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_earned_achievements() TO authenticated;


-- =========================================================================
-- 3. player_ratings / solo_ratings: block client-side writes
-- =========================================================================

DROP POLICY IF EXISTS "ratings self upsert"      ON public.player_ratings;
DROP POLICY IF EXISTS "solo_ratings self upsert" ON public.solo_ratings;
DROP POLICY IF EXISTS "solo_ratings self update" ON public.solo_ratings;
-- Public-read policies remain (leaderboards stay visible). All writes now require service role.
