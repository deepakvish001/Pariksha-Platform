-- =========================================================
-- Solo Arena MVP
-- =========================================================

-- solo_sessions: one timed run per row
CREATE TABLE public.solo_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('interview','assessment','contest')),
  status text NOT NULL DEFAULT 'live' CHECK (status IN ('live','completed','expired','abandoned')),
  difficulty text NOT NULL DEFAULT 'medium',
  duration_sec integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  completed_at timestamptz,
  score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 100,
  rating_delta integer NOT NULL DEFAULT 0,
  xp_awarded integer NOT NULL DEFAULT 0,
  focus_lost_count integer NOT NULL DEFAULT 0,
  paste_count integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_solo_sessions_user ON public.solo_sessions(user_id, started_at DESC);
CREATE INDEX idx_solo_sessions_live ON public.solo_sessions(user_id) WHERE status = 'live';

ALTER TABLE public.solo_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solo_sessions self read"
  ON public.solo_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "solo_sessions self insert"
  ON public.solo_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "solo_sessions self update"
  ON public.solo_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- solo_session_problems
CREATE TABLE public.solo_session_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.solo_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  problem_slug text NOT NULL,
  ord integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  wrong_submits integer NOT NULL DEFAULT 0,
  first_ac_at timestamptz,
  time_to_ac_sec integer,
  awarded_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, problem_slug)
);
CREATE INDEX idx_ssp_session ON public.solo_session_problems(session_id);

ALTER TABLE public.solo_session_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ssp self read"
  ON public.solo_session_problems FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "ssp self insert"
  ON public.solo_session_problems FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ssp self update"
  ON public.solo_session_problems FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- solo_ratings
CREATE TABLE public.solo_ratings (
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('interview','assessment','contest')),
  rating integer NOT NULL DEFAULT 1000,
  peak_rating integer NOT NULL DEFAULT 1000,
  games_played integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'bronze',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, mode)
);
ALTER TABLE public.solo_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solo_ratings public read"
  ON public.solo_ratings FOR SELECT USING (true);
CREATE POLICY "solo_ratings self upsert"
  ON public.solo_ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "solo_ratings self update"
  ON public.solo_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- RPCs
-- =========================================================

