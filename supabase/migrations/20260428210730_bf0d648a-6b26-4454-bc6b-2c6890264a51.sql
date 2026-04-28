
CREATE OR REPLACE FUNCTION public.get_coding_leaderboard_user_rank(
  _user_id uuid,
  _window text DEFAULT 'all'
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  problems_solved int,
  total_accepted int,
  acceptance_rate numeric,
  fastest_avg_runtime numeric,
  weighted_score numeric,
  last_accepted_at timestamptz,
  total_ranked bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since timestamptz;
BEGIN
  IF _user_id IS NULL THEN
    RETURN;
  END IF;

  -- Respect opt-out
  IF EXISTS (
    SELECT 1 FROM public.user_profiles_extended
    WHERE user_profiles_extended.user_id = _user_id
      AND coding_leaderboard_hidden = true
  ) THEN
    RETURN;
  END IF;

  _since := CASE _window
    WHEN 'today' THEN date_trunc('day', now())
    WHEN 'week'  THEN date_trunc('week', now())
    ELSE '-infinity'::timestamptz
  END;

  RETURN QUERY
  WITH per_user_problem AS (
    SELECT
      cs.user_id,
      cs.problem_slug,
      COALESCE(m.difficulty, 'medium') AS difficulty,
      MIN(cs.runtime_ms) FILTER (WHERE cs.runtime_ms IS NOT NULL) AS best_runtime,
      MAX(cs.created_at) AS last_acc
    FROM public.code_submissions cs
    LEFT JOIN public.coding_problems_meta m ON m.problem_slug = cs.problem_slug
    LEFT JOIN public.user_profiles_extended upe ON upe.user_id = cs.user_id
    WHERE cs.verdict = 'Accepted'
      AND cs.created_at >= _since
      AND COALESCE(upe.coding_leaderboard_hidden, false) = false
    GROUP BY cs.user_id, cs.problem_slug, COALESCE(m.difficulty, 'medium')
  ),
  per_user AS (
    SELECT
      pup.user_id,
      COUNT(*)::int AS solved,
      AVG(pup.best_runtime)::numeric AS avg_rt,
      MAX(pup.last_acc) AS last_acc,
      SUM(
        (CASE pup.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 3 WHEN 'hard' THEN 5 ELSE 3 END)
        + COALESCE(LEAST(
            0.2 * (CASE pup.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 3 WHEN 'hard' THEN 5 ELSE 3 END),
            GREATEST(0, (2000.0 - COALESCE(pup.best_runtime, 2000)) / 9000.0)
          ), 0)
      )::numeric AS w_score
    FROM per_user_problem pup
    GROUP BY pup.user_id
  ),
  totals AS (
    SELECT
      cs.user_id,
      COUNT(*)::int AS total_subs,
      COUNT(*) FILTER (WHERE cs.verdict = 'Accepted')::int AS total_acc
    FROM public.code_submissions cs
    WHERE cs.created_at >= _since
    GROUP BY cs.user_id
  ),
  ranked AS (
    SELECT
      pu.user_id,
      pu.solved,
      pu.avg_rt,
      pu.last_acc,
      pu.w_score,
      COALESCE(t.total_acc, 0) AS total_acc,
      COALESCE(t.total_subs, 0) AS total_subs,
      RANK() OVER (ORDER BY pu.w_score DESC, pu.solved DESC, pu.avg_rt ASC NULLS LAST) AS rk,
      COUNT(*) OVER () AS total_n
    FROM per_user pu
    LEFT JOIN totals t ON t.user_id = pu.user_id
  )
  SELECT
    r.rk,
    r.user_id,
    upe.username,
    COALESCE(p.full_name, upe.username, 'Anonymous')::text AS display_name,
    p.avatar_url,
    r.solved,
    r.total_acc,
    CASE WHEN r.total_subs > 0
      THEN ROUND((r.total_acc::numeric / r.total_subs) * 100, 1)
      ELSE 0 END,
    r.avg_rt,
    r.w_score,
    r.last_acc,
    r.total_n
  FROM ranked r
  LEFT JOIN public.profiles p ON p.user_id = r.user_id
  LEFT JOIN public.user_profiles_extended upe ON upe.user_id = r.user_id
  WHERE r.user_id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_coding_leaderboard_user_rank(uuid, text) TO anon, authenticated;
