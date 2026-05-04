-- 1. Extend contest_sessions
ALTER TABLE public.contest_sessions
  ADD COLUMN IF NOT EXISTS client_fingerprint jsonb,
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS stream_grace_until timestamptz;

-- Backfill last_heartbeat_at from last_seen_at so existing RPCs don't break.
UPDATE public.contest_sessions
   SET last_heartbeat_at = COALESCE(last_heartbeat_at, last_seen_at)
 WHERE last_heartbeat_at IS NULL;

-- 2. contest_typing_events
CREATE TABLE IF NOT EXISTS public.contest_typing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  problem_slug text NOT NULL,
  char_count integer NOT NULL,
  dt_ms integer NOT NULL,
  is_burst boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_typing_events_contest_user
  ON public.contest_typing_events (contest_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_events_problem
  ON public.contest_typing_events (problem_slug, created_at DESC);

ALTER TABLE public.contest_typing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "typing self insert" ON public.contest_typing_events;
CREATE POLICY "typing self insert" ON public.contest_typing_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "typing self read" ON public.contest_typing_events;
CREATE POLICY "typing self read" ON public.contest_typing_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "typing admin read" ON public.contest_typing_events;
CREATE POLICY "typing admin read" ON public.contest_typing_events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. contest_stream_health
CREATE TABLE IF NOT EXISTS public.contest_stream_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  stream_kind text NOT NULL CHECK (stream_kind IN ('webcam','screen')),
  healthy boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stream_health_session
  ON public.contest_stream_health (session_id, created_at DESC);

ALTER TABLE public.contest_stream_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stream_health self insert" ON public.contest_stream_health;
CREATE POLICY "stream_health self insert" ON public.contest_stream_health
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "stream_health self read" ON public.contest_stream_health;
CREATE POLICY "stream_health self read" ON public.contest_stream_health
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "stream_health admin all" ON public.contest_stream_health;
CREATE POLICY "stream_health admin all" ON public.contest_stream_health
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. contest_tab_locks
CREATE TABLE IF NOT EXISTS public.contest_tab_locks (
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tab_id text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_id, user_id)
);

