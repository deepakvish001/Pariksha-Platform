-- Tighten org_members UPDATE: only the owner can change the owner row
-- or promote anyone to 'owner'. Admins keep their existing rights for
-- non-owner rows and non-owner target roles.
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.org_members;

CREATE POLICY "Owners and admins can update members"
ON public.org_members
FOR UPDATE
USING (
  -- Caller must be an owner or admin of this org
  public.is_org_member(org_id, ARRAY['owner'::public.org_member_role, 'admin'::public.org_member_role])
  -- And cannot touch the owner row unless they themselves are the owner
  AND (
    role <> 'owner'::public.org_member_role
    OR public.is_org_member(org_id, ARRAY['owner'::public.org_member_role])
  )
)
WITH CHECK (
  public.is_org_member(org_id, ARRAY['owner'::public.org_member_role, 'admin'::public.org_member_role])
  -- Only the owner may promote someone to 'owner'
  AND (
    role <> 'owner'::public.org_member_role
    OR public.is_org_member(org_id, ARRAY['owner'::public.org_member_role])
  )
);

-- Helper: only the owner can manage billing
CREATE OR REPLACE FUNCTION public.is_org_billing_admin(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = _org_id
      AND user_id = auth.uid()
      AND role = 'owner'::public.org_member_role
  );
$$;