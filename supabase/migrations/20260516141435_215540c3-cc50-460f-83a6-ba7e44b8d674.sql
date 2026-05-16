DROP POLICY IF EXISTS "candidate reads own invite" ON public.assessment_invites;

CREATE POLICY "candidate reads own invite"
ON public.assessment_invites
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND lower(email) = lower(COALESCE((auth.jwt() ->> 'email')::text, ''))
);