CREATE OR REPLACE FUNCTION public.admin_daily_challenge_claimers_range(_from DATE, _to DATE)
RETURNS TABLE (
  challenge_date DATE,
  problem_slug TEXT,
  user_id UUID,
  display_name TEXT,
  solved BOOLEAN,
  solve_time_sec INTEGER,
  xp_awarded INTEGER,
  attempted_at TIMESTAMPTZ,
  solved_at TIMESTAMPTZ,
  claimed BOOLEAN
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
  IF _to < _from THEN
    RAISE EXCEPTION 'invalid range';
  END IF;
  IF (_to - _from) > 365 THEN
    RAISE EXCEPTION 'range too large (max 365 days)';
  END IF;
  RETURN QUERY
  SELECT a.challenge_date,
         c.problem_slug,
         a.user_id,
         p.full_name,
         a.solved,
         a.solve_time_sec,
         a.xp_awarded,
         a.attempted_at,
         a.solved_at,
         (a.xp_awarded > 0) AS claimed
  FROM public.arena_daily_attempts a
  JOIN public.arena_daily_challenges c ON c.id = a.challenge_id
  LEFT JOIN public.profiles p ON p.user_id = a.user_id
  WHERE a.challenge_date BETWEEN _from AND _to
  ORDER BY a.challenge_date DESC, a.solved DESC, a.solve_time_sec NULLS LAST, a.attempted_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_daily_challenge_claimers_range(DATE, DATE) TO authenticated;