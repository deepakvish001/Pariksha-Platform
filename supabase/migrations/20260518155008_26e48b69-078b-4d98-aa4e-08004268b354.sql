-- Status history for question bank items
CREATE TABLE public.question_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published')),
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);

CREATE INDEX idx_qsh_question ON public.question_status_history(question_id, changed_at DESC);

ALTER TABLE public.question_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read question status history"
ON public.question_status_history FOR SELECT
USING (is_org_member(org_id));

CREATE POLICY "writers insert question status history"
ON public.question_status_history FOR INSERT
WITH CHECK (can_write_org(org_id));

-- Trigger: log status changes from questions.meta.status
CREATE OR REPLACE FUNCTION public.log_question_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_status TEXT;
  old_status TEXT;
BEGIN
  new_status := COALESCE(NEW.meta->>'status', 'draft');
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.question_status_history(question_id, org_id, status, changed_by)
    VALUES (NEW.id, NEW.org_id, new_status, auth.uid());
    RETURN NEW;
  END IF;
  old_status := COALESCE(OLD.meta->>'status', 'draft');
  IF new_status IS DISTINCT FROM old_status THEN
    INSERT INTO public.question_status_history(question_id, org_id, status, changed_by)
    VALUES (NEW.id, NEW.org_id, new_status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_questions_status_history ON public.questions;
CREATE TRIGGER trg_questions_status_history
AFTER INSERT OR UPDATE OF meta ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.log_question_status_change();

-- Backfill: one row per existing question reflecting its current status
INSERT INTO public.question_status_history (question_id, org_id, status, changed_by, changed_at, note)
SELECT q.id, q.org_id, COALESCE(q.meta->>'status','draft'), q.created_by, q.updated_at, 'backfilled'
FROM public.questions q
WHERE NOT EXISTS (
  SELECT 1 FROM public.question_status_history h WHERE h.question_id = q.id
);