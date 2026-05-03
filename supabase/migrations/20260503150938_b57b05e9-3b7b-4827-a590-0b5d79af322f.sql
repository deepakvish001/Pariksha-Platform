
-- Claimers / attempters per date (admin only)
CREATE OR REPLACE FUNCTION public.admin_daily_challenge_claimers(_date DATE)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  solved BOOLEAN,
  solve_time_sec INTEGER,
  xp_awarded INTEGER,
  attempted_at TIMESTAMPTZ,
  solved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY
  SELECT a.user_id, p.full_name, a.solved, a.solve_time_sec, a.xp_awarded, a.attempted_at, a.solved_at
  FROM public.arena_daily_attempts a
  LEFT JOIN public.profiles p ON p.user_id = a.user_id
  WHERE a.challenge_date = _date
  ORDER BY a.solved DESC, a.solve_time_sec NULLS LAST, a.attempted_at;
END;
$$;

-- Rollback: delete the daily_challenge row for a given date if no solves exist.
-- Cascade removes attempts row; admins must manually re-assign via schedule afterwards.
CREATE OR REPLACE FUNCTION public.admin_rollback_daily_challenge(_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _solves INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  SELECT COUNT(*) INTO _solves
  FROM public.arena_daily_attempts a
  JOIN public.arena_daily_challenges c ON c.id = a.challenge_id
  WHERE c.challenge_date = _date AND a.solved;
  IF _solves > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'has_solves', 'solves', _solves);
  END IF;

  DELETE FROM public.arena_daily_challenges WHERE challenge_date = _date;
  -- Also drop today's admin override so it doesn't auto-reseed the same problem
  DELETE FROM public.admin_daily_challenge_schedule WHERE challenge_date = _date;
  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_daily_challenge_claimers(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_rollback_daily_challenge(DATE) TO authenticated;
