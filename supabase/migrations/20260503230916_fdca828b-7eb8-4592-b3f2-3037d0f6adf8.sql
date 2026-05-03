-- 1. device_meta column for richer admin review
ALTER TABLE public.contest_sessions
  ADD COLUMN IF NOT EXISTS device_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Tighten validate_contest_submission: require an active secure session
CREATE OR REPLACE FUNCTION public.validate_contest_submission(_contest_id uuid, _problem_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.contests%ROWTYPE;
  reg public.contest_registrations%ROWTYPE;
  uid uuid := auth.uid();
  already_solved boolean;
  has_active_session boolean;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'auth_required', 'message', 'Sign in to submit');
  END IF;

  SELECT * INTO c FROM public.contests WHERE id = _contest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Contest not found');
  END IF;

  IF c.status IN ('draft','archived') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_active', 'message', 'Contest is not active');
  END IF;

  IF now() < c.starts_at THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_started', 'message', 'Contest has not started yet');
  END IF;

  IF now() > c.ends_at OR c.status = 'ended' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'closed', 'message', 'Contest has ended');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.contest_problems WHERE contest_id = _contest_id AND problem_slug = _problem_slug) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_problem', 'message', 'Problem is not part of this contest');
  END IF;

  SELECT * INTO reg FROM public.contest_registrations
    WHERE contest_id = _contest_id AND user_id = uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_registered', 'message', 'Register for the contest before submitting');
  END IF;
  IF reg.status = 'disqualified' OR reg.disqualified_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'disqualified', 'message', 'You are disqualified from this contest');
  END IF;
  IF reg.status = 'withdrawn' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'withdrawn', 'message', 'You have withdrawn from this contest');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.contest_sessions
     WHERE contest_id = _contest_id AND user_id = uid AND is_active = true
  ) INTO has_active_session;
  IF NOT has_active_session THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'no_active_session',
      'message', 'Start a Secure Session from the contest page before submitting'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.contest_submissions
    WHERE contest_id = _contest_id AND user_id = uid AND problem_slug = _problem_slug AND verdict = 'accepted'
  ) INTO already_solved;
  IF already_solved THEN
    RETURN jsonb_build_object('ok', false, 'code', 'already_solved', 'message', 'You already solved this problem');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_contest_submission(uuid, text) TO authenticated;

-- 3. Trigger: on disqualification, invalidate all active sessions for that user/contest
CREATE OR REPLACE FUNCTION public.contest_invalidate_sessions_on_dq()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.disqualified_at IS NOT NULL
     AND (OLD.disqualified_at IS NULL OR OLD.disqualified_at <> NEW.disqualified_at) THEN
    UPDATE public.contest_sessions
       SET is_active = false, invalidated_at = now()
     WHERE contest_id = NEW.contest_id
       AND user_id = NEW.user_id
       AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contest_registrations_dq_invalidate ON public.contest_registrations;
CREATE TRIGGER contest_registrations_dq_invalidate
AFTER UPDATE OF disqualified_at ON public.contest_registrations
FOR EACH ROW EXECUTE FUNCTION public.contest_invalidate_sessions_on_dq();

-- 4. Admin-only RPC to force-end a session
CREATE OR REPLACE FUNCTION public.contest_force_end_session(_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  UPDATE public.contest_sessions
     SET is_active = false, invalidated_at = now()
   WHERE id = _session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.contest_force_end_session(uuid) TO authenticated;

-- 5. Realtime for instant kick-on-other-device
ALTER TABLE public.contest_sessions REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_sessions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
