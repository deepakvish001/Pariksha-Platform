-- 1) Extend leaderboard RPC to also return username for profile linking
DROP FUNCTION IF EXISTS public.get_daily_challenge_leaderboard(integer);

CREATE OR REPLACE FUNCTION public.get_daily_challenge_leaderboard(_limit integer DEFAULT 50)
 RETURNS TABLE(
   user_id uuid,
   display_name text,
   username text,
   avatar_url text,
   current_streak integer,
   weekly_completions integer,
   total_completions integer,
   last_completed_at timestamp with time zone
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  WITH opted AS (
    SELECT o.user_id, o.display_name
    FROM public.daily_challenge_leaderboard_optin o
    WHERE o.opted_in = true
  ),
  agg AS (
    SELECT
      c.user_id,
      COUNT(*)::INTEGER AS total_completions,
      COUNT(*) FILTER (WHERE c.challenge_date >= (CURRENT_DATE - INTERVAL '6 days'))::INTEGER AS weekly_completions,
      MAX(c.completed_at) AS last_completed_at
    FROM public.daily_challenge_completions c
    WHERE c.user_id IN (SELECT user_id FROM opted)
    GROUP BY c.user_id
  ),
  streaks AS (
    SELECT
      sub.user_id,
      COUNT(*)::INTEGER AS current_streak
    FROM (
      SELECT
        c.user_id,
        c.challenge_date,
        (CURRENT_DATE - c.challenge_date) AS days_ago,
        ROW_NUMBER() OVER (PARTITION BY c.user_id ORDER BY c.challenge_date DESC) - 1 AS rn
      FROM public.daily_challenge_completions c
      WHERE c.user_id IN (SELECT user_id FROM opted)
        AND c.challenge_date >= (CURRENT_DATE - INTERVAL '365 days')
    ) sub
    WHERE sub.days_ago = sub.rn
       OR (sub.rn = 0 AND sub.days_ago = 1)
       OR (sub.rn > 0 AND sub.days_ago = sub.rn + (
            CASE WHEN EXISTS (
              SELECT 1 FROM public.daily_challenge_completions c2
              WHERE c2.user_id = sub.user_id AND c2.challenge_date = CURRENT_DATE
            ) THEN 0 ELSE 1 END
          ))
    GROUP BY sub.user_id
  )
  SELECT
    o.user_id,
    COALESCE(o.display_name, p.full_name, 'Anonymous') AS display_name,
    upe.username,
    p.avatar_url,
    COALESCE(s.current_streak, 0) AS current_streak,
    COALESCE(a.weekly_completions, 0) AS weekly_completions,
    COALESCE(a.total_completions, 0) AS total_completions,
    a.last_completed_at
  FROM opted o
  LEFT JOIN agg a ON a.user_id = o.user_id
  LEFT JOIN streaks s ON s.user_id = o.user_id
  LEFT JOIN public.profiles p ON p.user_id = o.user_id
  LEFT JOIN public.user_profiles_extended upe ON upe.user_id = o.user_id
  ORDER BY current_streak DESC NULLS LAST, weekly_completions DESC, total_completions DESC, last_completed_at DESC NULLS LAST
  LIMIT _limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_daily_challenge_leaderboard(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_daily_challenge_leaderboard(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_daily_challenge_leaderboard(integer) TO authenticated;

-- 2) Per-user audit (callable by the user themselves only).
-- Scans daily_challenge_completions for the caller, dedupes any rows
-- accidentally created for the same (user_id, challenge_date), keeping
-- the EARLIEST completed_at and the most informative problem_slug.
-- Returns counts of duplicates removed and a list of date gaps in the
-- caller's last 30 days for diagnostics. Does NOT fabricate completions.
CREATE OR REPLACE FUNCTION public.audit_daily_completions()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  removed integer := 0;
  gaps text[] := ARRAY[]::text[];
  cur_date date;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Defensive dedupe: even though there's a UNIQUE(user_id, challenge_date)
  -- constraint, we still scan in case constraint was ever bypassed by an
  -- admin or older data exists. Keep earliest completed_at; if tied, keep
  -- the row with a non-empty problem_slug.
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, challenge_date
        ORDER BY completed_at ASC,
                 (CASE WHEN COALESCE(problem_slug, '') = '' THEN 1 ELSE 0 END) ASC,
                 created_at ASC
      ) AS rn
    FROM public.daily_challenge_completions
    WHERE user_id = uid
  ),
  deleted AS (
    DELETE FROM public.daily_challenge_completions c
    USING ranked r
    WHERE c.id = r.id AND r.rn > 1
    RETURNING c.id
  )
  SELECT COUNT(*) INTO removed FROM deleted;

  -- Report gaps (missed days) in the last 30 days for visibility only.
  -- We do NOT auto-fill these; that would inflate streaks falsely.
  FOR cur_date IN
    SELECT d::date
    FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') d
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.daily_challenge_completions
      WHERE user_id = uid AND challenge_date = cur_date
    ) THEN
      gaps := array_append(gaps, to_char(cur_date, 'YYYY-MM-DD'));
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'duplicates_removed', removed,
    'gaps_last_30d', gaps,
    'audited_at', now()
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.audit_daily_completions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_daily_completions() FROM anon;
GRANT EXECUTE ON FUNCTION public.audit_daily_completions() TO authenticated;

-- 3) Cross-user audit, callable only by service_role (used by pg_cron job).
CREATE OR REPLACE FUNCTION public.audit_daily_completions_all()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  removed integer := 0;
BEGIN
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, challenge_date
        ORDER BY completed_at ASC,
                 (CASE WHEN COALESCE(problem_slug, '') = '' THEN 1 ELSE 0 END) ASC,
                 created_at ASC
      ) AS rn
    FROM public.daily_challenge_completions
  ),
  deleted AS (
    DELETE FROM public.daily_challenge_completions c
    USING ranked r
    WHERE c.id = r.id AND r.rn > 1
    RETURNING c.id
  )
  SELECT COUNT(*) INTO removed FROM deleted;

  RETURN jsonb_build_object('duplicates_removed', removed, 'audited_at', now());
END;
$function$;

REVOKE ALL ON FUNCTION public.audit_daily_completions_all() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_daily_completions_all() FROM anon;
REVOKE ALL ON FUNCTION public.audit_daily_completions_all() FROM authenticated;
-- service_role retains EXECUTE by default for SECURITY DEFINER owned by postgres,
-- but be explicit:
GRANT EXECUTE ON FUNCTION public.audit_daily_completions_all() TO service_role;

-- 4) Schedule the global audit daily (requires pg_cron + pg_net).
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  -- Unschedule any existing job with same name (idempotent reapply).
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'daily-challenge-completions-audit';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'daily-challenge-completions-audit',
  '15 3 * * *', -- 03:15 UTC every day
  $$ SELECT public.audit_daily_completions_all(); $$
);