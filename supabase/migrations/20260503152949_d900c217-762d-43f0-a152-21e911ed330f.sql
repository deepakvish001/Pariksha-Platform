
CREATE OR REPLACE FUNCTION public.admin_daily_challenge_user_detail(_user_id UUID, _date DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _challenge RECORD;
  _attempts JSONB;
  _submissions JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  SELECT id, challenge_date, problem_slug, bonus_xp
    INTO _challenge
  FROM public.arena_daily_challenges
  WHERE challenge_date = _date;

  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.attempted_at), '[]'::jsonb)
    INTO _attempts
  FROM public.arena_daily_attempts a
  WHERE a.user_id = _user_id AND a.challenge_date = _date;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', s.id,
           'battle_id', s.battle_id,
           'problem_slug', b.problem_slug,
           'verdict', s.verdict,
           'passed', s.passed,
           'total', s.total,
           'language', s.language,
           'runtime_ms', s.runtime_ms,
           'created_at', s.created_at,
           'matches_seeded', (b.problem_slug IS NOT DISTINCT FROM _challenge.problem_slug)
         ) ORDER BY s.created_at), '[]'::jsonb)
    INTO _submissions
  FROM public.battle_submissions s
  JOIN public.battles b ON b.id = s.battle_id
  WHERE s.user_id = _user_id
    AND ((b.started_at AT TIME ZONE 'UTC')::date = _date
         OR (s.created_at AT TIME ZONE 'UTC')::date = _date);

  RETURN jsonb_build_object(
    'user_id', _user_id,
    'challenge_date', _date,
    'seeded_problem_slug', _challenge.problem_slug,
    'bonus_xp', _challenge.bonus_xp,
    'attempts', _attempts,
    'submissions', _submissions
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_daily_challenge_user_detail(UUID, DATE) TO authenticated;
