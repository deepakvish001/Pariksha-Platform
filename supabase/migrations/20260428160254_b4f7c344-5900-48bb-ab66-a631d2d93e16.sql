-- Percentile helper for accepted submissions on a problem.
-- Compares the caller's submission's runtime_ms / memory_kb against the
-- BEST (minimum) accepted runtime/memory per other user on the same problem
-- and language. Returns aggregate percentiles only — never row-level data.
CREATE OR REPLACE FUNCTION public.get_submission_percentiles(
  _submission_id uuid
)
RETURNS TABLE (
  total_users integer,
  runtime_beats numeric,
  memory_beats numeric,
  runtime_ms integer,
  memory_kb integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub RECORD;
  _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.problem_slug, s.language, s.verdict,
         s.runtime_ms, s.memory_kb
    INTO _sub
  FROM public.code_submissions s
  WHERE s.id = _submission_id
    AND s.user_id = _caller;

  -- Only the owner can request stats for their submission, and only
  -- accepted ones contribute to the leaderboard.
  IF NOT FOUND OR _sub.verdict <> 'Accepted' THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH best_per_user AS (
    SELECT s.user_id,
           MIN(NULLIF(s.runtime_ms, 0)) AS best_runtime,
           MIN(NULLIF(s.memory_kb, 0)) AS best_memory
    FROM public.code_submissions s
    WHERE s.problem_slug = _sub.problem_slug
      AND s.language = _sub.language
      AND s.verdict = 'Accepted'
      AND s.user_id <> _sub.user_id
    GROUP BY s.user_id
  ),
  agg AS (
    SELECT
      COUNT(*)::int AS n,
      COUNT(*) FILTER (WHERE best_runtime IS NOT NULL
                        AND _sub.runtime_ms IS NOT NULL
                        AND _sub.runtime_ms <= best_runtime)::numeric
        AS rt_wins,
      COUNT(*) FILTER (WHERE best_runtime IS NOT NULL
                        AND _sub.runtime_ms IS NOT NULL)::numeric
        AS rt_total,
      COUNT(*) FILTER (WHERE best_memory IS NOT NULL
                        AND _sub.memory_kb IS NOT NULL
                        AND _sub.memory_kb <= best_memory)::numeric
        AS mem_wins,
      COUNT(*) FILTER (WHERE best_memory IS NOT NULL
                        AND _sub.memory_kb IS NOT NULL)::numeric
        AS mem_total
    FROM best_per_user
  )
  SELECT
    agg.n,
    CASE WHEN agg.rt_total > 0
         THEN ROUND((agg.rt_wins / agg.rt_total) * 100, 1)
         ELSE NULL END,
    CASE WHEN agg.mem_total > 0
         THEN ROUND((agg.mem_wins / agg.mem_total) * 100, 1)
         ELSE NULL END,
    _sub.runtime_ms,
    _sub.memory_kb
  FROM agg;
END;
$$;

-- Anyone signed-in can call it; the function itself enforces that the
-- caller owns the submission they're querying.
REVOKE ALL ON FUNCTION public.get_submission_percentiles(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_submission_percentiles(uuid) TO authenticated;