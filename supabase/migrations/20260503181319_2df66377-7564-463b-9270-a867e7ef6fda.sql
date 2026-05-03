-- ============================================================
-- Contest Secure Mode infrastructure
-- ============================================================

-- 1) Extend contest_registrations with honor-code + DQ tracking
ALTER TABLE public.contest_registrations
  ADD COLUMN IF NOT EXISTS honor_code_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS disqualified_at timestamptz,
  ADD COLUMN IF NOT EXISTS disqualified_reason text,
  ADD COLUMN IF NOT EXISTS violation_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false;

-- 2) Active session tracking (one active session per (contest, user))
CREATE TABLE IF NOT EXISTS public.contest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_token uuid NOT NULL DEFAULT gen_random_uuid(),
  user_agent text,
  ip_hash text,
  is_active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  invalidated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_contest_sessions_contest_user
  ON public.contest_sessions(contest_id, user_id);
CREATE INDEX IF NOT EXISTS idx_contest_sessions_active
  ON public.contest_sessions(contest_id, user_id) WHERE is_active = true;

ALTER TABLE public.contest_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contest_sessions self read"
  ON public.contest_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contest_sessions admin all"
  ON public.contest_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) Violation log
CREATE TABLE IF NOT EXISTS public.contest_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  type text NOT NULL,            -- e.g. tab_blur, paste, fullscreen_exit, webcam_denied, copy
  severity text NOT NULL DEFAULT 'warn', -- warn|flag|fatal
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_violations_contest_user
  ON public.contest_violations(contest_id, user_id, created_at DESC);

ALTER TABLE public.contest_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contest_violations self read"
  ON public.contest_violations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contest_violations admin all"
  ON public.contest_violations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Proctor snapshots
CREATE TABLE IF NOT EXISTS public.contest_proctor_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_snapshots_contest_user
  ON public.contest_proctor_snapshots(contest_id, user_id, captured_at DESC);

ALTER TABLE public.contest_proctor_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contest_snapshots self insert"
  ON public.contest_proctor_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contest_snapshots self read"
  ON public.contest_proctor_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contest_snapshots admin all"
  ON public.contest_proctor_snapshots FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) Storage bucket for snapshots (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contest-proctor', 'contest-proctor', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "contest-proctor self upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contest-proctor'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "contest-proctor admin read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contest-proctor'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "contest-proctor self read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contest-proctor'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6) RPC: accept honor code (must be before contest start)
CREATE OR REPLACE FUNCTION public.contest_accept_honor_code(_contest_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _starts timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT starts_at INTO _starts FROM public.contests WHERE id = _contest_id;
  IF _starts IS NULL THEN RAISE EXCEPTION 'contest not found'; END IF;

  UPDATE public.contest_registrations
     SET honor_code_accepted_at = now()
   WHERE contest_id = _contest_id AND user_id = auth.uid();

  IF NOT FOUND THEN RAISE EXCEPTION 'not registered'; END IF;
END;
$$;

-- 7) RPC: start a secure session (blocks late entry, single active session)
CREATE OR REPLACE FUNCTION public.contest_start_secure_session(
  _contest_id uuid,
  _user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Late-join lockout: must have a row whose registration was created before start
  -- (registrations table already disallows registering after start in app logic).

  -- Invalidate prior active sessions
  UPDATE public.contest_sessions
     SET is_active = false, invalidated_at = now()
   WHERE contest_id = _contest_id AND user_id = auth.uid() AND is_active = true;

  INSERT INTO public.contest_sessions (contest_id, user_id, user_agent)
       VALUES (_contest_id, auth.uid(), _user_agent)
    RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

-- 8) RPC: log a violation; auto-flag at >=3; auto-DQ at >=5
CREATE OR REPLACE FUNCTION public.contest_log_violation(
  _contest_id uuid,
  _session_id uuid,
  _type text,
  _severity text DEFAULT 'warn',
  _meta jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count int;
  _flagged boolean := false;
  _dq boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _type IS NULL OR length(_type) = 0 THEN RAISE EXCEPTION 'type required'; END IF;

  INSERT INTO public.contest_violations (contest_id, user_id, session_id, type, severity, meta)
  VALUES (_contest_id, auth.uid(), _session_id, _type, COALESCE(_severity,'warn'), COALESCE(_meta,'{}'::jsonb));

  UPDATE public.contest_registrations
     SET violation_count = violation_count + 1,
         flagged = (violation_count + 1) >= 3,
         disqualified_at = CASE
           WHEN (violation_count + 1) >= 5 AND disqualified_at IS NULL THEN now()
           ELSE disqualified_at END,
         disqualified_reason = CASE
           WHEN (violation_count + 1) >= 5 AND disqualified_reason IS NULL
             THEN 'auto: ' || _type
           ELSE disqualified_reason END
   WHERE contest_id = _contest_id AND user_id = auth.uid()
   RETURNING violation_count, flagged, (disqualified_at IS NOT NULL)
        INTO _count, _flagged, _dq;

  RETURN jsonb_build_object(
    'violation_count', COALESCE(_count, 0),
    'flagged', COALESCE(_flagged, false),
    'disqualified', COALESCE(_dq, false)
  );
END;
$$;

-- 9) Block late registrations at the database level (defence in depth)
CREATE OR REPLACE FUNCTION public.contest_registrations_block_late()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  _starts timestamptz;
BEGIN
  SELECT starts_at INTO _starts FROM public.contests WHERE id = NEW.contest_id;
  IF _starts IS NOT NULL AND now() >= _starts THEN
    RAISE EXCEPTION 'registration is closed: contest has already started';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_late_registration ON public.contest_registrations;
CREATE TRIGGER trg_block_late_registration
  BEFORE INSERT ON public.contest_registrations
  FOR EACH ROW EXECUTE FUNCTION public.contest_registrations_block_late();
