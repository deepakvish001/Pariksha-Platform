
-- ============ Daily challenge auto-seed + history + hardened quest claim ============

-- Helper: pick a problem slug for a given date.
-- Priority: admin_daily_challenge_schedule -> deterministic rotation across published problems.
CREATE OR REPLACE FUNCTION public.arena_pick_daily_problem(_for_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slug TEXT;
  _count INTEGER;
  _idx INTEGER;
BEGIN
  -- 1) Admin override
  SELECT problem_slug INTO _slug
  FROM public.admin_daily_challenge_schedule
  WHERE challenge_date = _for_date
  LIMIT 1;
  IF _slug IS NOT NULL THEN
    RETURN _slug;
  END IF;

  -- 2) Deterministic rotation: order published problems by slug, pick by day-of-epoch mod count.
  SELECT COUNT(*) INTO _count FROM public.coding_problems WHERE is_published = true;
  IF COALESCE(_count, 0) = 0 THEN
    RETURN NULL;
  END IF;

  _idx := (EXTRACT(EPOCH FROM _for_date)::BIGINT / 86400)::INTEGER % _count;

  SELECT slug INTO _slug FROM (
    SELECT slug, ROW_NUMBER() OVER (ORDER BY slug) - 1 AS rn
    FROM public.coding_problems
    WHERE is_published = true
  ) ranked WHERE rn = _idx;

  RETURN _slug;
END;
$$;

-- Replace get_daily_challenge to auto-seed today if missing.
CREATE OR REPLACE FUNCTION public.arena_get_daily_challenge()
RETURNS TABLE (
  challenge_id UUID,
  challenge_date DATE,
  problem_slug TEXT,
  bonus_xp INTEGER,
  attempted BOOLEAN,
  solved BOOLEAN,
  solve_time_sec INTEGER,
  global_solves BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today DATE := (now() AT TIME ZONE 'UTC')::date;
  _uid UUID := auth.uid();
  _slug TEXT;
BEGIN
  -- Auto-seed if today has no row yet
  IF NOT EXISTS (SELECT 1 FROM public.arena_daily_challenges WHERE challenge_date = _today) THEN
    _slug := public.arena_pick_daily_problem(_today);
    IF _slug IS NOT NULL THEN
      INSERT INTO public.arena_daily_challenges (challenge_date, problem_slug, bonus_xp)
      VALUES (_today, _slug, 100)
      ON CONFLICT (challenge_date) DO NOTHING;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.challenge_date,
    c.problem_slug,
    c.bonus_xp,
    COALESCE(a.id IS NOT NULL, false) AS attempted,
    COALESCE(a.solved, false) AS solved,
    a.solve_time_sec,
    (SELECT COUNT(*) FROM public.arena_daily_attempts ad WHERE ad.challenge_id = c.id AND ad.solved) AS global_solves
  FROM public.arena_daily_challenges c
  LEFT JOIN public.arena_daily_attempts a
    ON a.challenge_id = c.id AND a.user_id = _uid
  WHERE c.challenge_date = _today
  LIMIT 1;
END;
$$;

-- History: last N days of daily attempts for the player.
CREATE OR REPLACE FUNCTION public.arena_get_daily_history(_days INTEGER DEFAULT 30)
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
  RETURN QUERY
  SELECT
    c.challenge_date,
    c.problem_slug,
    p.title,
    COALESCE(a.solved, false),
    a.solve_time_sec,
    COALESCE(a.xp_awarded, 0),
    a.attempted_at
  FROM public.arena_daily_challenges c
  LEFT JOIN public.arena_daily_attempts a
    ON a.challenge_id = c.id AND a.user_id = _uid
  LEFT JOIN public.coding_problems p ON p.slug = c.problem_slug
  WHERE c.challenge_date >= ((now() AT TIME ZONE 'UTC')::date - GREATEST(LEAST(_days, 90), 1))
  ORDER BY c.challenge_date DESC;
END;
$$;

-- Hardened quest claim: re-verify progress vs target server-side and use FOR UPDATE
-- so concurrent claim clicks cannot double-credit.
CREATE OR REPLACE FUNCTION public.arena_claim_quest(_user_quest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _q RECORD;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT * INTO _q
  FROM public.arena_user_daily_quests
  WHERE id = _user_quest_id AND user_id = _uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'quest not found';
  END IF;

  -- Idempotent: already claimed -> succeed without crediting again.
  IF _q.claimed THEN
    RETURN jsonb_build_object('ok', true, 'already_claimed', true, 'xp', 0);
  END IF;

  -- Server-side validation: progress must actually meet target. The completed
  -- flag alone is not trusted because RLS allows clients to update their row.
  IF _q.progress < _q.target THEN
    RAISE EXCEPTION 'quest not completed';
  END IF;

  -- Atomic claim — second concurrent caller will see claimed=true and exit above.
  UPDATE public.arena_user_daily_quests
  SET claimed = true,
      claimed_at = now(),
      completed = true,
      completed_at = COALESCE(completed_at, now())
  WHERE id = _user_quest_id AND claimed = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'already_claimed', true, 'xp', 0);
  END IF;

  INSERT INTO public.xp_transactions (user_id, amount, source, description)
  VALUES (_uid, _q.xp_reward, 'arena_quest', 'Daily Arena quest claimed');

  RETURN jsonb_build_object('ok', true, 'xp', _q.xp_reward);
END;
$$;

GRANT EXECUTE ON FUNCTION public.arena_pick_daily_problem(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arena_get_daily_history(INTEGER) TO authenticated;
