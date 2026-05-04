-- SideEye notification settings (singleton row)
CREATE TABLE IF NOT EXISTS public.sideeye_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  min_severity text NOT NULL DEFAULT 'medium'
    CHECK (min_severity IN ('info','low','medium','high','critical')),
  escalate_kinds text[] NOT NULL DEFAULT ARRAY['secondary_device','candidate_absent']::text[],
  recipient_user_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  notify_all_admins boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sideeye_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view sideeye settings" ON public.sideeye_notification_settings;
CREATE POLICY "Admins can view sideeye settings"
  ON public.sideeye_notification_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert sideeye settings" ON public.sideeye_notification_settings;
CREATE POLICY "Admins can insert sideeye settings"
  ON public.sideeye_notification_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update sideeye settings" ON public.sideeye_notification_settings;
CREATE POLICY "Admins can update sideeye settings"
  ON public.sideeye_notification_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed singleton default row
INSERT INTO public.sideeye_notification_settings (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

-- Index for audit log search by event_type / severity / time
CREATE INDEX IF NOT EXISTS idx_sideeye_audit_session_time
  ON public.contest_side_camera_audit_logs (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sideeye_audit_event_type
  ON public.contest_side_camera_audit_logs (event_type);

CREATE INDEX IF NOT EXISTS idx_sideeye_frames_session_severity_time
  ON public.contest_side_camera_frames (session_id, severity, captured_at DESC);