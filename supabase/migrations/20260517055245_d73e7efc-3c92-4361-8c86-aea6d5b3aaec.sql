
-- Helper: can the current user view proctoring evidence for an org?
CREATE OR REPLACE FUNCTION public.can_view_proctoring(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = _org_id
      AND user_id = auth.uid()
      AND role IN ('owner','admin','proctor')
  );
$$;

-- Tighten SELECT policies on proctoring evidence tables
DROP POLICY IF EXISTS "org members read findings" ON public.assessment_proctor_findings;
CREATE POLICY "proctors read findings"
  ON public.assessment_proctor_findings FOR SELECT
  USING (public.can_view_proctoring(public.attempt_assessment_org(attempt_id)));

DROP POLICY IF EXISTS "org members read snapshots" ON public.assessment_proctor_snapshots;
CREATE POLICY "proctors read snapshots"
  ON public.assessment_proctor_snapshots FOR SELECT
  USING (public.can_view_proctoring(public.attempt_assessment_org(attempt_id)));

DROP POLICY IF EXISTS "org members read sideeye frames" ON public.assessment_side_camera_frames;
CREATE POLICY "proctors read sideeye frames"
  ON public.assessment_side_camera_frames FOR SELECT
  USING (public.can_view_proctoring(public.attempt_assessment_org(attempt_id)));
