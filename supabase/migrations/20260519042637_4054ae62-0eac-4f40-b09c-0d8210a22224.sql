
-- Per-member capability overrides (custom checkboxes per teacher)
CREATE TABLE IF NOT EXISTS public.org_member_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.org_members(id) ON DELETE CASCADE,
  capability text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, capability)
);
CREATE INDEX IF NOT EXISTS idx_omc_org ON public.org_member_capabilities(org_id);
CREATE INDEX IF NOT EXISTS idx_omc_member ON public.org_member_capabilities(member_id);

ALTER TABLE public.org_member_capabilities ENABLE ROW LEVEL SECURITY;

-- Security-definer helper that returns caller's role in an org (avoids RLS recursion).
CREATE OR REPLACE FUNCTION public.b2b_my_role(_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.org_members
   WHERE org_id = _org_id AND user_id = auth.uid()
   LIMIT 1;
$$;

CREATE POLICY "org members can view capabilities in their org"
ON public.org_member_capabilities FOR SELECT
USING (public.b2b_my_role(org_id) IS NOT NULL);

CREATE POLICY "owners and admins can manage capabilities"
ON public.org_member_capabilities FOR ALL
USING (public.b2b_my_role(org_id) IN ('owner','admin'))
WITH CHECK (public.b2b_my_role(org_id) IN ('owner','admin'));

-- Extend b2b_org_invites with capability + acceptance metadata
ALTER TABLE public.b2b_org_invites
  ADD COLUMN IF NOT EXISTS capabilities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS role_preset text NOT NULL DEFAULT 'viewer',
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by uuid;

CREATE INDEX IF NOT EXISTS idx_b2b_org_invites_org ON public.b2b_org_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_b2b_org_invites_token ON public.b2b_org_invites(token);

ALTER TABLE public.b2b_org_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members can view invites" ON public.b2b_org_invites;
CREATE POLICY "org members can view invites"
ON public.b2b_org_invites FOR SELECT
USING (public.b2b_my_role(org_id) IN ('owner','admin'));

DROP POLICY IF EXISTS "admins can manage invites" ON public.b2b_org_invites;
CREATE POLICY "admins can manage invites"
ON public.b2b_org_invites FOR ALL
USING (public.b2b_my_role(org_id) IN ('owner','admin'))
WITH CHECK (public.b2b_my_role(org_id) IN ('owner','admin'));

-- Create an invite. Owners/admins only. Returns the invite row.
CREATE OR REPLACE FUNCTION public.create_b2b_org_invite(
  _org_id uuid,
  _email text,
  _capabilities text[],
  _role_preset text DEFAULT 'viewer'
) RETURNS public.b2b_org_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_token text;
  v_row public.b2b_org_invites;
  v_email text := lower(trim(_email));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  v_role := public.b2b_my_role(_org_id);
  IF v_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF v_email IS NULL OR v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  v_token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.b2b_org_invites
    (org_id, inviter_id, email, token, expires_at, revoked, capabilities, role_preset)
  VALUES
    (_org_id, auth.uid(), v_email, v_token, now() + interval '7 days', false,
     COALESCE(_capabilities, '{}'::text[]), COALESCE(_role_preset, 'viewer'))
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_b2b_org_invite(uuid, text, text[], text) TO authenticated;

-- Accept an invite. Caller must be signed in with the invited email.
CREATE OR REPLACE FUNCTION public.accept_b2b_org_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.b2b_org_invites;
  v_member_id uuid;
  v_user_email text;
  v_role public.app_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'no_email_on_account';
  END IF;

  SELECT * INTO v_invite FROM public.b2b_org_invites WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF v_invite.revoked THEN RAISE EXCEPTION 'invite_revoked'; END IF;
  IF v_invite.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'invite_already_used'; END IF;
  IF v_invite.expires_at < now() THEN RAISE EXCEPTION 'invite_expired'; END IF;
  IF lower(v_user_email) <> lower(v_invite.email) THEN
    RAISE EXCEPTION 'email_mismatch';
  END IF;

  -- Map role_preset to app_role (default viewer)
  BEGIN
    v_role := COALESCE(v_invite.role_preset, 'viewer')::public.app_role;
  EXCEPTION WHEN others THEN
    v_role := 'viewer'::public.app_role;
  END;

  -- Upsert membership
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (v_invite.org_id, auth.uid(), v_role)
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING id INTO v_member_id;

  -- Replace capability rows with invite-specified set
  DELETE FROM public.org_member_capabilities WHERE member_id = v_member_id;
  IF v_invite.capabilities IS NOT NULL AND array_length(v_invite.capabilities, 1) > 0 THEN
    INSERT INTO public.org_member_capabilities (org_id, member_id, capability)
    SELECT v_invite.org_id, v_member_id, unnest(v_invite.capabilities);
  END IF;

  UPDATE public.b2b_org_invites
     SET accepted_at = now(), accepted_by = auth.uid()
   WHERE id = v_invite.id;

  RETURN v_invite.org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_b2b_org_invite(text) TO authenticated;

-- Replace a member's capability set atomically (owners/admins only).
CREATE OR REPLACE FUNCTION public.set_member_capabilities(
  _member_id uuid,
  _capabilities text[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT org_id INTO v_org FROM public.org_members WHERE id = _member_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'member_not_found'; END IF;
  v_role := public.b2b_my_role(v_org);
  IF v_role NOT IN ('owner','admin') THEN RAISE EXCEPTION 'forbidden'; END IF;

  DELETE FROM public.org_member_capabilities WHERE member_id = _member_id;
  IF _capabilities IS NOT NULL AND array_length(_capabilities, 1) > 0 THEN
    INSERT INTO public.org_member_capabilities (org_id, member_id, capability)
    SELECT v_org, _member_id, unnest(_capabilities);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_member_capabilities(uuid, text[]) TO authenticated;

-- Ensure org_members has a unique constraint we rely on for ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'org_members_org_user_unique'
  ) THEN
    BEGIN
      ALTER TABLE public.org_members
        ADD CONSTRAINT org_members_org_user_unique UNIQUE (org_id, user_id);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;
