CREATE TABLE IF NOT EXISTS public.b2b_org_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS b2b_org_audit_org_created_idx
  ON public.b2b_org_audit (org_id, created_at DESC);

ALTER TABLE public.b2b_org_audit ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an owner or admin of this org?
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid)
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
      AND role IN ('owner','admin')
  ) OR EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _org_id AND owner_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Org admins can read audit log" ON public.b2b_org_audit;
CREATE POLICY "Org admins can read audit log"
ON public.b2b_org_audit
FOR SELECT
TO authenticated
USING (public.is_org_admin(org_id));

-- No INSERT/UPDATE/DELETE policies — writes go exclusively through the RPC below.

CREATE OR REPLACE FUNCTION public.log_org_audit(
  _org_id uuid,
  _action text,
  _target text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.is_org_admin(_org_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.b2b_org_audit (org_id, actor_id, action, target, metadata)
  VALUES (_org_id, auth.uid(), _action, _target, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_org_audit(uuid, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.log_org_audit(uuid, text, text, jsonb) TO authenticated;