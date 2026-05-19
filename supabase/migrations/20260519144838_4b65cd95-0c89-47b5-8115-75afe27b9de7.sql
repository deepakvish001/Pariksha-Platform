CREATE TABLE IF NOT EXISTS public.org_student_invite_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NULL REFERENCES public.org_student_invites(id) ON DELETE SET NULL,
  org_id uuid NULL REFERENCES public.organizations(id) ON DELETE SET NULL,
  student_id uuid NULL,
  user_id uuid NULL,
  email text NULL,
  token_prefix text NULL,
  result text NOT NULL,
  detail text NULL,
  ip text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_student_invite_audit_invite_idx
  ON public.org_student_invite_audit (invite_id, created_at DESC);
CREATE INDEX IF NOT EXISTS org_student_invite_audit_org_idx
  ON public.org_student_invite_audit (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS org_student_invite_audit_user_idx
  ON public.org_student_invite_audit (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS org_student_invite_audit_result_idx
  ON public.org_student_invite_audit (result, created_at DESC);

ALTER TABLE public.org_student_invite_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read invite audit"
  ON public.org_student_invite_audit;
CREATE POLICY "Admins can read invite audit"
  ON public.org_student_invite_audit
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));