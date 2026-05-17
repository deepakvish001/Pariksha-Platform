CREATE TABLE public.attempt_event_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.attempt_events(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL,
  pinned_by uuid NOT NULL,
  pinned_by_name text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id)
);

CREATE INDEX idx_attempt_event_pins_attempt ON public.attempt_event_pins(attempt_id, created_at DESC);

ALTER TABLE public.attempt_event_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read event pins"
ON public.attempt_event_pins
FOR SELECT
USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));

CREATE POLICY "org members add event pins"
ON public.attempt_event_pins
FOR INSERT
WITH CHECK (
  auth.uid() = pinned_by
  AND public.is_org_member(public.attempt_assessment_org(attempt_id))
);

CREATE POLICY "pinners remove own pins"
ON public.attempt_event_pins
FOR DELETE
USING (auth.uid() = pinned_by);

ALTER TABLE public.attempt_event_pins REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attempt_event_pins;