
ALTER TABLE public.demo_requests
  DROP CONSTRAINT IF EXISTS demo_requests_status_check;

ALTER TABLE public.demo_requests
  ADD CONSTRAINT demo_requests_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'closed'));

DROP POLICY IF EXISTS "Admins can update demo requests" ON public.demo_requests;
CREATE POLICY "Admins can update demo requests"
ON public.demo_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
