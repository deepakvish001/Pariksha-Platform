
-- 1. Evidence chain (append-only, SHA-256 linked)
CREATE TABLE IF NOT EXISTS public.sideeye_evidence_chain (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  seq bigint NOT NULL,
  kind text NOT NULL CHECK (kind IN ('recording','frame','event')),
  storage_path text,
  sha256 text NOT NULL,
  prev_hash text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_sideeye_chain_session ON public.sideeye_evidence_chain(session_id, seq);
CREATE INDEX IF NOT EXISTS idx_sideeye_chain_user ON public.sideeye_evidence_chain(user_id, created_at DESC);

ALTER TABLE public.sideeye_evidence_chain ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read evidence chain"
  ON public.sideeye_evidence_chain FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Candidates read their own evidence chain"
  ON public.sideeye_evidence_chain FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts only via service-role (edge functions). No user-level INSERT policy.

-- 2. Pause/resume log
CREATE TABLE IF NOT EXISTS public.sideeye_session_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  paused_by uuid NOT NULL,
  paused_at timestamptz NOT NULL DEFAULT now(),
  resumed_at timestamptz,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sideeye_pauses_session ON public.sideeye_session_pauses(session_id, paused_at DESC);

ALTER TABLE public.sideeye_session_pauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pauses"
  ON public.sideeye_session_pauses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Reviewer columns on audit logs
ALTER TABLE public.contest_side_camera_audit_logs
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewer_id uuid,
  ADD COLUMN IF NOT EXISTS reviewer_note text;

-- Realtime for live anomaly ticker
ALTER PUBLICATION supabase_realtime ADD TABLE public.sideeye_evidence_chain;