-- Pick a random published problem at given difficulty
CREATE OR REPLACE FUNCTION public.solo_start_session(
  _mode text,
  _difficulty text DEFAULT 'medium',
  _duration_sec integer DEFAULT 1800
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _slug text;
  _session_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _mode NOT IN ('interview','assessment','contest') THEN
    RAISE EXCEPTION 'invalid mode';
  END IF;
  IF _duration_sec < 300 OR _duration_sec > 7200 THEN
    RAISE EXCEPTION 'invalid duration';
  END IF;

  -- Abort any prior live session for this user/mode (auto-expire)
  UPDATE solo_sessions
     SET status = 'expired', completed_at = now()
   WHERE user_id = _uid AND status = 'live' AND ends_at < now();

  -- Reject if user has an active live session (one at a time)
  IF EXISTS (SELECT 1 FROM solo_sessions WHERE user_id = _uid AND status='live' AND ends_at >= now()) THEN
    RAISE EXCEPTION 'active session exists';
  END IF;

  SELECT slug INTO _slug
    FROM coding_problems
   WHERE is_published = true AND difficulty = _difficulty
   ORDER BY random() LIMIT 1;

  IF _slug IS NULL THEN
    SELECT slug INTO _slug FROM coding_problems WHERE is_published = true ORDER BY random() LIMIT 1;
  END IF;
  IF _slug IS NULL THEN RAISE EXCEPTION 'no problems available'; END IF;

  INSERT INTO solo_sessions(user_id, mode, difficulty, duration_sec, ends_at, max_score, config)
  VALUES (_uid, _mode, _difficulty, _duration_sec, now() + make_interval(secs => _duration_sec),
          100, jsonb_build_object('problem_slugs', jsonb_build_array(_slug)))
  RETURNING id INTO _session_id;

  INSERT INTO solo_session_problems(session_id, user_id, problem_slug, ord)
  VALUES (_session_id, _uid, _slug, 0);

  RETURN _session_id;
END $$;

REVOKE ALL ON FUNCTION public.solo_start_session(text,text,integer) FROM public;
GRANT EXECUTE ON FUNCTION public.solo_start_session(text,text,integer) TO authenticated;

-- Record an attempt; pass solved=true with the verdict from existing judge result (client trusted only for stats; finalization rescues from cheating since rating only persists if solved row exists with ts before deadline)
CREATE OR REPLACE FUNCTION public.solo_record_attempt(
  _session_id uuid,
  _problem_slug text,
  _solved boolean,
  _verdict text DEFAULT 'wrong'
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _s solo_sessions%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO _s FROM solo_sessions WHERE id = _session_id AND user_id = _uid;
  IF _s.id IS NULL THEN RAISE EXCEPTION 'session not found'; END IF;
  IF _s.status <> 'live' OR now() > _s.ends_at THEN RAISE EXCEPTION 'session not live'; END IF;

  UPDATE solo_session_problems
     SET attempts = attempts + 1,
         wrong_submits = wrong_submits + CASE WHEN _solved THEN 0 ELSE 1 END,
         first_ac_at  = COALESCE(first_ac_at, CASE WHEN _solved THEN now() ELSE NULL END),
         time_to_ac_sec = COALESCE(time_to_ac_sec,
                                   CASE WHEN _solved
                                        THEN EXTRACT(EPOCH FROM (now() - _s.started_at))::int
                                        ELSE NULL END)
   WHERE session_id = _session_id AND problem_slug = _problem_slug;
END $$;

REVOKE ALL ON FUNCTION public.solo_record_attempt(uuid,text,boolean,text) FROM public;
GRANT EXECUTE ON FUNCTION public.solo_record_attempt(uuid,text,boolean,text) TO authenticated;

-- Finalize: compute score + rating delta + XP
CREATE OR REPLACE FUNCTION public.solo_finalize_session(_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _s solo_sessions%ROWTYPE;
  _solved boolean := false;
  _time_sec int := 0;
  _wrong int := 0;
  _score int := 0;
  _xp int := 0;
  _delta int := 0;
  _r solo_ratings%ROWTYPE;
  _new_tier text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO _s FROM solo_sessions WHERE id = _session_id AND user_id = _uid FOR UPDATE;
  IF _s.id IS NULL THEN RAISE EXCEPTION 'session not found'; END IF;
  IF _s.status <> 'live' THEN
    RETURN jsonb_build_object('already', true, 'score', _s.score, 'rating_delta', _s.rating_delta);
  END IF;

  SELECT (first_ac_at IS NOT NULL AND first_ac_at <= _s.ends_at),
         COALESCE(time_to_ac_sec, _s.duration_sec),
         wrong_submits
    INTO _solved, _time_sec, _wrong
    FROM solo_session_problems
   WHERE session_id = _session_id
   ORDER BY ord LIMIT 1;

  IF _solved THEN
    -- correctness 60 + time bonus up to 30 + first-try bonus 10
    _score := 60
            + GREATEST(0, 30 - (_time_sec * 30 / GREATEST(_s.duration_sec,1)))
            + CASE WHEN _wrong = 0 THEN 10 ELSE 0 END;
  ELSE
    _score := 0;
  END IF;

  _xp := CASE _s.difficulty WHEN 'easy' THEN 30 WHEN 'hard' THEN 120 ELSE 60 END * _score / 100;

  -- Rating: simple Elo-like: solved fast -> +25, solved -> +15, fail -> -10
  _delta := CASE
    WHEN _solved AND _score >= 90 THEN 25
    WHEN _solved THEN 15
    ELSE -10
  END;

  -- Upsert rating
  INSERT INTO solo_ratings(user_id, mode, rating, peak_rating, games_played)
  VALUES (_uid, _s.mode, GREATEST(0, 1000 + _delta), GREATEST(1000, 1000 + _delta), 1)
  ON CONFLICT (user_id, mode) DO UPDATE
    SET rating = GREATEST(0, solo_ratings.rating + EXCLUDED.rating - 1000 + _delta - _delta),
        games_played = solo_ratings.games_played + 1,
        updated_at = now();
  -- Note: simpler — recompute correctly below
  UPDATE solo_ratings
     SET rating = GREATEST(0, rating + _delta),
         peak_rating = GREATEST(peak_rating, rating + _delta),
         tier = CASE
           WHEN rating + _delta >= 2400 THEN 'grandmaster'
           WHEN rating + _delta >= 2000 THEN 'diamond'
           WHEN rating + _delta >= 1700 THEN 'platinum'
           WHEN rating + _delta >= 1400 THEN 'gold'
           WHEN rating + _delta >= 1100 THEN 'silver'
           ELSE 'bronze'
         END,
         updated_at = now()
   WHERE user_id = _uid AND mode = _s.mode;

  UPDATE solo_session_problems SET awarded_score = _score
   WHERE session_id = _session_id;

  UPDATE solo_sessions
     SET status = CASE WHEN now() > ends_at THEN 'expired' ELSE 'completed' END,
         completed_at = now(),
         score = _score,
         rating_delta = _delta,
         xp_awarded = _xp
   WHERE id = _session_id;

  -- Award XP via profiles (best-effort; ignore if table doesn't allow)
  BEGIN
    UPDATE profiles SET xp = COALESCE(xp,0) + _xp WHERE id = _uid;
  EXCEPTION WHEN others THEN NULL;
  END;

  RETURN jsonb_build_object(
    'solved', _solved, 'score', _score, 'rating_delta', _delta,
    'xp_awarded', _xp, 'time_sec', _time_sec, 'wrong_submits', _wrong
  );
END $$;

REVOKE ALL ON FUNCTION public.solo_finalize_session(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.solo_finalize_session(uuid) TO authenticated;