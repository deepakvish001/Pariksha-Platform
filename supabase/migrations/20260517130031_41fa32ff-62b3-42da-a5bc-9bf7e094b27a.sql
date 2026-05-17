
ALTER TABLE public.assessment_attempts
  ADD COLUMN IF NOT EXISTS candidate_details jsonb,
  ADD COLUMN IF NOT EXISTS id_photo_url text,
  ADD COLUMN IF NOT EXISTS selfie_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('attempt-identity', 'attempt-identity', false)
ON CONFLICT (id) DO NOTHING;

-- Candidates upload/read their own identity files under {user_id}/...
CREATE POLICY "candidate reads own identity files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attempt-identity'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "candidate uploads own identity files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attempt-identity'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "candidate updates own identity files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attempt-identity'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
