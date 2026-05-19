-- New enums
DO $$ BEGIN
  CREATE TYPE public.assessment_type AS ENUM ('placement_mock','academic','benchmark','contest');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.participation_mode AS ENUM ('invite','roster','open_org');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.proctoring_level AS ENUM ('off','light','standard','strict');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add columns to assessments
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS type public.assessment_type NOT NULL DEFAULT 'placement_mock',
  ADD COLUMN IF NOT EXISTS participation_mode public.participation_mode NOT NULL DEFAULT 'invite',
  ADD COLUMN IF NOT EXISTS proctoring_level public.proctoring_level NOT NULL DEFAULT 'off';

-- Backfill proctoring_level from legacy boolean
UPDATE public.assessments
   SET proctoring_level = CASE WHEN proctoring_enabled THEN 'standard'::public.proctoring_level
                               ELSE 'off'::public.proctoring_level END
 WHERE proctoring_level = 'off' AND proctoring_enabled = true;

CREATE INDEX IF NOT EXISTS idx_assessments_org_type
  ON public.assessments(org_id, type);

-- Self-enroll RPC for open_org assessments
CREATE OR REPLACE FUNCTION public.claim_open_org_assessment(_assessment_id uuid)
RETURNS TABLE(token text, invite_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assessment public.assessments%ROWTYPE;
  v_email text;
  v_name text;
  v_invite public.assessment_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  SELECT * INTO v_assessment FROM public.assessments WHERE id = _assessment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'assessment not found';
  END IF;

  IF v_assessment.participation_mode <> 'open_org' THEN
    RAISE EXCEPTION 'assessment is not open enrollment';
  END IF;

  IF v_assessment.status <> 'published' THEN
    RAISE EXCEPTION 'assessment is not published';
  END IF;

  IF v_assessment.starts_at IS NOT NULL AND v_assessment.starts_at > now() THEN
    RAISE EXCEPTION 'assessment has not started';
  END IF;
  IF v_assessment.ends_at IS NOT NULL AND v_assessment.ends_at < now() THEN
    RAISE EXCEPTION 'assessment has ended';
  END IF;

  IF NOT public.is_org_member(v_assessment.org_id) THEN
    RAISE EXCEPTION 'not a member of this organization';
  END IF;

  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
    INTO v_email, v_name
    FROM auth.users WHERE id = auth.uid();

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'no email on account';
  END IF;

  -- Reuse existing invite if any, else create one
  SELECT * INTO v_invite
    FROM public.assessment_invites
   WHERE assessment_id = _assessment_id AND email = v_email
   LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.assessment_invites (assessment_id, email, name, source, created_by)
    VALUES (_assessment_id, v_email, v_name, 'manual', auth.uid())
    RETURNING * INTO v_invite;
  END IF;

  token := v_invite.token;
  invite_id := v_invite.id;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_open_org_assessment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_open_org_assessment(uuid) TO authenticated;