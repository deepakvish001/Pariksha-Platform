
CREATE TABLE public.attempt_event_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.attempt_events(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL,
  author_id uuid NOT NULL,
  author_name text,
  body text NOT NULL CHECK (length(btrim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempt_event_notes_event ON public.attempt_event_notes(event_id, created_at);
CREATE INDEX idx_attempt_event_notes_attempt ON public.attempt_event_notes(attempt_id, created_at);

ALTER TABLE public.attempt_event_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read event notes"
ON public.attempt_event_notes
FOR SELECT
USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));

CREATE POLICY "org members add event notes"
ON public.attempt_event_notes
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND public.is_org_member(public.attempt_assessment_org(attempt_id))
);

CREATE POLICY "authors update own event notes"
ON public.attempt_event_notes
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "authors delete own event notes"
ON public.attempt_event_notes
FOR DELETE
USING (auth.uid() = author_id);

CREATE TRIGGER trg_attempt_event_notes_updated_at
BEFORE UPDATE ON public.attempt_event_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.attempt_event_notes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attempt_event_notes;
