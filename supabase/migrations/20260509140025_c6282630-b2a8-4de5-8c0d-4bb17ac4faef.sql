
-- Helper: does the current user own the org?
CREATE OR REPLACE FUNCTION public.b2b_user_owns_org(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _org_id AND owner_id = auth.uid()
  );
$$;

-- Server-issued, expiring invite tokens for B2B onboarding
CREATE TABLE IF NOT EXISTS public.b2b_org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_org_invites_org ON public.b2b_org_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_b2b_org_invites_email ON public.b2b_org_invites(email);

ALTER TABLE public.b2b_org_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owner can view invites"
  ON public.b2b_org_invites FOR SELECT
  USING (auth.uid() = inviter_id OR public.b2b_user_owns_org(org_id));

CREATE POLICY "Org owner can insert invites"
  ON public.b2b_org_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id AND public.b2b_user_owns_org(org_id));

CREATE POLICY "Org owner can revoke invites"
  ON public.b2b_org_invites FOR UPDATE
  USING (public.b2b_user_owns_org(org_id));

-- Onboarding analytics events
CREATE TABLE IF NOT EXISTS public.b2b_onboarding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  event text NOT NULL,
  step int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_onb_events_user ON public.b2b_onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_onb_events_event ON public.b2b_onboarding_events(event);

ALTER TABLE public.b2b_onboarding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own onboarding events"
  ON public.b2b_onboarding_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own onboarding events"
  ON public.b2b_onboarding_events FOR SELECT
  USING (auth.uid() = user_id);
