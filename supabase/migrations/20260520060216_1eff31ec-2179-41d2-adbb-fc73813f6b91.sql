
-- Notify experience author on new report
CREATE OR REPLACE FUNCTION public.notify_experience_author_on_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author uuid;
  v_company text;
  v_role text;
BEGIN
  SELECT user_id, company_name, role
    INTO v_author, v_company, v_role
  FROM public.interview_experiences
  WHERE id = NEW.experience_id;

  IF v_author IS NULL OR v_author = NEW.reporter_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    v_author,
    'experience_reported',
    'Your experience was reported',
    'A community member flagged your ' || COALESCE(v_company, 'interview') || ' (' || COALESCE(v_role, '') || ') experience. Moderators will review it shortly.',
    jsonb_build_object(
      'experience_id', NEW.experience_id,
      'report_id', NEW.id,
      'reason', NEW.reason,
      'url', '/experiences/' || NEW.experience_id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_author_on_report ON public.experience_reports;
CREATE TRIGGER trg_notify_author_on_report
AFTER INSERT ON public.experience_reports
FOR EACH ROW EXECUTE FUNCTION public.notify_experience_author_on_report();

-- Notify author when report resolved/dismissed
CREATE OR REPLACE FUNCTION public.notify_experience_author_on_report_resolved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author uuid;
  v_company text;
  v_role text;
  v_exp_status text;
  v_title text;
  v_message text;
BEGIN
  IF NEW.status = OLD.status OR NEW.status NOT IN ('resolved','dismissed') THEN
    RETURN NEW;
  END IF;

  SELECT user_id, company_name, role, status
    INTO v_author, v_company, v_role, v_exp_status
  FROM public.interview_experiences
  WHERE id = NEW.experience_id;

  IF v_author IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'dismissed' THEN
    v_title := 'Report dismissed — your experience is safe';
    v_message := 'Good news: a report on your ' || COALESCE(v_company,'interview') || ' experience was reviewed and dismissed. No action needed.';
  ELSIF v_exp_status = 'rejected' THEN
    v_title := 'Your experience was removed after review';
    v_message := 'Moderators removed your ' || COALESCE(v_company,'interview') || ' (' || COALESCE(v_role,'') || ') experience following a community report.';
  ELSE
    v_title := 'Report on your experience was resolved';
    v_message := 'A report on your ' || COALESCE(v_company,'interview') || ' experience has been resolved by our moderators.';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    v_author,
    'experience_report_resolved',
    v_title,
    v_message,
    jsonb_build_object(
      'experience_id', NEW.experience_id,
      'report_id', NEW.id,
      'status', NEW.status,
      'experience_status', v_exp_status,
      'url', '/experiences/' || NEW.experience_id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_author_on_report_resolved ON public.experience_reports;
CREATE TRIGGER trg_notify_author_on_report_resolved
AFTER UPDATE ON public.experience_reports
FOR EACH ROW EXECUTE FUNCTION public.notify_experience_author_on_report_resolved();
