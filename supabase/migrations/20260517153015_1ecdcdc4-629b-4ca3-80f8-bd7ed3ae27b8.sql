
ALTER TABLE public.assessment_invites
  ADD COLUMN IF NOT EXISTS scheduled_send_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS auto_reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reminder_after_days integer NOT NULL DEFAULT 3;

CREATE INDEX IF NOT EXISTS idx_invites_scheduled_send_at
  ON public.assessment_invites (scheduled_send_at)
  WHERE scheduled_send_at IS NOT NULL AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invites_pending_reminder
  ON public.assessment_invites (assessment_id, status, last_sent_at);
