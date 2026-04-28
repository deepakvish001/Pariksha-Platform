
-- 1. Snapshot table for daily rank delta tracking
CREATE TABLE IF NOT EXISTS public.coding_leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  window_kind text NOT NULL CHECK (window_kind IN ('all', 'week', 'today')),
  rank integer NOT NULL,
  weighted_score numeric NOT NULL,
  problems_solved integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_date, window_kind)
);

CREATE INDEX IF NOT EXISTS idx_coding_lb_snapshots_user_window
  ON public.coding_leaderboard_snapshots (user_id, window_kind, snapshot_date DESC);

ALTER TABLE public.coding_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own leaderboard snapshots"
  ON public.coding_leaderboard_snapshots;
CREATE POLICY "users read own leaderboard snapshots"
  ON public.coding_leaderboard_snapshots
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. RPC: snapshot the caller's current rank for all 3 windows (idempotent for the day).
CREATE OR REPLACE FUNCTION public.snapshot_my_coding_leaderboard_rank()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  win_name text;
  rank_row record;
  inserted int := 0;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('inserted', 0, 'reason', 'not_authenticated');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_profiles_extended
    WHERE user_id = uid AND coding_leaderboard_hidden = true
  ) THEN
    RETURN jsonb_build_object('inserted', 0, 'reason', 'hidden');
  END IF;

  FOREACH win_name IN ARRAY ARRAY['all', 'week', 'today']
  LOOP
    SELECT * INTO rank_row
    FROM public.get_coding_leaderboard_user_rank(uid, win_name);

    IF rank_row.rank IS NOT NULL THEN
      INSERT INTO public.coding_leaderboard_snapshots
        (user_id, snapshot_date, window_kind, rank, weighted_score, problems_solved)
      VALUES
        (uid, CURRENT_DATE, win_name, rank_row.rank, rank_row.weighted_score, rank_row.problems_solved)
      ON CONFLICT (user_id, snapshot_date, window_kind) DO NOTHING;
      IF FOUND THEN inserted := inserted + 1; END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('inserted', inserted);
END;
$$;

-- 3. RPC: rank delta vs yesterday and ~7 days ago
CREATE OR REPLACE FUNCTION public.get_coding_leaderboard_rank_delta(
  _user_id uuid,
  _window text DEFAULT 'all'
)
RETURNS TABLE (
  current_rank bigint,
  yesterday_rank integer,
  week_ago_rank integer,
  delta_day integer,
  delta_week integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cur_rank bigint;
  y_rank int;
  w_rank int;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

  SELECT r.rank INTO cur_rank
  FROM public.get_coding_leaderboard_user_rank(_user_id, _window) r;

  SELECT s.rank INTO y_rank
  FROM public.coding_leaderboard_snapshots s
  WHERE s.user_id = _user_id
    AND s.window_kind = _window
    AND s.snapshot_date = CURRENT_DATE - INTERVAL '1 day'
  ORDER BY s.snapshot_date DESC
  LIMIT 1;

  SELECT s.rank INTO w_rank
  FROM public.coding_leaderboard_snapshots s
  WHERE s.user_id = _user_id
    AND s.window_kind = _window
    AND s.snapshot_date <= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY s.snapshot_date DESC
  LIMIT 1;

  RETURN QUERY SELECT
    cur_rank,
    y_rank,
    w_rank,
    CASE WHEN cur_rank IS NOT NULL AND y_rank IS NOT NULL
         THEN (y_rank - cur_rank::int) ELSE NULL END,
    CASE WHEN cur_rank IS NOT NULL AND w_rank IS NOT NULL
         THEN (w_rank - cur_rank::int) ELSE NULL END;
END;
$$;

-- 4. Update get_coding_leaderboard with optional difficulty + accepted_only filters.
CREATE OR REPLACE FUNCTION public.get_coding_leaderboard(
  _window text DEFAULT 'all',
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0,
  _search text DEFAULT NULL,
  _difficulty text DEFAULT NULL,
  _accepted_only boolean DEFAULT true
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  problems_solved integer,
  total_accepted integer,
  acceptance_rate numeric,
  fastest_avg_runtime integer,
  weighted_score numeric,
  last_accepted_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _since timestamptz;
  _diff text := NULLIF(LOWER(COALESCE(_difficulty, '')), '');
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
      MIN(NULLIF(s.runtime_ms, 0)) AS best_runtime,
      COUNT(*)::int                 AS accepted_count,
      MAX(s.created_at)             AS last_accepted_at
    FROM public.code_submissions s
    LEFT JOIN public.coding_problems_meta m ON m.problem_slug = s.problem_slug
    WHERE
      ((_accepted_only IS NOT FALSE AND s.verdict = 'Accepted')
        OR _accepted_only IS FALSE)
      AND s.is_submission = true
      AND (_since IS NULL OR s.created_at >= _since)
      AND (_diff IS NULL OR COALESCE(m.difficulty, 'medium') = _diff)
    GROUP BY s.user_id, s.problem_slug
  ),
  totals AS (
    SELECT
      s.user_id,
      COUNT(*)::int AS total_subs,
      COUNT(*) FILTER (WHERE s.verdict = 'Accepted')::int AS total_acc
    FROM public.code_submissions s
    LEFT JOIN public.coding_problems_meta m ON m.problem_slug = s.problem_slug
    WHERE s.is_submission = true
      AND (_since IS NULL OR s.created_at >= _since)
      AND (_diff IS NULL OR COALESCE(m.difficulty, 'medium') = _diff)
    GROUP BY s.user_id
  ),
  per_user AS (
    SELECT
      a.user_id,
      COUNT(DISTINCT a.problem_slug)::int AS problems_solved,
      AVG(a.best_runtime)::int            AS fastest_avg_runtime,
      MAX(a.last_accepted_at)             AS last_accepted_at,
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
