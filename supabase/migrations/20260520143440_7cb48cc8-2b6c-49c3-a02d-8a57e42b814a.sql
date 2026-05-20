CREATE POLICY "admins read all sideeye pairings"
ON public.assessment_side_camera_pairings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));