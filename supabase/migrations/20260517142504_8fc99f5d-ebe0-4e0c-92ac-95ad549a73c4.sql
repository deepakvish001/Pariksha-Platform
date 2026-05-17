CREATE TABLE IF NOT EXISTS public.assessment_proctor_session_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('webcam','screen','sideeye')),
  seq integer NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  duration_ms integer NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  mime text NOT NULL DEFAULT 'video/webm',
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, kind, session_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_apsc_attempt_kind_time
  ON public.assessment_proctor_session_chunks (attempt_id, kind, started_at);
CREATE INDEX IF NOT EXISTS idx_apsc_created
  ON public.assessment_proctor_session_chunks (created_at);

ALTER TABLE public.assessment_proctor_session_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student writes own session chunks"
  ON public.assessment_proctor_session_chunks FOR INSERT
  WITH CHECK (public.attempt_owner(attempt_id) = auth.uid());

CREATE POLICY "student reads own session chunks"
  ON public.assessment_proctor_session_chunks FOR SELECT
  USING (public.attempt_owner(attempt_id) = auth.uid());

CREATE POLICY "org members read session chunks"
  ON public.assessment_proctor_session_chunks FOR SELECT
  USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));