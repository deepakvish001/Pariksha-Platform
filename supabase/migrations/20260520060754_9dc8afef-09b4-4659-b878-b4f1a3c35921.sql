
CREATE POLICY "Authors can resubmit rejected experiences"
ON public.interview_experiences
FOR UPDATE
USING (auth.uid() = user_id AND status = 'rejected'::experience_status)
WITH CHECK (auth.uid() = user_id AND status = 'pending'::experience_status);
