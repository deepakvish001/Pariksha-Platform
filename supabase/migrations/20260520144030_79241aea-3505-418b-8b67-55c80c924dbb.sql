CREATE POLICY "admins read all attempt events"
ON public.attempt_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));