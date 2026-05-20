CREATE POLICY "candidates read assessment via attempt"
ON public.assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assessment_attempts a
    WHERE a.assessment_id = assessments.id
      AND a.user_id = auth.uid()
  )
);