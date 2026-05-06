
-- 1. Calibration baselines
CREATE TABLE IF NOT EXISTS public.sideeye_calibration_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  baseline jsonb NOT NULL DEFAULT '{}'::jsonb,
  face_count_avg numeric,
  lighting_profile jsonb,
  room_fingerprint text,
  sample_count integer NOT NULL DEFAULT 0,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_sideeye_calibration_user ON public.sideeye_calibration_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_sideeye_calibration_contest ON public.sideeye_calibration_baselines(contest_id);

ALTER TABLE public.sideeye_calibration_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates manage their own baseline"
ON public.sideeye_calibration_baselines
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read baselines"
ON public.sideeye_calibration_baselines
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Confidence column on findings
ALTER TABLE public.contest_proctor_findings
  ADD COLUMN IF NOT EXISTS confidence text
    CHECK (confidence IN ('low','medium','high'))
    DEFAULT 'medium';

CREATE INDEX IF NOT EXISTS idx_findings_confidence ON public.contest_proctor_findings(confidence);

-- 3. Adaptive sampling / runtime flags per contest
CREATE TABLE IF NOT EXISTS public.sideeye_runtime_flags (
  contest_id uuid PRIMARY KEY,
  frame_interval_ms integer NOT NULL DEFAULT 15000,
  queue_depth integer NOT NULL DEFAULT 0,
  high_load boolean NOT NULL DEFAULT false,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sideeye_runtime_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read runtime flags"
ON public.sideeye_runtime_flags
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage runtime flags"
ON public.sideeye_runtime_flags
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Helpful indexes for DLQ / idempotency
CREATE INDEX IF NOT EXISTS idx_sideeye_dlq_pending
  ON public.sideeye_failed_analyses(next_retry_at)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sideeye_idempotency_created
  ON public.sideeye_idempotency(created_at);
