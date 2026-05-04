-- =================================================================
-- Tier 2 anti-cheat: identity verification, network audit, audio
-- =================================================================

-- 1) Identity checks: ID + selfie + Gemini face-match score
CREATE TABLE IF NOT EXISTS public.contest_identity_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  kind text NOT NULL DEFAULT 'initial', -- 'initial' | 'recheck'
  selfie_path text,
  id_document_path text,
  match_score numeric, -- 0..1, NULL = pending
  verdict text NOT NULL DEFAULT 'pending', -- 'pending' | 'verified' | 'failed'
  reasoning text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_identity_checks_session
  ON public.contest_identity_checks(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contest_identity_checks_user_contest
  ON public.contest_identity_checks(contest_id, user_id, created_at DESC);

ALTER TABLE public.contest_identity_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own identity checks"
  ON public.contest_identity_checks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own identity checks"
  ON public.contest_identity_checks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all identity checks"
  ON public.contest_identity_checks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update identity checks"
  ON public.contest_identity_checks FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- 2) Network audit: non-allowlisted outbound requests caught by interceptor
CREATE TABLE IF NOT EXISTS public.contest_network_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  host text NOT NULL,
  url text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  blocked boolean NOT NULL DEFAULT false,
  page_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_network_audit_session
  ON public.contest_network_audit(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contest_network_audit_host
  ON public.contest_network_audit(host);

ALTER TABLE public.contest_network_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own network audit"
  ON public.contest_network_audit FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own network audit"
  ON public.contest_network_audit FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all network audit"
  ON public.contest_network_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- 3) Audio events: STT transcript + multi-voice / coaching keyword flags
CREATE TABLE IF NOT EXISTS public.contest_audio_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  storage_path text,
  duration_sec numeric,
  transcript text,
  voices_detected int,
  coaching_keywords text[],
  severity text NOT NULL DEFAULT 'info', -- 'info' | 'warn' | 'flag'
  analysis jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_audio_events_session
  ON public.contest_audio_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contest_audio_events_severity
  ON public.contest_audio_events(severity, created_at DESC);

ALTER TABLE public.contest_audio_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own audio events"
  ON public.contest_audio_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own audio events"
  ON public.contest_audio_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all audio events"
  ON public.contest_audio_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update audio events"
  ON public.contest_audio_events FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- 4) Storage buckets (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contest-identity', 'contest-identity', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('contest-audio', 'contest-audio', false)
ON CONFLICT (id) DO NOTHING;


-- 5) Storage RLS: users CRUD own files (folder = userId), admins read all
-- Path convention: <user_id>/<contest_id>/<session_id>/<timestamp>.{jpg,webm}

CREATE POLICY "Users upload own identity files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contest-identity' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own identity files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contest-identity' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins read all identity files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contest-identity' AND public.has_role(auth.uid(), 'admin'));


CREATE POLICY "Users upload own audio files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contest-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own audio files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contest-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins read all audio files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contest-audio' AND public.has_role(auth.uid(), 'admin'));