
DO $$ BEGIN
  CREATE TYPE public.invite_status AS ENUM ('pending','claimed','submitted','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attempt_status AS ENUM ('in_progress','submitted','auto_submitted','abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Invites
CREATE TABLE public.assessment_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  external_id text,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status public.invite_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, email)
);
CREATE INDEX idx_invites_assessment ON public.assessment_invites(assessment_id);
CREATE INDEX idx_invites_email ON public.assessment_invites(lower(email));

ALTER TABLE public.assessment_invites ENABLE ROW LEVEL SECURITY;

-- Org members can read; writers can mutate
CREATE POLICY "org members read invites" ON public.assessment_invites
  FOR SELECT USING (public.is_org_member(public.assessment_org(assessment_id)));
CREATE POLICY "writers insert invites" ON public.assessment_invites
  FOR INSERT WITH CHECK (public.can_write_org(public.assessment_org(assessment_id)));
CREATE POLICY "writers update invites" ON public.assessment_invites
  FOR UPDATE USING (public.can_write_org(public.assessment_org(assessment_id)));
CREATE POLICY "writers delete invites" ON public.assessment_invites
  FOR DELETE USING (public.can_write_org(public.assessment_org(assessment_id)));

-- The invited candidate (matching by email) can view their invite by token (no list)
CREATE POLICY "candidate reads own invite" ON public.assessment_invites
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND lower(email) = lower((SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
  );

CREATE TRIGGER trg_invites_updated_at BEFORE UPDATE ON public.assessment_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attempts
CREATE TABLE public.assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  invite_id uuid REFERENCES public.assessment_invites(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  score numeric,
  integrity_score numeric NOT NULL DEFAULT 100,
  status public.attempt_status NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX idx_attempts_user ON public.assessment_attempts(user_id);

ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

-- Student sees own attempts
CREATE POLICY "student reads own attempts" ON public.assessment_attempts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "student updates own attempts" ON public.assessment_attempts
  FOR UPDATE USING (user_id = auth.uid());

-- Org members see attempts for their org's assessments
CREATE POLICY "org members read attempts" ON public.assessment_attempts
  FOR SELECT USING (public.is_org_member(public.assessment_org(assessment_id)));
CREATE POLICY "writers update attempts" ON public.assessment_attempts
  FOR UPDATE USING (public.can_write_org(public.assessment_org(assessment_id)));

CREATE TRIGGER trg_attempts_updated_at BEFORE UPDATE ON public.assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper to check if current user owns attempt
CREATE OR REPLACE FUNCTION public.attempt_owner(_attempt uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT user_id FROM public.assessment_attempts WHERE id = _attempt $$;

CREATE OR REPLACE FUNCTION public.attempt_assessment_org(_attempt uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT a.org_id FROM public.assessment_attempts at JOIN public.assessments a ON a.id = at.assessment_id WHERE at.id = _attempt $$;

-- Attempt answers
CREATE TABLE public.attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer jsonb NOT NULL DEFAULT '{}'::jsonb,
  auto_score numeric,
  manual_score numeric,
  run_log jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
CREATE INDEX idx_answers_attempt ON public.attempt_answers(attempt_id);

ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own answers" ON public.attempt_answers
  FOR SELECT USING (public.attempt_owner(attempt_id) = auth.uid());
CREATE POLICY "student writes own answers" ON public.attempt_answers
  FOR INSERT WITH CHECK (public.attempt_owner(attempt_id) = auth.uid());
CREATE POLICY "student updates own answers" ON public.attempt_answers
  FOR UPDATE USING (public.attempt_owner(attempt_id) = auth.uid());

CREATE POLICY "org members read answers" ON public.attempt_answers
  FOR SELECT USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));
CREATE POLICY "writers grade answers" ON public.attempt_answers
  FOR UPDATE USING (public.can_write_org(public.attempt_assessment_org(attempt_id)));

CREATE TRIGGER trg_answers_updated_at BEFORE UPDATE ON public.attempt_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attempt events (proctoring log)
CREATE TABLE public.attempt_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_attempt ON public.attempt_events(attempt_id);
ALTER TABLE public.attempt_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student writes own events" ON public.attempt_events
  FOR INSERT WITH CHECK (public.attempt_owner(attempt_id) = auth.uid());
CREATE POLICY "student reads own events" ON public.attempt_events
  FOR SELECT USING (public.attempt_owner(attempt_id) = auth.uid());
CREATE POLICY "org members read events" ON public.attempt_events
  FOR SELECT USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));

-- Atomic claim function used by the claim-invite edge function (and direct RPC).
-- Validates the token, ensures the email matches the signed-in user, and either
-- creates a fresh attempt or returns the existing in-progress one.
CREATE OR REPLACE FUNCTION public.claim_assessment_invite(_token text)
RETURNS public.assessment_attempts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text;
  v_invite public.assessment_invites%ROWTYPE;
  v_attempt public.assessment_attempts%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user;

  SELECT * INTO v_invite FROM public.assessment_invites WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'invite_expired';
  END IF;
  IF lower(v_invite.email) <> lower(v_email) THEN
    RAISE EXCEPTION 'email_mismatch';
  END IF;

  -- Reuse existing in-progress attempt if any
  SELECT * INTO v_attempt FROM public.assessment_attempts
  WHERE invite_id = v_invite.id AND user_id = v_user
  ORDER BY created_at DESC LIMIT 1;

  IF FOUND AND v_attempt.status = 'in_progress' THEN
    RETURN v_attempt;
  END IF;

  INSERT INTO public.assessment_attempts (assessment_id, invite_id, user_id)
  VALUES (v_invite.assessment_id, v_invite.id, v_user)
  RETURNING * INTO v_attempt;

  UPDATE public.assessment_invites SET status = 'claimed', updated_at = now() WHERE id = v_invite.id;

  RETURN v_attempt;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_assessment_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_assessment_invite(text) TO authenticated;
