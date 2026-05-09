-- B2B sales leads from /pricing contact form
CREATE TABLE public.b2b_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  organization TEXT NOT NULL,
  org_type TEXT NOT NULL CHECK (org_type IN ('college','company','other')),
  team_size TEXT,
  message TEXT,
  source TEXT DEFAULT 'pricing_page',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed')),
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_b2b_leads_created_at ON public.b2b_leads (created_at DESC);
CREATE INDEX idx_b2b_leads_status ON public.b2b_leads (status);

ALTER TABLE public.b2b_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous visitors) can submit a lead from the public pricing page.
CREATE POLICY "Anyone can submit a lead"
ON public.b2b_leads
FOR INSERT
WITH CHECK (true);

-- Only platform admins can read/update/delete leads.
CREATE POLICY "Admins can view leads"
ON public.b2b_leads
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leads"
ON public.b2b_leads
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leads"
ON public.b2b_leads
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_b2b_leads_updated_at
BEFORE UPDATE ON public.b2b_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();