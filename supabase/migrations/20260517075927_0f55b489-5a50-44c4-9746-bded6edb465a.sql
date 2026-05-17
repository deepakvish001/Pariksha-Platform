-- Enum for delivery status of the SOS alert itself
DO $$ BEGIN
  CREATE TYPE public.sos_delivery_status AS ENUM ('queued', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.assessment_sos_events
  ADD COLUMN IF NOT EXISTS delivery_status public.sos_delivery_status NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS delivery_error text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS client_attempted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_sos_delivery_status
  ON public.assessment_sos_events(delivery_status);

-- Allow candidates to UPDATE their own SOS row for the purpose of marking
-- delivery_status (e.g. retry after offline). Proctor-only fields (status,
-- acknowledged_*, resolved_*) are still safe because of the existing
-- "org updates sos" policy gating proctor actions.
DO $$ BEGIN
  CREATE POLICY "candidate updates own sos delivery"
    ON public.assessment_sos_events
    FOR UPDATE
    USING (attempt_owner(attempt_id) = auth.uid() AND raised_by = auth.uid())
    WITH CHECK (attempt_owner(attempt_id) = auth.uid() AND raised_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;