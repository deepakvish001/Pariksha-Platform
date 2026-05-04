
CREATE TABLE IF NOT EXISTS public.contest_side_camera_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL, -- pair_created | paired | heartbeat | heartbeat_lost | frame_analyzed | recording_uploaded | stream_lost | stream_recovered | report_generated
  severity text NOT NULL DEFAULT 'info',
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sec_audit_session ON public.contest_side_camera_audit_logs(session_id, created_at DESC);

ALTER TABLE public.contest_side_camera_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner read sec audit" ON public.contest_side_camera_audit_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin read sec audit" ON public.contest_side_camera_audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
