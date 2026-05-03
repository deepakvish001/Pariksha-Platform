
CREATE OR REPLACE FUNCTION public.arena_get_daily_history_range(
  _from DATE,
  _to DATE
)
RETURNS TABLE (
  challenge_date DATE,
  problem_slug TEXT,
  problem_title TEXT,
  solved BOOLEAN,
  solve_time_sec INTEGER,
  xp_awarded INTEGER,
  attempted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _to < _from THEN RAISE EXCEPTION 'invalid range'; END IF;
  IF (_to - _from) > 365 THEN RAISE EXCEPTION 'range too large'; END IF;
  RETURN QUERY
  SELECT c.challenge_date, c.problem_slug, p.title,
         COALESCE(a.solved, false), a.solve_time_sec,
         COALESCE(a.xp_awarded, 0), a.attempted_at
  FROM public.arena_daily_challenges c
  LEFT JOIN public.arena_daily_attempts a
    ON a.challenge_id = c.id AND a.user_id = _uid
  LEFT JOIN public.coding_problems p ON p.slug = c.problem_slug
  WHERE c.challenge_date BETWEEN _from AND _to
  ORDER BY c.challenge_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.arena_get_daily_history_range(DATE, DATE) TO authenticated;
