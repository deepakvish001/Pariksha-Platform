-- 1) Heartbeat RPC: refreshes last_seen_at and reaps stale sessions
CREATE OR REPLACE FUNCTION public.contest_session_heartbeat(_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.contest_sessions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  -- Reap any stale (no heartbeat for 90s) active sessions across the table.
  -- Cheap because of the partial index on (contest_id, user_id) where is_active.
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
     SET last_seen_at = now()
   WHERE id = _session_id;

  RETURN jsonb_build_object('ok', true, 'last_seen_at', now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.contest_session_heartbeat(uuid) TO authenticated;

-- 2) Mirror trigger: also require a live (recent heartbeat) active session.
-- This is the server-side enforcement that blocks a submission from counting
-- toward a contest if the secure session is missing/stale.
CREATE OR REPLACE FUNCTION public.mirror_code_submission_to_contests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  already_solved boolean;
  has_live_session boolean;
BEGIN
  FOR r IN
    SELECT c.id AS contest_id
    FROM public.contests c
    JOIN public.contest_problems cp
      ON cp.contest_id = c.id AND cp.problem_slug = NEW.problem_slug
    JOIN public.contest_registrations cr
      ON cr.contest_id = c.id
     AND cr.user_id = NEW.user_id
     AND cr.status = 'registered'
    WHERE NEW.created_at >= c.starts_at
      AND NEW.created_at <= c.ends_at
      AND c.status IN ('published','live')
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.contest_sessions
       WHERE contest_id = r.contest_id
         AND user_id = NEW.user_id
         AND is_active = true
         AND last_seen_at > now() - interval '2 minutes'
    ) INTO has_live_session;

    IF NOT has_live_session THEN
      CONTINUE; -- silently skip; client surface comes from validate_contest_submission
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.contest_submissions
      WHERE contest_id = r.contest_id
        AND user_id = NEW.user_id
        AND problem_slug = NEW.problem_slug
        AND verdict = 'accepted'
    ) INTO already_solved;

    IF already_solved AND NEW.verdict = 'accepted' THEN
      CONTINUE;
    END IF;

    INSERT INTO public.contest_submissions
      (contest_id, user_id, problem_slug, submission_id, verdict, points_awarded, penalty_seconds, submitted_at)
    VALUES (
      r.contest_id,
      NEW.user_id,
      NEW.problem_slug,
      NEW.id,
      CASE WHEN NEW.verdict = 'accepted' THEN 'accepted' ELSE NEW.verdict END,
      0,
      0,
      NEW.created_at
    );
    PERFORM public.recompute_contest_leaderboard(r.contest_id);
  END LOOP;
  RETURN NEW;
END;
$$;

-- 3) Tighten validate_contest_submission to require a fresh heartbeat too.
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
     WHERE contest_id = _contest_id
       AND user_id = uid
       AND is_active = true
       AND last_seen_at > now() - interval '2 minutes'
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
