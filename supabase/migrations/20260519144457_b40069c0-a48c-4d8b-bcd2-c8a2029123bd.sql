ALTER TABLE public.org_student_invites
  ADD COLUMN IF NOT EXISTS last_send_error text,
  ADD COLUMN IF NOT EXISTS last_send_attempt_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_org_student_invites_failed
  ON public.org_student_invites (org_id)
  WHERE last_send_error IS NOT NULL AND accepted_at IS NULL AND revoked = false;