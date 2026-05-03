
-- 1. effective_status helper (draft/active/closed)
CREATE OR REPLACE FUNCTION public.contest_effective_status(_contest_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN c.status IN ('draft','archived') THEN 'draft'
    WHEN now() < c.starts_at THEN 'active'           -- published & not started => active (registration window)
    WHEN now() BETWEEN c.starts_at AND c.ends_at AND c.status IN ('published','live') THEN 'active'
    WHEN c.status = 'ended' OR now() > c.ends_at THEN 'closed'
    ELSE 'draft'
  END
  FROM public.contests c
  WHERE c.id = _contest_id;
$$;

GRANT EXECUTE ON FUNCTION public.contest_effective_status(uuid) TO anon, authenticated;

-- 2. validate_contest_submission - called by client to surface clear errors
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
  IF reg.status = 'disqualified' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'disqualified', 'message', 'You are disqualified from this contest');
  END IF;
  IF reg.status = 'withdrawn' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'withdrawn', 'message', 'You have withdrawn from this contest');
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

-- 3. Harden the mirror trigger: skip if disqualified, skip if duplicate accepted
CREATE OR REPLACE FUNCTION public.mirror_code_submission_to_contests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  already_solved boolean;
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
    -- Skip duplicate accepted entries
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

-- 4. Status transition guard for admin updates
CREATE OR REPLACE FUNCTION public.guard_contest_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'ended' AND NEW.status IN ('draft','published','live') THEN
    RAISE EXCEPTION 'Cannot revert a closed contest back to %', NEW.status;
  END IF;
  IF OLD.status = 'archived' AND NEW.status <> 'archived' THEN
    RAISE EXCEPTION 'Cannot un-archive a contest';
  END IF;
  IF NEW.starts_at >= NEW.ends_at THEN
    RAISE EXCEPTION 'Contest start must be before end';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_contest_status ON public.contests;
CREATE TRIGGER trg_guard_contest_status
BEFORE UPDATE OF status, starts_at, ends_at ON public.contests
FOR EACH ROW EXECUTE FUNCTION public.guard_contest_status_transition();