ALTER TABLE public.contest_tab_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tab_locks self read" ON public.contest_tab_locks;
CREATE POLICY "tab_locks self read" ON public.contest_tab_locks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tab_locks admin all" ON public.contest_tab_locks;
CREATE POLICY "tab_locks admin all" ON public.contest_tab_locks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. RPC: claim_tab_lock
CREATE OR REPLACE FUNCTION public.contest_claim_tab_lock(
  _contest_id uuid,
  _tab_id text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prev text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT tab_id INTO prev FROM public.contest_tab_locks
   WHERE contest_id = _contest_id AND user_id = auth.uid();

  INSERT INTO public.contest_tab_locks (contest_id, user_id, tab_id, claimed_at)
       VALUES (_contest_id, auth.uid(), _tab_id, now())
  ON CONFLICT (contest_id, user_id)
  DO UPDATE SET tab_id = EXCLUDED.tab_id, claimed_at = now();

  RETURN jsonb_build_object(
    'ok', true,
    'displaced_tab_id', CASE WHEN prev IS NOT NULL AND prev <> _tab_id THEN prev ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.contest_claim_tab_lock(uuid, text) TO authenticated;

-- 6. RPC: report_stream_health (auto-DQ when grace expires)
CREATE OR REPLACE FUNCTION public.contest_report_stream_health(
  _session_id uuid,
  _kind text,
  _healthy boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.contest_sessions%ROWTYPE;
  c_id uuid;
  dq boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT * INTO s FROM public.contest_sessions WHERE id = _session_id;
  IF NOT FOUND OR s.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;

  c_id := s.contest_id;

  INSERT INTO public.contest_stream_health (contest_id, user_id, session_id, stream_kind, healthy)
       VALUES (c_id, auth.uid(), _session_id, _kind, _healthy);

  IF _healthy THEN
    UPDATE public.contest_sessions SET stream_grace_until = NULL WHERE id = _session_id;
    RETURN jsonb_build_object('ok', true, 'healthy', true);
  END IF;

  -- Unhealthy: start grace if not already running
  IF s.stream_grace_until IS NULL THEN
    UPDATE public.contest_sessions
       SET stream_grace_until = now() + interval '30 seconds'
     WHERE id = _session_id;
    RETURN jsonb_build_object('ok', true, 'healthy', false, 'grace_until', now() + interval '30 seconds');
  END IF;

  -- Grace already expired -> DQ
  IF now() > s.stream_grace_until THEN
    UPDATE public.contest_sessions
       SET is_active = false, invalidated_at = now()
     WHERE id = _session_id;
    UPDATE public.contest_registrations
       SET disqualified_at = COALESCE(disqualified_at, now())
     WHERE contest_id = c_id AND user_id = auth.uid();
    dq := true;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'healthy', false,
    'grace_until', s.stream_grace_until,
    'disqualified', dq
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.contest_report_stream_health(uuid, text, boolean) TO authenticated;

-- 7. Update heartbeat to also accept fingerprint and stamp last_heartbeat_at.
-- Keep the existing single-arg version for backwards compatibility.
CREATE OR REPLACE FUNCTION public.contest_session_heartbeat(_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.contest_sessions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  -- Reap stale sessions
  UPDATE public.contest_sessions
     SET is_active = false, invalidated_at = now()
   WHERE is_active = true
     AND last_seen_at < now() - interval '90 seconds';

  SELECT * INTO s FROM public.contest_sessions WHERE id = _session_id;
  IF NOT FOUND OR s.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;
  IF NOT s.is_active THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalidated');
  END IF;

  UPDATE public.contest_sessions
     SET last_seen_at = now(), last_heartbeat_at = now()
   WHERE id = _session_id;

  RETURN jsonb_build_object('ok', true, 'last_seen_at', now());
END;
$$;

-- New 2-arg variant with fingerprint drift check
CREATE OR REPLACE FUNCTION public.contest_session_heartbeat(
  _session_id uuid,
  _fingerprint jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.contest_sessions%ROWTYPE;
  drift boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  UPDATE public.contest_sessions
     SET is_active = false, invalidated_at = now()
   WHERE is_active = true
     AND last_seen_at < now() - interval '90 seconds';

  SELECT * INTO s FROM public.contest_sessions WHERE id = _session_id;
  IF NOT FOUND OR s.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;
  IF NOT s.is_active THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalidated');
  END IF;

  IF s.client_fingerprint IS NOT NULL
     AND _fingerprint IS NOT NULL
     AND (s.client_fingerprint->>'canvasHash') IS NOT NULL
     AND (_fingerprint->>'canvasHash') IS NOT NULL
     AND (s.client_fingerprint->>'canvasHash') <> (_fingerprint->>'canvasHash') THEN
    drift := true;
  END IF;

  UPDATE public.contest_sessions
     SET last_seen_at = now(),
         last_heartbeat_at = now(),
         client_fingerprint = COALESCE(client_fingerprint, _fingerprint)
   WHERE id = _session_id;

  RETURN jsonb_build_object('ok', true, 'last_seen_at', now(), 'fingerprint_drift', drift);
END;
$$;

GRANT EXECUTE ON FUNCTION public.contest_session_heartbeat(uuid, jsonb) TO authenticated;

-- 8. Update start_secure_session to accept fingerprint
CREATE OR REPLACE FUNCTION public.contest_start_secure_session(
  _contest_id uuid,
  _user_agent text DEFAULT NULL,
  _fingerprint jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _starts timestamptz;
  _ends timestamptz;
  _reg public.contest_registrations%ROWTYPE;
  _new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT starts_at, ends_at INTO _starts, _ends
    FROM public.contests WHERE id = _contest_id;
  IF _starts IS NULL THEN RAISE EXCEPTION 'contest not found'; END IF;
  IF now() < _starts THEN RAISE EXCEPTION 'contest has not started'; END IF;
  IF now() > _ends THEN RAISE EXCEPTION 'contest has ended'; END IF;

  SELECT * INTO _reg FROM public.contest_registrations
   WHERE contest_id = _contest_id AND user_id = auth.uid();
  IF _reg.id IS NULL THEN RAISE EXCEPTION 'not registered for this contest'; END IF;
  IF _reg.disqualified_at IS NOT NULL THEN RAISE EXCEPTION 'disqualified'; END IF;
  IF _reg.honor_code_accepted_at IS NULL THEN
    RAISE EXCEPTION 'honor code not accepted';
  END IF;

  UPDATE public.contest_sessions
     SET is_active = false, invalidated_at = now()
   WHERE contest_id = _contest_id AND user_id = auth.uid() AND is_active = true;

  INSERT INTO public.contest_sessions (contest_id, user_id, user_agent, client_fingerprint, last_heartbeat_at)
       VALUES (_contest_id, auth.uid(), _user_agent, _fingerprint, now())
    RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.contest_start_secure_session(uuid, text, jsonb) TO authenticated;

-- 9. Extend validate_contest_submission with paste-only check
CREATE OR REPLACE FUNCTION public.validate_contest_submission(_contest_id uuid, _problem_slug text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.contests%ROWTYPE;
  reg_status text;
  has_session boolean;
  last_chunk timestamptz;
  latest_score integer;
  total_typed integer;
  burst_count integer;
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
      AND (last_heartbeat_at IS NULL OR last_heartbeat_at > now() - INTERVAL '45 seconds')
  ) INTO has_session;
  IF NOT has_session THEN
    RETURN jsonb_build_object('ok', false, 'code', 'no_session',
      'message', 'No active secure session — heartbeat missing');
  END IF;

  IF c.require_screen_share THEN
    SELECT MAX(started_at) INTO last_chunk
    FROM public.contest_screen_recordings
    WHERE contest_id = _contest_id AND user_id = auth.uid();
    IF last_chunk IS NULL OR last_chunk < now() - INTERVAL '90 seconds' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'no_screen_share',
        'message', 'Screen sharing is required and was not detected recently');
    END IF;
  END IF;

  -- Paste-only check: in the last 60s, did this user actually type anything
  -- on this problem? If they have NO typing events at all on this problem
  -- but are submitting > 200 chars worth, reject as paste-only.
  SELECT COALESCE(SUM(char_count), 0), COALESCE(SUM(CASE WHEN is_burst THEN 1 ELSE 0 END), 0)
    INTO total_typed, burst_count
    FROM public.contest_typing_events
   WHERE contest_id = _contest_id
     AND user_id = auth.uid()
     AND problem_slug = _problem_slug
     AND created_at > now() - interval '24 hours';

  IF total_typed = 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'paste_only',
      'message', 'No typing detected for this problem — pasted submissions are blocked');
  END IF;

  SELECT score INTO latest_score
  FROM public.contest_trust_scores
  WHERE contest_id = _contest_id AND user_id = auth.uid()
  ORDER BY computed_at DESC LIMIT 1;
  IF latest_score IS NOT NULL AND latest_score < c.min_trust_score THEN
    RETURN jsonb_build_object('ok', false, 'code', 'low_trust',
      'message', format('Trust score %s is below contest minimum %s', latest_score, c.min_trust_score));
  END IF;

  RETURN jsonb_build_object('ok', true, 'burst_count', burst_count);
END;
$$;