
-- 1. Difficulty on coding_problems_meta
ALTER TABLE public.coding_problems_meta
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- 2. Opt-out flag on user_profiles_extended (default false = visible)
ALTER TABLE public.user_profiles_extended
  ADD COLUMN IF NOT EXISTS coding_leaderboard_hidden boolean NOT NULL DEFAULT false;

-- 3. Helpful indexes for leaderboard scans
CREATE INDEX IF NOT EXISTS idx_code_submissions_accepted
  ON public.code_submissions (user_id, problem_slug)
  WHERE verdict = 'Accepted' AND is_submission = true;

CREATE INDEX IF NOT EXISTS idx_code_submissions_created_at
  ON public.code_submissions (created_at DESC);

-- 4. Leaderboard RPC
CREATE OR REPLACE FUNCTION public.get_coding_leaderboard(
  _window text DEFAULT 'all',
  _limit  int  DEFAULT 50,
  _offset int  DEFAULT 0,
  _search text DEFAULT NULL
)
RETURNS TABLE (
  rank                bigint,
  user_id             uuid,
  username            text,
  display_name        text,
  avatar_url          text,
  problems_solved     int,
  total_accepted      int,
  acceptance_rate     numeric,
  fastest_avg_runtime int,
  weighted_score      numeric,
  last_accepted_at    timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since timestamptz;
BEGIN
  _since := CASE
    WHEN _window = 'today' THEN date_trunc('day', now())
    WHEN _window = 'week'  THEN now() - interval '7 days'
    ELSE NULL
  END;

  RETURN QUERY
  WITH visible_users AS (
    SELECT upe.user_id, upe.username
    FROM public.user_profiles_extended upe
    WHERE COALESCE(upe.coding_leaderboard_hidden, false) = false
  ),
  acc AS (
    SELECT
      s.user_id,
      s.problem_slug,
      MIN(NULLIF(s.runtime_ms, 0))      AS best_runtime,
      COUNT(*)::int                     AS accepted_count,
      MAX(s.created_at)                 AS last_accepted_at
    FROM public.code_submissions s
    WHERE s.verdict = 'Accepted'
      AND s.is_submission = true
      AND (_since IS NULL OR s.created_at >= _since)
    GROUP BY s.user_id, s.problem_slug
  ),
  totals AS (
    SELECT
      s.user_id,
      COUNT(*)::int AS total_subs,
      COUNT(*) FILTER (WHERE s.verdict = 'Accepted')::int AS total_acc
    FROM public.code_submissions s
    WHERE s.is_submission = true
      AND (_since IS NULL OR s.created_at >= _since)
    GROUP BY s.user_id
  ),
  per_user AS (
    SELECT
      a.user_id,
      COUNT(DISTINCT a.problem_slug)::int  AS problems_solved,
      AVG(a.best_runtime)::int             AS fastest_avg_runtime,
      MAX(a.last_accepted_at)              AS last_accepted_at,
      SUM(
        CASE COALESCE(m.difficulty, 'medium')
          WHEN 'easy'   THEN 1
          WHEN 'medium' THEN 3
          WHEN 'hard'   THEN 5
          ELSE 3
        END
        + COALESCE(
            LEAST(
              0.2 * CASE COALESCE(m.difficulty, 'medium')
                      WHEN 'easy'   THEN 1
                      WHEN 'medium' THEN 3
                      WHEN 'hard'   THEN 5
                      ELSE 3
                    END,
              -- Speed bonus: 200ms = +max, 2000ms = ~0
              GREATEST(0, (2000.0 - LEAST(a.best_runtime, 2000)) / 9000.0)
            ), 0)
      )::numeric AS weighted_score
    FROM acc a
    LEFT JOIN public.coding_problems_meta m ON m.problem_slug = a.problem_slug
    GROUP BY a.user_id
  ),
  joined AS (
    SELECT
      pu.user_id,
      vu.username,
      COALESCE(p.full_name, vu.username, 'Anonymous') AS display_name,
      p.avatar_url,
      pu.problems_solved,
      COALESCE(t.total_acc, 0)         AS total_accepted,
      CASE WHEN COALESCE(t.total_subs, 0) > 0
           THEN ROUND((t.total_acc::numeric / t.total_subs) * 100, 1)
           ELSE 0 END                  AS acceptance_rate,
      pu.fastest_avg_runtime,
      pu.weighted_score,
      pu.last_accepted_at
    FROM per_user pu
    JOIN visible_users vu ON vu.user_id = pu.user_id
    LEFT JOIN public.profiles p ON p.user_id = pu.user_id
    LEFT JOIN totals t ON t.user_id = pu.user_id
    WHERE _search IS NULL
       OR vu.username ILIKE '%' || _search || '%'
       OR p.full_name ILIKE '%' || _search || '%'
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY j.weighted_score DESC NULLS LAST,
               j.problems_solved DESC,
               j.fastest_avg_runtime ASC NULLS LAST,
               j.last_accepted_at DESC NULLS LAST
    ) AS rank,
    j.user_id,
    j.username,
    j.display_name,
    j.avatar_url,
    j.problems_solved,
    j.total_accepted,
    j.acceptance_rate,
    j.fastest_avg_runtime,
    j.weighted_score,
    j.last_accepted_at
  FROM joined j
  ORDER BY rank
  LIMIT GREATEST(_limit, 1)
  OFFSET GREATEST(_offset, 0);
END;
$$;

-- 5. Stats RPC for header
CREATE OR REPLACE FUNCTION public.get_coding_leaderboard_stats()
RETURNS TABLE (
  total_participants int,
  total_accepted_today int,
  total_accepted_week int,
  total_problems_solved int
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH visible_users AS (
    SELECT user_id FROM public.user_profiles_extended
    WHERE COALESCE(coding_leaderboard_hidden, false) = false
  )
  SELECT
    (SELECT COUNT(DISTINCT s.user_id)::int
       FROM public.code_submissions s
       JOIN visible_users v ON v.user_id = s.user_id
      WHERE s.verdict = 'Accepted' AND s.is_submission = true),
    (SELECT COUNT(*)::int
       FROM public.code_submissions s
       JOIN visible_users v ON v.user_id = s.user_id
      WHERE s.verdict = 'Accepted' AND s.is_submission = true
        AND s.created_at >= date_trunc('day', now())),
    (SELECT COUNT(*)::int
       FROM public.code_submissions s
       JOIN visible_users v ON v.user_id = s.user_id
      WHERE s.verdict = 'Accepted' AND s.is_submission = true
        AND s.created_at >= now() - interval '7 days'),
    (SELECT COUNT(DISTINCT s.problem_slug)::int
       FROM public.code_submissions s
       JOIN visible_users v ON v.user_id = s.user_id
      WHERE s.verdict = 'Accepted' AND s.is_submission = true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_coding_leaderboard(text, int, int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_coding_leaderboard_stats() TO anon, authenticated;
