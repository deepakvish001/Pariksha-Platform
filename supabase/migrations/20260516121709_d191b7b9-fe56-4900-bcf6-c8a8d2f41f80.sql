-- Server-side guarantee that every assessment_invites row has a known source.
-- The enum + NOT NULL default already prevent invalid values at the type level,
-- but this trigger gives a friendlier error and protects against future schema
-- drift (e.g. someone widening the column type).

CREATE OR REPLACE FUNCTION public.validate_assessment_invite_source()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source IS NULL THEN
    RAISE EXCEPTION 'assessment_invites.source is required'
      USING ERRCODE = '23514', HINT = 'Allowed: email, link, bulk_upload, manual, api';
  END IF;

  IF NEW.source::text NOT IN ('email', 'link', 'bulk_upload', 'manual', 'api') THEN
    RAISE EXCEPTION 'assessment_invites.source % is not an allowed value', NEW.source
      USING ERRCODE = '23514', HINT = 'Allowed: email, link, bulk_upload, manual, api';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_assessment_invite_source ON public.assessment_invites;
CREATE TRIGGER trg_validate_assessment_invite_source
  BEFORE INSERT OR UPDATE OF source ON public.assessment_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_assessment_invite_source();