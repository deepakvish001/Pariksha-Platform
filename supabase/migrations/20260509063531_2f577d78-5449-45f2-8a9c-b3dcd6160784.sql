-- 1. Extend organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending','approved','suspended')),
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Existing orgs are auto-approved
UPDATE public.organizations SET approved_at = COALESCE(approved_at, created_at) WHERE status = 'approved';

-- Unique slug per org type (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_organizations_type_slug
  ON public.organizations (type, lower(slug));

-- 2. profiles.suspended_at
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- 3. admin_actions audit log
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_actor ON public.admin_actions (actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON public.admin_actions (target_type, target_id);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read admin_actions"
ON public.admin_actions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert admin_actions"
ON public.admin_actions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') AND actor_id = auth.uid());

-- 4. Admin policies on organizations (additive)
DROP POLICY IF EXISTS "Admins read all organizations" ON public.organizations;
CREATE POLICY "Admins read all organizations"
ON public.organizations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update all organizations" ON public.organizations;
CREATE POLICY "Admins update all organizations"
ON public.organizations FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Admin policies on profiles (suspend/unsuspend)
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));