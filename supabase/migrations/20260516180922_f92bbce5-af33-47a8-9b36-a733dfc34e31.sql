
ALTER TABLE public.assessment_attempts
  ADD COLUMN IF NOT EXISTS violations smallint NOT NULL DEFAULT 0;

INSERT INTO storage.buckets (id, name, public)
VALUES ('assessment-proctor', 'assessment-proctor', false)
ON CONFLICT (id) DO NOTHING;

-- Candidates can upload snapshots ONLY into a folder named with their own attempt id
CREATE POLICY "candidates upload own attempt snapshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assessment-proctor'
  AND EXISTS (
    SELECT 1 FROM public.assessment_attempts a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.user_id = auth.uid()
  )
);

-- Candidates can read their own attempt snapshots
CREATE POLICY "candidates read own attempt snapshots"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'assessment-proctor'
  AND EXISTS (
    SELECT 1 FROM public.assessment_attempts a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.user_id = auth.uid()
  )
);

-- Org members of the assessment can read all snapshots for review
CREATE POLICY "org members read attempt snapshots"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'assessment-proctor'
  AND EXISTS (
    SELECT 1 FROM public.assessment_attempts a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND public.is_org_member(public.assessment_org(a.assessment_id))
  )
);
