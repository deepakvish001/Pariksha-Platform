-- Org type enum
CREATE TYPE public.org_type AS ENUM ('college', 'company');
CREATE TYPE public.org_member_role AS ENUM ('owner', 'admin', 'recruiter', 'viewer');

-- Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.org_type NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_owner ON public.organizations(owner_id);

-- Org members
CREATE TABLE public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.org_member_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX idx_org_members_user ON public.org_members(user_id);
CREATE INDEX idx_org_members_org ON public.org_members(org_id);

-- Helper: is the current user a member of org with one of the given roles?
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID, _roles public.org_member_role[] DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE org_id = _org_id
      AND user_id = auth.uid()
      AND (_roles IS NULL OR role = ANY(_roles))
  );
$$;

-- updated_at trigger (reuses existing function)
CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create owner membership when an org is created
CREATE OR REPLACE FUNCTION public.create_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (org_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_org_owner_membership
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.create_owner_membership();

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- organizations policies
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.is_org_member(id, NULL));

CREATE POLICY "Owners and admins can update their organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (public.is_org_member(id, ARRAY['owner','admin']::public.org_member_role[]))
  WITH CHECK (public.is_org_member(id, ARRAY['owner','admin']::public.org_member_role[]));

CREATE POLICY "Owners can delete their organization"
  ON public.organizations FOR DELETE
  TO authenticated
  USING (public.is_org_member(id, ARRAY['owner']::public.org_member_role[]));

-- org_members policies
CREATE POLICY "Members can view co-members"
  ON public.org_members FOR SELECT
  TO authenticated
  USING (public.is_org_member(org_id, NULL));

CREATE POLICY "Owners and admins can add members"
  ON public.org_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(org_id, ARRAY['owner','admin']::public.org_member_role[]));

CREATE POLICY "Owners and admins can update members"
  ON public.org_members FOR UPDATE
  TO authenticated
  USING (public.is_org_member(org_id, ARRAY['owner','admin']::public.org_member_role[]))
  WITH CHECK (public.is_org_member(org_id, ARRAY['owner','admin']::public.org_member_role[]));

CREATE POLICY "Owners and admins can remove members"
  ON public.org_members FOR DELETE
  TO authenticated
  USING (public.is_org_member(org_id, ARRAY['owner','admin']::public.org_member_role[]));