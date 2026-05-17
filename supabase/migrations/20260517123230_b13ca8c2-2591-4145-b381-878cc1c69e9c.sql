-- Recordings table
CREATE TABLE IF NOT EXISTS public.assessment_proctor_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('webcam','screen','sideeye')),
  storage_path text NOT NULL,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_ms integer,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_apr_attempt ON public.assessment_proctor_recordings(attempt_id, started_at DESC);

ALTER TABLE public.assessment_proctor_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read recordings"
  ON public.assessment_proctor_recordings FOR SELECT
  USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));

CREATE POLICY "org members insert recordings"
  ON public.assessment_proctor_recordings FOR INSERT
  WITH CHECK (
    public.is_org_member(public.attempt_assessment_org(attempt_id))
    AND recorded_by = auth.uid()
  );

CREATE POLICY "recorder updates own recording"
  ON public.assessment_proctor_recordings FOR UPDATE
  USING (recorded_by = auth.uid())
  WITH CHECK (recorded_by = auth.uid());

CREATE POLICY "recorder deletes own recording"
  ON public.assessment_proctor_recordings FOR DELETE
  USING (recorded_by = auth.uid());

-- Storage policy: allow org proctors to upload recordings under
--   {attempt_id}/recordings/...
DROP POLICY IF EXISTS "ap_org_upload_recordings" ON storage.objects;
CREATE POLICY "ap_org_upload_recordings"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assessment-proctor'
    AND (storage.foldername(name))[2] = 'recordings'
    AND EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id::text = (storage.foldername(name))[1]
        AND public.is_org_member(public.assessment_org(a.assessment_id))
    )
  );