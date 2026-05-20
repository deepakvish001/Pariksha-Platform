
CREATE OR REPLACE FUNCTION public.notify_experience_author_on_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_message text;
  v_company text;
  v_role text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('approved','rejected') THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_company := COALESCE(NEW.company_name, 'interview');
  v_role := COALESCE(NEW.role, '');

  IF NEW.status = 'approved' THEN
    v_title := 'Your experience was approved 🎉';
    v_message := 'Your ' || v_company || ' (' || v_role || ') experience is now live for the community.';
  ELSE
    v_title := 'Your experience needs changes';
    v_message := 'Moderators rejected your ' || v_company || ' (' || v_role || ') experience. '
      || COALESCE(NULLIF(NEW.moderation_notes, ''), 'You can edit and resubmit it for review.');
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'experience_moderation',
    v_title,
    v_message,
    jsonb_build_object(
      'experience_id', NEW.id,
      'status', NEW.status,
      'moderation_notes', NEW.moderation_notes,
      'url', '/experiences/' || NEW.id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_author_on_moderation ON public.interview_experiences;
CREATE TRIGGER trg_notify_author_on_moderation
AFTER UPDATE OF status ON public.interview_experiences
FOR EACH ROW EXECUTE FUNCTION public.notify_experience_author_on_moderation();
