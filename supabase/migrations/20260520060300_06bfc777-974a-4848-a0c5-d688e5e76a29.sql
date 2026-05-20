
CREATE POLICY "Authors can view reports on their experiences"
ON public.experience_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.interview_experiences ie
    WHERE ie.id = experience_reports.experience_id
      AND ie.user_id = auth.uid()
  )
);
