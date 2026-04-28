-- Drop the prior single-mode function and replace with a hardened version
-- that supports two ranking modes and explicitly excludes anonymous role.
DROP FUNCTION IF EXISTS public.get_submission_percentiles(uuid);

CREATE OR REPLACE FUNCTION public.get_submission_percentiles(
  _submission_id uuid,
  _mode text DEFAULT 'best_per_user'
)
RETURNS TABLE (
  total_users integer,
  total_compared integer,
  runtime_beats numeric,
  memory_beats numeric,
  runtime_ms integer,
  memory_kb integer,
  mode text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub RECORD;
  _caller uuid := auth.uid();
  _mode_norm text;
BEGIN
  IF _caller IS NULL THEN
    RETURN;
  END IF;

  _mode_norm := CASE WHEN _mode = 'all_accepted' THEN 'all_accepted'
                     ELSE 'best_per_user' END;

  SELECT s.user_id, s.problem_slug, s.language, s.verdict,
         s.runtime_ms, s.memory_kb
    INTO _sub
  FROM public.code_submissions s
  WHERE s.id = _submission_id
    AND s.user_id = _caller;

  IF NOT FOUND OR _sub.verdict <> 'Accepted' THEN
    RETURN;
  END IF;

  IF _mode_norm = 'all_accepted' THEN
    RETURN QUERY
    WITH cohort AS (
      SELECT s.user_id,
             NULLIF(s.runtime_ms, 0) AS rt,
             NULLIF(s.memory_kb, 0) AS mem
      FROM public.code_submissions s
      WHERE s.problem_slug = _sub.problem_slug
        AND s.language = _sub.language
        AND s.verdict = 'Accepted'
        AND s.id <> _submission_id
    ),
    agg AS (
      SELECT
        COUNT(DISTINCT user_id)::int AS users_n,
        COUNT(*)::int AS rows_n,
        COUNT(*) FILTER (WHERE rt IS NOT NULL
                          AND _sub.runtime_ms IS NOT NULL
                          AND _sub.runtime_ms <= rt)::numeric AS rt_wins,
        COUNT(*) FILTER (WHERE rt IS NOT NULL
                          AND _sub.runtime_ms IS NOT NULL)::numeric AS rt_total,
        COUNT(*) FILTER (WHERE mem IS NOT NULL
                          AND _sub.memory_kb IS NOT NULL
                          AND _sub.memory_kb <= mem)::numeric AS mem_wins,
        COUNT(*) FILTER (WHERE mem IS NOT NULL
                          AND _sub.memory_kb IS NOT NULL)::numeric AS mem_total
      FROM cohort
    )
    SELECT
      agg.users_n,
      agg.rows_n,
      CASE WHEN agg.rt_total > 0
           THEN ROUND((agg.rt_wins / agg.rt_total) * 100, 1)
           ELSE NULL END,
      CASE WHEN agg.mem_total > 0
           THEN ROUND((agg.mem_wins / agg.mem_total) * 100, 1)
           ELSE NULL END,
      _sub.runtime_ms,
      _sub.memory_kb,
      _mode_norm
    FROM agg;
  ELSE
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
        COUNT(*)::int AS users_n,
        COUNT(*) FILTER (WHERE best_runtime IS NOT NULL
                          AND _sub.runtime_ms IS NOT NULL
                          AND _sub.runtime_ms <= best_runtime)::numeric AS rt_wins,
        COUNT(*) FILTER (WHERE best_runtime IS NOT NULL
                          AND _sub.runtime_ms IS NOT NULL)::numeric AS rt_total,
        COUNT(*) FILTER (WHERE best_memory IS NOT NULL
                          AND _sub.memory_kb IS NOT NULL
                          AND _sub.memory_kb <= best_memory)::numeric AS mem_wins,
        COUNT(*) FILTER (WHERE best_memory IS NOT NULL
                          AND _sub.memory_kb IS NOT NULL)::numeric AS mem_total
      FROM best_per_user
    )
    SELECT
      agg.users_n,
      agg.users_n,
      CASE WHEN agg.rt_total > 0
           THEN ROUND((agg.rt_wins / agg.rt_total) * 100, 1)
           ELSE NULL END,
      CASE WHEN agg.mem_total > 0
           THEN ROUND((agg.mem_wins / agg.mem_total) * 100, 1)
           ELSE NULL END,
      _sub.runtime_ms,
      _sub.memory_kb,
      _mode_norm
    FROM agg;
  END IF;
END;
$$;

-- Lock down execution: revoke from PUBLIC and anon, grant only to authenticated
REVOKE ALL ON FUNCTION public.get_submission_percentiles(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_submission_percentiles(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_submission_percentiles(uuid, text) TO authenticated;