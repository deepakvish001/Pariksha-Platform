
-- 1. Per-contest tunables for kiosk mode
ALTER TABLE public.contests
  ADD COLUMN IF NOT EXISTS min_trust_score integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS require_screen_share boolean NOT NULL DEFAULT true;

-- 2. Screen recording chunks
CREATE TABLE IF NOT EXISTS public.contest_screen_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  duration_sec integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_screen_rec_session
  ON public.contest_screen_recordings(session_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_contest_screen_rec_contest_user
  ON public.contest_screen_recordings(contest_id, user_id, started_at DESC);

ALTER TABLE public.contest_screen_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "screen_rec self insert"
  ON public.contest_screen_recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "screen_rec self read"
  ON public.contest_screen_recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "screen_rec admin all"
  ON public.contest_screen_recordings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Trust scores written by edge function
CREATE TABLE IF NOT EXISTS public.contest_trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  risk text NOT NULL CHECK (risk IN ('low','medium','high')),
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_trust_session
  ON public.contest_trust_scores(session_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_contest_trust_contest_user
  ON public.contest_trust_scores(contest_id, user_id, computed_at DESC);

ALTER TABLE public.contest_trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trust_scores self read"
  ON public.contest_trust_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "trust_scores admin all"
  ON public.contest_trust_scores FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.contest_trust_scores REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contest_trust_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_trust_scores;
  END IF;
END $$;

-- 4. Storage bucket for screen recordings (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contest-screen-recordings', 'contest-screen-recordings', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "screen_rec storage owner write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contest-screen-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "screen_rec storage owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contest-screen-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "screen_rec storage admin read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contest-screen-recordings'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 5. Helper: are auxiliary materials unlocked for this user on this contest?
--    Returns true when the contest is over, OR the user is not a registered
--    participant (so casual viewers still see the problem in normal mode).
CREATE OR REPLACE FUNCTION public.contest_aux_unlocked(_contest_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.contests%ROWTYPE;
  reg_status text;
BEGIN
  SELECT * INTO c FROM public.contests WHERE id = _contest_id;
  IF NOT FOUND THEN RETURN true; END IF;
  IF now() >= c.ends_at THEN RETURN true; END IF;

  SELECT status INTO reg_status
  FROM public.contest_registrations
  WHERE contest_id = _contest_id AND user_id = auth.uid();

  -- Only registered participants get aux materials locked during the contest.
  RETURN reg_status IS DISTINCT FROM 'registered';
END;
$$;

GRANT EXECUTE ON FUNCTION public.contest_aux_unlocked(uuid) TO authenticated;

-- 6. Tighter validate_contest_submission: heartbeat + recent screen chunk + trust score
CREATE OR REPLACE FUNCTION public.validate_contest_submission(_contest_id uuid, _problem_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.contests%ROWTYPE;
  reg_status text;
  has_session boolean;
  last_chunk timestamptz;
  latest_score integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unauth', 'message', 'Sign in required');
  END IF;

  SELECT * INTO c FROM public.contests WHERE id = _contest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'no_contest', 'message', 'Contest not found');
  END IF;

  IF now() < c.starts_at THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_started', 'message', 'Contest has not started');
  END IF;
  IF now() >= c.ends_at THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ended', 'message', 'Contest has ended');
  END IF;

  SELECT status INTO reg_status
  FROM public.contest_registrations
  WHERE contest_id = _contest_id AND user_id = auth.uid();

  IF reg_status IS NULL OR reg_status <> 'registered' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_registered', 'message', 'You are not registered for this contest');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.contest_sessions
    WHERE contest_id = _contest_id
      AND user_id = auth.uid()
      AND is_active = true
      AND (last_heartbeat_at IS NULL OR last_heartbeat_at > now() - INTERVAL '2 minutes')
  ) INTO has_session;

  IF NOT has_session THEN
    RETURN jsonb_build_object('ok', false, 'code', 'no_session',
      'message', 'No active secure session — heartbeat missing');
  END IF;

  -- Screen-share recency check (only if the contest requires it)
  IF c.require_screen_share THEN
    SELECT MAX(started_at) INTO last_chunk
    FROM public.contest_screen_recordings
    WHERE contest_id = _contest_id AND user_id = auth.uid();
    IF last_chunk IS NULL OR last_chunk < now() - INTERVAL '90 seconds' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'no_screen_share',
        'message', 'Screen sharing is required and was not detected recently');
    END IF;
  END IF;

  -- Trust score gate
  SELECT score INTO latest_score
  FROM public.contest_trust_scores
  WHERE contest_id = _contest_id AND user_id = auth.uid()
  ORDER BY computed_at DESC LIMIT 1;
  IF latest_score IS NOT NULL AND latest_score < c.min_trust_score THEN
    RETURN jsonb_build_object('ok', false, 'code', 'low_trust',
      'message', format('Trust score %s is below contest minimum %s', latest_score, c.min_trust_score));
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_contest_submission(uuid, text) TO authenticated;

-- 7. Realtime for screen recordings (so admin proctor view updates live)
ALTER TABLE public.contest_screen_recordings REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contest_screen_recordings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_screen_recordings;
  END IF;
END $$;
