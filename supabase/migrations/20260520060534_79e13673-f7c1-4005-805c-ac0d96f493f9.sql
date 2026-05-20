
-- Audit trigger: report status changes
CREATE OR REPLACE FUNCTION public.audit_experience_report_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_slug, diff)
    VALUES (
      v_actor,
      'experience_report.' || NEW.status::text,
      'experience_report',
      NEW.id::text,
      jsonb_build_object(
        'report_id', NEW.id,
        'experience_id', NEW.experience_id,
        'reason', NEW.reason,
        'from_status', OLD.status,
        'to_status', NEW.status,
        'resolution_notes', NEW.resolution_notes
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_experience_report_change ON public.experience_reports;
CREATE TRIGGER trg_audit_experience_report_change
AFTER UPDATE ON public.experience_reports
FOR EACH ROW EXECUTE FUNCTION public.audit_experience_report_change();

-- Audit trigger: experience moderation status changes
CREATE OR REPLACE FUNCTION public.audit_interview_experience_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL OR v_actor = NEW.user_id THEN
    -- Skip self-edits by the author; only log admin moderation
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.moderation_notes IS DISTINCT FROM OLD.moderation_notes THEN
    INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_slug, diff)
    VALUES (
      v_actor,
      'experience.moderation.' || NEW.status::text,
      'interview_experience',
      NEW.id::text,
      jsonb_build_object(
        'experience_id', NEW.id,
        'author_id', NEW.user_id,
        'company_name', NEW.company_name,
        'role', NEW.role,
        'from_status', OLD.status,
        'to_status', NEW.status,
        'moderation_notes', NEW.moderation_notes
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_interview_experience_moderation ON public.interview_experiences;
CREATE TRIGGER trg_audit_interview_experience_moderation
AFTER UPDATE ON public.interview_experiences
FOR EACH ROW EXECUTE FUNCTION public.audit_interview_experience_moderation();

CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON public.admin_audit_log (entity_type, entity_slug, created_at DESC);
