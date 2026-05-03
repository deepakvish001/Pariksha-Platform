-- ============ Phase 1: Daily Habit Loop ============

-- 1) Daily challenge: exactly one curated problem per UTC day
CREATE TABLE public.arena_daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE NOT NULL UNIQUE,
  problem_slug TEXT NOT NULL REFERENCES public.coding_problems(slug) ON DELETE RESTRICT,
  bonus_xp INTEGER NOT NULL DEFAULT 100,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_arena_daily_challenges_date ON public.arena_daily_challenges(challenge_date DESC);

ALTER TABLE public.arena_daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Daily challenge visible to everyone"
  ON public.arena_daily_challenges FOR SELECT USING (true);
CREATE POLICY "Admins manage daily challenges"
  ON public.arena_daily_challenges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Player attempts on the daily challenge
CREATE TABLE public.arena_daily_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.arena_daily_challenges(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  solved BOOLEAN NOT NULL DEFAULT false,
  solve_time_sec INTEGER,
  battle_id UUID,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  solved_at TIMESTAMPTZ,
  UNIQUE (user_id, challenge_id)
);
CREATE INDEX idx_arena_daily_attempts_user ON public.arena_daily_attempts(user_id, challenge_date DESC);

ALTER TABLE public.arena_daily_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players see own daily attempts"
  ON public.arena_daily_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Players insert own daily attempts"
  ON public.arena_daily_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players update own daily attempts"
  ON public.arena_daily_attempts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3) Quest catalog
CREATE TABLE public.arena_quests_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  kind TEXT NOT NULL,         -- 'win_easy' | 'win_any' | 'fast_submit' | 'solve_daily' | 'beat_higher_elo' | 'play_count' ...
  target INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  difficulty TEXT NOT NULL DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
  weight INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.arena_quests_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests catalog visible to everyone"
  ON public.arena_quests_catalog FOR SELECT USING (true);
CREATE POLICY "Admins manage quests catalog"
  ON public.arena_quests_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Per-user daily quests (3 per day)
CREATE TABLE public.arena_user_daily_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_date DATE NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.arena_quests_catalog(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, quest_date, quest_id)
);
CREATE INDEX idx_arena_user_daily_quests_user_date ON public.arena_user_daily_quests(user_id, quest_date DESC);

ALTER TABLE public.arena_user_daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players see own quests"
  ON public.arena_user_daily_quests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Players insert own quests"
  ON public.arena_user_daily_quests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players update own quests"
  ON public.arena_user_daily_quests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5) Arena streaks
CREATE TABLE public.arena_streaks (
  user_id UUID NOT NULL PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  freezes_remaining INTEGER NOT NULL DEFAULT 1,
  freeze_week_start DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.arena_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players see own streak"
  ON public.arena_streaks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Players insert own streak"
  ON public.arena_streaks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players update own streak"
  ON public.arena_streaks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger reuses existing helper
CREATE TRIGGER trg_arena_daily_challenges_updated_at
  BEFORE UPDATE ON public.arena_daily_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RPCs ============

-- Get today's daily challenge with the player's attempt status
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
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today DATE := (now() AT TIME ZONE 'UTC')::date;
  _uid UUID := auth.uid();
BEGIN
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

-- Mark daily challenge as solved (idempotent) and award bonus XP once.
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
  _existing RECORD;
  _xp INTEGER := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT * INTO _challenge FROM public.arena_daily_challenges WHERE challenge_date = _today;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'no_challenge'); END IF;

  SELECT * INTO _existing
  FROM public.arena_daily_attempts
  WHERE user_id = _uid AND challenge_id = _challenge.id;

  IF FOUND AND _existing.solved THEN
    RETURN jsonb_build_object('ok', true, 'already_solved', true, 'xp', 0);
  END IF;

  _xp := _challenge.bonus_xp;

  IF FOUND THEN
    UPDATE public.arena_daily_attempts
    SET solved = true,
        solve_time_sec = _solve_time_sec,
        battle_id = _battle_id,
        xp_awarded = _xp,
        solved_at = now()
    WHERE id = _existing.id;
  ELSE
    INSERT INTO public.arena_daily_attempts (user_id, challenge_id, challenge_date, solved, solve_time_sec, battle_id, xp_awarded, solved_at)
    VALUES (_uid, _challenge.id, _today, true, _solve_time_sec, _battle_id, _xp, now());
  END IF;

  -- Award XP via existing ledger
  INSERT INTO public.xp_transactions (user_id, amount, source, description)
  VALUES (_uid, _xp, 'arena_daily', 'Daily Arena challenge solved');

  RETURN jsonb_build_object('ok', true, 'xp', _xp, 'already_solved', false);
END;
$$;

