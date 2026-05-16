-- 1. Configurable proctoring per assessment
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS proctoring_config jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Device / IP / extra-signal columns on attempts
ALTER TABLE public.assessment_attempts
  ADD COLUMN IF NOT EXISTS device_fingerprint text,
  ADD COLUMN IF NOT EXISTS device_ip inet,
  ADD COLUMN IF NOT EXISTS screen_extended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sideeye_required boolean NOT NULL DEFAULT false;

-- 3. Snapshots table (webcam | screen | sideeye)
CREATE TABLE IF NOT EXISTS public.assessment_proctor_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('webcam','screen','sideeye')),
  storage_path text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  reviewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aps_attempt ON public.assessment_proctor_snapshots(attempt_id);
CREATE INDEX IF NOT EXISTS idx_aps_unreviewed ON public.assessment_proctor_snapshots(reviewed) WHERE reviewed = false;
ALTER TABLE public.assessment_proctor_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student writes own snapshots"
  ON public.assessment_proctor_snapshots FOR INSERT
  WITH CHECK (public.attempt_owner(attempt_id) = auth.uid());

CREATE POLICY "student reads own snapshots"
  ON public.assessment_proctor_snapshots FOR SELECT
  USING (public.attempt_owner(attempt_id) = auth.uid());

CREATE POLICY "org members read snapshots"
  ON public.assessment_proctor_snapshots FOR SELECT
  USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));

-- 4. Findings table (AI review output)
CREATE TABLE IF NOT EXISTS public.assessment_proctor_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.assessment_proctor_snapshots(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','low','medium','high','critical')),
  finding jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_apf_attempt ON public.assessment_proctor_findings(attempt_id);
CREATE INDEX IF NOT EXISTS idx_apf_snapshot ON public.assessment_proctor_findings(snapshot_id);
ALTER TABLE public.assessment_proctor_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read findings"
  ON public.assessment_proctor_findings FOR SELECT
  USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));

-- 5. Side-camera pairing for assessments
CREATE TABLE IF NOT EXISTS public.assessment_side_camera_pairings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  pair_code text NOT NULL UNIQUE,
  pair_token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paired','disconnected','expired')),
  paired_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ascp_attempt ON public.assessment_side_camera_pairings(attempt_id);
ALTER TABLE public.assessment_side_camera_pairings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student manages own sideeye pairings"
  ON public.assessment_side_camera_pairings FOR ALL
  USING (public.attempt_owner(attempt_id) = auth.uid())
  WITH CHECK (public.attempt_owner(attempt_id) = auth.uid());

CREATE POLICY "org members read sideeye pairings"
  ON public.assessment_side_camera_pairings FOR SELECT
  USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));

-- 6. Side-camera frames for assessments
CREATE TABLE IF NOT EXISTS public.assessment_side_camera_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id uuid NOT NULL REFERENCES public.assessment_side_camera_pairings(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ascf_attempt ON public.assessment_side_camera_frames(attempt_id);
CREATE INDEX IF NOT EXISTS idx_ascf_pairing ON public.assessment_side_camera_frames(pairing_id);
ALTER TABLE public.assessment_side_camera_frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student writes own sideeye frames"
  ON public.assessment_side_camera_frames FOR INSERT
  WITH CHECK (public.attempt_owner(attempt_id) = auth.uid());

CREATE POLICY "student reads own sideeye frames"
  ON public.assessment_side_camera_frames FOR SELECT
  USING (public.attempt_owner(attempt_id) = auth.uid());

CREATE POLICY "org members read sideeye frames"
  ON public.assessment_side_camera_frames FOR SELECT
  USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));

-- 7. Updated-at trigger for pairings
CREATE TRIGGER trg_ascp_updated_at
  BEFORE UPDATE ON public.assessment_side_camera_pairings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Storage policies on existing assessment-proctor bucket
DROP POLICY IF EXISTS "ap_owner_upload" ON storage.objects;
DROP POLICY IF EXISTS "ap_owner_read" ON storage.objects;
DROP POLICY IF EXISTS "ap_org_read" ON storage.objects;

CREATE POLICY "ap_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assessment-proctor'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ap_owner_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assessment-proctor'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ap_org_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assessment-proctor'
    AND EXISTS (
      SELECT 1
      FROM public.assessment_proctor_snapshots s
      WHERE s.storage_path = storage.objects.name
        AND public.is_org_member(public.attempt_assessment_org(s.attempt_id))
    )
  );