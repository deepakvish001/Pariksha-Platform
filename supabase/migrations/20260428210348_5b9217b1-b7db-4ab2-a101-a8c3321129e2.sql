
CREATE OR REPLACE FUNCTION public.get_coding_leaderboard_user_breakdown(_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  problems_solved int,
  total_accepted int,
  total_submissions int,
  acceptance_rate numeric,
  easy_solved int,
  medium_solved int,
  hard_solved int,
  easy_score numeric,
  medium_score numeric,
  hard_score numeric,
  speed_bonus numeric,
  weighted_score numeric,
  fastest_runtime_ms int,
  slowest_runtime_ms int,
  avg_runtime_ms numeric,
  fastest_problems jsonb,
  last_accepted_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Respect opt-out; return empty if hidden.
  IF EXISTS (
    SELECT 1 FROM public.user_profiles_extended
    WHERE user_profiles_extended.user_id = _user_id
      AND coding_leaderboard_hidden = true
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH per_problem AS (
    SELECT
      cs.problem_slug,
      COALESCE(m.difficulty, 'medium') AS difficulty,
      MIN(cs.runtime_ms) FILTER (WHERE cs.runtime_ms IS NOT NULL) AS best_runtime,
      MAX(cs.created_at) AS last_accepted
    FROM public.code_submissions cs
    LEFT JOIN public.coding_problems_meta m ON m.problem_slug = cs.problem_slug
    WHERE cs.user_id = _user_id AND cs.verdict = 'Accepted'
    GROUP BY cs.problem_slug, COALESCE(m.difficulty, 'medium')
  ),
  agg AS (
    SELECT
      COUNT(*)::int AS solved,
      COUNT(*) FILTER (WHERE difficulty = 'easy')::int AS easy_n,
      COUNT(*) FILTER (WHERE difficulty = 'medium')::int AS med_n,
      COUNT(*) FILTER (WHERE difficulty = 'hard')::int AS hard_n,
      MIN(best_runtime) AS fastest_rt,
      MAX(best_runtime) AS slowest_rt,
      AVG(best_runtime)::numeric AS avg_rt,
      MAX(last_accepted) AS last_acc,
      COALESCE(SUM(LEAST(0.2 * (CASE difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 3 WHEN 'hard' THEN 5 ELSE 3 END), GREATEST(0, (2000.0 - COALESCE(best_runtime, 2000)) / 9000.0))), 0)::numeric AS speed_b
    FROM per_problem
  ),
  totals AS (
    SELECT
      COUNT(*)::int AS total_subs,
      COUNT(*) FILTER (WHERE verdict = 'Accepted')::int AS total_acc
    FROM public.code_submissions
    WHERE code_submissions.user_id = _user_id
  ),
  fastest AS (
    SELECT jsonb_agg(jsonb_build_object(
      'problem_slug', problem_slug,
      'difficulty', difficulty,
      'runtime_ms', best_runtime
    ) ORDER BY best_runtime NULLS LAST) FILTER (WHERE best_runtime IS NOT NULL) AS top_fast
    FROM (
      SELECT problem_slug, difficulty, best_runtime
      FROM per_problem
      WHERE best_runtime IS NOT NULL
      ORDER BY best_runtime ASC
      LIMIT 5
    ) f
  ),
  prof AS (
    SELECT p.full_name, p.avatar_url, upe.username
    FROM public.profiles p
    LEFT JOIN public.user_profiles_extended upe ON upe.user_id = p.user_id
    WHERE p.user_id = _user_id
    LIMIT 1
  )
  SELECT
    _user_id,
    COALESCE(prof.full_name, prof.username, 'Anonymous')::text,
    prof.username,
    prof.avatar_url,
    agg.solved,
    totals.total_acc,
    totals.total_subs,
    CASE WHEN totals.total_subs > 0 THEN ROUND((totals.total_acc::numeric / totals.total_subs) * 100, 1) ELSE 0 END,
    agg.easy_n,
    agg.med_n,
    agg.hard_n,
    (agg.easy_n * 1)::numeric,
    (agg.med_n * 3)::numeric,
    (agg.hard_n * 5)::numeric,
    agg.speed_b,
    ((agg.easy_n * 1) + (agg.med_n * 3) + (agg.hard_n * 5))::numeric + agg.speed_b,
    agg.fastest_rt,
    agg.slowest_rt,
    agg.avg_rt,
    COALESCE(fastest.top_fast, '[]'::jsonb),
    agg.last_acc
  FROM agg, totals, fastest
  LEFT JOIN prof ON true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_coding_leaderboard_user_breakdown(uuid) TO anon, authenticated;