-- Tick the player's streak. Idempotent per-day.
-- If gap > 1 day and no freeze available -> reset to 1.
-- If gap = 1 -> +1 to current_streak.
-- If gap = 0 -> no-op.
CREATE OR REPLACE FUNCTION public.arena_tick_streak()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _today DATE := (now() AT TIME ZONE 'UTC')::date;
  _row RECORD;
  _gap INTEGER;
  _new_streak INTEGER;
  _used_freeze BOOLEAN := false;
  _week_start DATE := date_trunc('week', _today)::date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT * INTO _row FROM public.arena_streaks WHERE user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.arena_streaks (user_id, current_streak, longest_streak, last_active_date, freezes_remaining, freeze_week_start)
    VALUES (_uid, 1, 1, _today, 1, _week_start);
    RETURN jsonb_build_object('current', 1, 'longest', 1, 'used_freeze', false);
  END IF;

  -- Reset weekly freeze allowance
  IF _row.freeze_week_start IS NULL OR _row.freeze_week_start < _week_start THEN
    UPDATE public.arena_streaks SET freezes_remaining = 1, freeze_week_start = _week_start WHERE user_id = _uid;
    _row.freezes_remaining := 1;
  END IF;

  _gap := COALESCE(_today - _row.last_active_date, 999);

  IF _gap = 0 THEN
    RETURN jsonb_build_object('current', _row.current_streak, 'longest', _row.longest_streak, 'used_freeze', false);
  ELSIF _gap = 1 THEN
    _new_streak := _row.current_streak + 1;
  ELSIF _gap = 2 AND _row.freezes_remaining > 0 THEN
    _new_streak := _row.current_streak + 1;
    _used_freeze := true;
  ELSE
    _new_streak := 1;
  END IF;

  UPDATE public.arena_streaks
  SET current_streak = _new_streak,
      longest_streak = GREATEST(_row.longest_streak, _new_streak),
      last_active_date = _today,
      freezes_remaining = CASE WHEN _used_freeze THEN _row.freezes_remaining - 1 ELSE _row.freezes_remaining END,
      updated_at = now()
  WHERE user_id = _uid;

  RETURN jsonb_build_object('current', _new_streak, 'longest', GREATEST(_row.longest_streak, _new_streak), 'used_freeze', _used_freeze);
END;
$$;

-- Ensure the player has 3 quests for today; create if missing by sampling the catalog.
CREATE OR REPLACE FUNCTION public.arena_ensure_daily_quests()
RETURNS SETOF public.arena_user_daily_quests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _today DATE := (now() AT TIME ZONE 'UTC')::date;
  _existing INT;
  _q RECORD;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT COUNT(*) INTO _existing
  FROM public.arena_user_daily_quests
  WHERE user_id = _uid AND quest_date = _today;

  IF _existing < 3 THEN
    FOR _q IN
      SELECT * FROM public.arena_quests_catalog
      WHERE is_active = true
      ORDER BY random()
      LIMIT (3 - _existing)
    LOOP
      INSERT INTO public.arena_user_daily_quests (user_id, quest_date, quest_id, target, xp_reward)
      VALUES (_uid, _today, _q.id, _q.target, _q.xp_reward)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN QUERY
  SELECT * FROM public.arena_user_daily_quests
  WHERE user_id = _uid AND quest_date = _today;
END;
$$;

-- Claim a completed quest's XP (idempotent).
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

  SELECT * INTO _q FROM public.arena_user_daily_quests WHERE id = _user_quest_id AND user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'quest not found'; END IF;
  IF _q.claimed THEN RETURN jsonb_build_object('ok', true, 'already_claimed', true); END IF;
  IF NOT _q.completed THEN RAISE EXCEPTION 'quest not completed'; END IF;

  UPDATE public.arena_user_daily_quests
  SET claimed = true, claimed_at = now()
  WHERE id = _user_quest_id;

  INSERT INTO public.xp_transactions (user_id, amount, source, description)
  VALUES (_uid, _q.xp_reward, 'arena_quest', 'Daily Arena quest claimed');

  RETURN jsonb_build_object('ok', true, 'xp', _q.xp_reward);
END;
$$;

-- Increment quest progress for a given kind. Called server-side on battle finish.
CREATE OR REPLACE FUNCTION public.arena_record_quest_progress(_kind TEXT, _amount INTEGER DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _today DATE := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;

  UPDATE public.arena_user_daily_quests AS uq
  SET progress = LEAST(uq.target, uq.progress + _amount),
      completed = CASE WHEN uq.progress + _amount >= uq.target THEN true ELSE uq.completed END,
      completed_at = CASE WHEN uq.progress + _amount >= uq.target AND uq.completed_at IS NULL THEN now() ELSE uq.completed_at END
  FROM public.arena_quests_catalog c
  WHERE uq.user_id = _uid
    AND uq.quest_date = _today
    AND uq.quest_id = c.id
    AND c.kind = _kind
    AND uq.completed = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.arena_get_daily_challenge() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arena_complete_daily_challenge(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arena_tick_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.arena_ensure_daily_quests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.arena_claim_quest(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arena_record_quest_progress(TEXT, INTEGER) TO authenticated;

-- Seed an initial quest catalog
INSERT INTO public.arena_quests_catalog (code, title, description, kind, target, xp_reward, difficulty) VALUES
  ('win_any_1', 'First Blood', 'Win 1 battle today', 'win_any', 1, 50, 'easy'),
  ('win_any_3', 'Hat-trick', 'Win 3 battles today', 'win_any', 3, 150, 'medium'),
  ('play_count_5', 'Warmup Five', 'Play 5 battles today', 'play_count', 5, 80, 'easy'),
  ('win_easy_2', 'Easy Pickings', 'Win 2 Easy battles', 'win_easy', 2, 60, 'easy'),
  ('fast_submit_1', 'Speed Demon', 'Submit a correct solution in under 5 minutes', 'fast_submit', 1, 100, 'medium'),
  ('solve_daily_1', 'Daily Done', 'Solve today''s Daily Challenge', 'solve_daily', 1, 120, 'medium'),
  ('beat_higher_elo_1', 'Giant Slayer', 'Beat an opponent rated +50 Elo above you', 'beat_higher_elo', 1, 150, 'hard')
ON CONFLICT (code) DO NOTHING;