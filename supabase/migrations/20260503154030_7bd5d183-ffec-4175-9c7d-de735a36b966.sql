
CREATE OR REPLACE FUNCTION public.admin_daily_challenge_user_detail(_user_id UUID, _date DATE)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
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

  -- Audit: record who inspected which (user, date) pair
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_slug, diff)
  VALUES (
    auth.uid(),
    'daily_review.view_user_detail',
    'arena_daily_challenge',
    _date::text,
    jsonb_build_object(
      'inspected_user_id', _user_id,
      'challenge_date', _date,
      'seeded_problem_slug', _challenge.problem_slug,
      'attempt_count', jsonb_array_length(_attempts),
      'submission_count', jsonb_array_length(_submissions)
    )
  );

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

-- Reader: list recent admin daily-review access events.
CREATE OR REPLACE FUNCTION public.admin_get_daily_review_audit(_limit INT DEFAULT 100, _offset INT DEFAULT 0)
RETURNS TABLE (
  id UUID,
  actor_id UUID,
  actor_name TEXT,
  challenge_date DATE,
  inspected_user_id UUID,
  inspected_user_name TEXT,
  seeded_problem_slug TEXT,
  attempt_count INT,
  submission_count INT,
  created_at TIMESTAMPTZ
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
  SELECT
    l.id,
    l.actor_id,
    pa.full_name AS actor_name,
    (l.diff->>'challenge_date')::date AS challenge_date,
    (l.diff->>'inspected_user_id')::uuid AS inspected_user_id,
    pi.full_name AS inspected_user_name,
    l.diff->>'seeded_problem_slug' AS seeded_problem_slug,
    NULLIF(l.diff->>'attempt_count','')::int AS attempt_count,
    NULLIF(l.diff->>'submission_count','')::int AS submission_count,
    l.created_at
  FROM public.admin_audit_log l
  LEFT JOIN public.profiles pa ON pa.user_id = l.actor_id
  LEFT JOIN public.profiles pi ON pi.user_id = (l.diff->>'inspected_user_id')::uuid
  WHERE l.action = 'daily_review.view_user_detail'
  ORDER BY l.created_at DESC
  LIMIT GREATEST(_limit, 1)
  OFFSET GREATEST(_offset, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_daily_review_audit(INT, INT) TO authenticated;
