
-- Add side-camera state to contest_sessions
ALTER TABLE public.contest_sessions
  ADD COLUMN IF NOT EXISTS side_camera_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS side_camera_status text NOT NULL DEFAULT 'pending';

-- Pairings table
CREATE TABLE IF NOT EXISTS public.contest_side_camera_pairings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pairing_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending | paired | active | lost | ended
  device_user_agent text,
  device_fingerprint text,
  paired_at timestamptz,
  last_heartbeat_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sec_pair_session ON public.contest_side_camera_pairings(session_id);
CREATE INDEX IF NOT EXISTS idx_sec_pair_user ON public.contest_side_camera_pairings(user_id);

-- Frames table (AI sampled stills)
CREATE TABLE IF NOT EXISTS public.contest_side_camera_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  storage_path text NOT NULL,
  ai_summary jsonb,
  severity text NOT NULL DEFAULT 'info', -- info | low | medium | high | critical
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sec_frame_session ON public.contest_side_camera_frames(session_id, captured_at DESC);

-- Recordings table (chunked phone uploads)
CREATE TABLE IF NOT EXISTS public.contest_side_camera_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  byte_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sec_rec_session ON public.contest_side_camera_recordings(session_id, started_at);

-- RLS
ALTER TABLE public.contest_side_camera_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_side_camera_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_side_camera_recordings ENABLE ROW LEVEL SECURITY;

-- Owner read
CREATE POLICY "owner read pairings" ON public.contest_side_camera_pairings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner read frames" ON public.contest_side_camera_frames
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner read recordings" ON public.contest_side_camera_recordings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Owner insert (server-side will primarily handle; allow owner to create pairings)
CREATE POLICY "owner insert pairings" ON public.contest_side_camera_pairings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner update pairings" ON public.contest_side_camera_pairings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "owner insert frames" ON public.contest_side_camera_frames
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner insert recordings" ON public.contest_side_camera_recordings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner update recordings" ON public.contest_side_camera_recordings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Admin read all
CREATE POLICY "admin read pairings" ON public.contest_side_camera_pairings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read frames" ON public.contest_side_camera_frames
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read recordings" ON public.contest_side_camera_recordings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contest-side-camera', 'contest-side-camera', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: owner-folder uploads & reads, admin reads
CREATE POLICY "side cam owner upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contest-side-camera' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "side cam owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contest-side-camera' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "side cam admin read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contest-side-camera' AND public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_side_camera_pairings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_side_camera_frames;
