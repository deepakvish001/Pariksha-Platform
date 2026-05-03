
-- 1) Per-user Arena notification prefs
CREATE TABLE IF NOT EXISTS public.arena_notification_prefs (
  user_id UUID PRIMARY KEY,
  daily_reminder BOOLEAN NOT NULL DEFAULT false,
  reminder_hour_utc SMALLINT NOT NULL DEFAULT 14 CHECK (reminder_hour_utc BETWEEN 0 AND 23),
  last_reminded_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.arena_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anp self read"   ON public.arena_notification_prefs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anp self insert" ON public.arena_notification_prefs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anp self update" ON public.arena_notification_prefs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) Hardened complete-daily-challenge: verify battle's problem == today's seeded problem
CREATE OR REPLACE FUNCTION public.arena_complete_daily_challenge(
  _battle_id UUID,
  _solve_time_sec INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _today DATE := (now() AT TIME ZONE 'UTC')::date;
  _challenge RECORD;
  _battle RECORD;
  _existing RECORD;
  _xp INTEGER := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT * INTO _challenge FROM public.arena_daily_challenges WHERE challenge_date = _today;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_challenge');
  END IF;

  -- Verify battle exists, the caller participated, and it matches today's problem.
  SELECT id, problem_slug, player_a, player_b, status, winner_id
    INTO _battle FROM public.battles WHERE id = _battle_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'battle_not_found');
  END IF;
  IF _battle.player_a <> _uid AND _battle.player_b <> _uid THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_participant');
  END IF;
  IF _battle.problem_slug IS DISTINCT FROM _challenge.problem_slug THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'problem_mismatch');
  END IF;

  SELECT * INTO _existing
  FROM public.arena_daily_attempts
  WHERE user_id = _uid AND challenge_id = _challenge.id;

  IF FOUND AND _existing.solved THEN
    RETURN jsonb_build_object('ok', true, 'already_solved', true, 'xp', 0);
  END IF;

  _xp := _challenge.bonus_xp;

  IF FOUND THEN
    UPDATE public.arena_daily_attempts
    SET solved = true, solve_time_sec = _solve_time_sec,
        battle_id = _battle_id, xp_awarded = _xp, solved_at = now()
    WHERE id = _existing.id;
  ELSE
    INSERT INTO public.arena_daily_attempts (user_id, challenge_id, challenge_date, solved, solve_time_sec, battle_id, xp_awarded, solved_at)
    VALUES (_uid, _challenge.id, _today, true, _solve_time_sec, _battle_id, _xp, now());
  END IF;

  INSERT INTO public.xp_transactions (user_id, amount, source, description)
  VALUES (_uid, _xp, 'arena_daily', 'Daily Arena challenge solved');

  RETURN jsonb_build_object('ok', true, 'xp', _xp, 'already_solved', false);
END;
$$;

-- 3) Paginated history
CREATE OR REPLACE FUNCTION public.arena_get_daily_history(
  _days INTEGER DEFAULT 30,
  _offset INTEGER DEFAULT 0
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
  _lim INTEGER := GREATEST(LEAST(_days, 90), 1);
  _off INTEGER := GREATEST(_offset, 0);
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  RETURN QUERY
  SELECT c.challenge_date, c.problem_slug, p.title,
         COALESCE(a.solved, false), a.solve_time_sec,
         COALESCE(a.xp_awarded, 0), a.attempted_at
  FROM public.arena_daily_challenges c
  LEFT JOIN public.arena_daily_attempts a
    ON a.challenge_id = c.id AND a.user_id = _uid
  LEFT JOIN public.coding_problems p ON p.slug = c.problem_slug
  ORDER BY c.challenge_date DESC
  LIMIT _lim OFFSET _off;
END;
$$;

GRANT EXECUTE ON FUNCTION public.arena_get_daily_history(INTEGER, INTEGER) TO authenticated;
