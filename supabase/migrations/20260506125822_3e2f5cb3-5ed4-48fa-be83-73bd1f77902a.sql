
-- INSTITUTIONS
CREATE TABLE IF NOT EXISTS public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  data_region text NOT NULL DEFAULT 'global',
  default_retention_days int NOT NULL DEFAULT 365,
  contact_email text,
  logo_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.institution_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'proctor_viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(institution_id, user_id)
);
ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_inst_members_user ON public.institution_members(user_id);
CREATE INDEX IF NOT EXISTS idx_inst_members_inst ON public.institution_members(institution_id);

CREATE OR REPLACE FUNCTION public.is_institution_member(_inst uuid, _user uuid, _min_role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE institution_id = _inst AND user_id = _user
      AND (
        _min_role = 'proctor_viewer'
        OR (_min_role = 'proctor_reviewer' AND role IN ('proctor_reviewer','proctor_admin','institution_admin'))
        OR (_min_role = 'proctor_admin'    AND role IN ('proctor_admin','institution_admin'))
        OR (_min_role = 'institution_admin' AND role = 'institution_admin')
      )
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_institution_member(uuid, uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_institution_member(uuid, uuid, public.app_role) TO authenticated;

DROP POLICY IF EXISTS "institutions readable by authenticated" ON public.institutions;
CREATE POLICY "institutions readable by authenticated" ON public.institutions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "institutions updatable by inst admins" ON public.institutions;
CREATE POLICY "institutions updatable by inst admins" ON public.institutions
  FOR UPDATE TO authenticated
  USING (public.is_institution_member(id, auth.uid(), 'institution_admin'))
  WITH CHECK (public.is_institution_member(id, auth.uid(), 'institution_admin'));

DROP POLICY IF EXISTS "institutions insertable by creator" ON public.institutions;
CREATE POLICY "institutions insertable by creator" ON public.institutions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "members visible to same institution" ON public.institution_members;
CREATE POLICY "members visible to same institution" ON public.institution_members
  FOR SELECT TO authenticated
  USING (public.is_institution_member(institution_id, auth.uid(), 'proctor_viewer'));

DROP POLICY IF EXISTS "members manageable by inst admins" ON public.institution_members;
CREATE POLICY "members manageable by inst admins" ON public.institution_members
  FOR ALL TO authenticated
  USING (public.is_institution_member(institution_id, auth.uid(), 'institution_admin'))
  WITH CHECK (public.is_institution_member(institution_id, auth.uid(), 'institution_admin'));

-- CONTESTS columns
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS retention_days int NOT NULL DEFAULT 365;
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS data_region text NOT NULL DEFAULT 'global';
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS two_person_rule boolean NOT NULL DEFAULT false;
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS calibration_required boolean NOT NULL DEFAULT false;

-- ADMIN AUDIT LOG hardening
ALTER TABLE public.admin_audit_log ADD COLUMN IF NOT EXISTS ip text;
ALTER TABLE public.admin_audit_log ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.admin_audit_log ADD COLUMN IF NOT EXISTS actor_role text;
ALTER TABLE public.admin_audit_log ADD COLUMN IF NOT EXISTS prev_hash text;
ALTER TABLE public.admin_audit_log ADD COLUMN IF NOT EXISTS row_hash text;

-- TWO-PERSON APPROVALS
CREATE TABLE IF NOT EXISTS public.sideeye_admin_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid REFERENCES public.contests(id) ON DELETE CASCADE,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  requested_by uuid NOT NULL,
  approved_by uuid,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
ALTER TABLE public.sideeye_admin_approvals ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_approvals_contest ON public.sideeye_admin_approvals(contest_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.sideeye_admin_approvals(status);

DROP POLICY IF EXISTS "approvals visible to inst proctors" ON public.sideeye_admin_approvals;
CREATE POLICY "approvals visible to inst proctors" ON public.sideeye_admin_approvals
  FOR SELECT TO authenticated
  USING (institution_id IS NOT NULL AND public.is_institution_member(institution_id, auth.uid(), 'proctor_reviewer'));

DROP POLICY IF EXISTS "approvals insertable by proctor admin" ON public.sideeye_admin_approvals;
CREATE POLICY "approvals insertable by proctor admin" ON public.sideeye_admin_approvals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by AND institution_id IS NOT NULL AND public.is_institution_member(institution_id, auth.uid(), 'proctor_admin'));

DROP POLICY IF EXISTS "approvals updatable by second admin" ON public.sideeye_admin_approvals;
CREATE POLICY "approvals updatable by second admin" ON public.sideeye_admin_approvals
  FOR UPDATE TO authenticated
  USING (
    status = 'pending'
    AND auth.uid() <> requested_by
    AND institution_id IS NOT NULL
    AND public.is_institution_member(institution_id, auth.uid(), 'proctor_admin')
  )
  WITH CHECK (
    auth.uid() <> requested_by
    AND institution_id IS NOT NULL
    AND public.is_institution_member(institution_id, auth.uid(), 'proctor_admin')
  );

-- CONSENT LEDGER
CREATE TABLE IF NOT EXISTS public.contest_sideeye_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  consent_version text NOT NULL,
  consent_text_sha256 text NOT NULL,
  ip text,
  user_agent text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contest_id, user_id, consent_version)
);
ALTER TABLE public.contest_sideeye_consents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_consents_contest_user ON public.contest_sideeye_consents(contest_id, user_id);

DROP POLICY IF EXISTS "consents readable by self" ON public.contest_sideeye_consents;
CREATE POLICY "consents readable by self" ON public.contest_sideeye_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "consents readable by inst admins" ON public.contest_sideeye_consents;
CREATE POLICY "consents readable by inst admins" ON public.contest_sideeye_consents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_id
      AND c.institution_id IS NOT NULL
      AND public.is_institution_member(c.institution_id, auth.uid(), 'proctor_reviewer')
  ));

DROP POLICY IF EXISTS "consents insertable by self" ON public.contest_sideeye_consents;
CREATE POLICY "consents insertable by self" ON public.contest_sideeye_consents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- IDEMPOTENCY (service role only)
CREATE TABLE IF NOT EXISTS public.sideeye_idempotency (
  key text PRIMARY KEY,
  function_name text NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sideeye_idempotency ENABLE ROW LEVEL SECURITY;

-- DLQ (service role only)
CREATE TABLE IF NOT EXISTS public.sideeye_failed_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid,
  contest_id uuid,
  payload jsonb NOT NULL,
  error text,
  retry_count int NOT NULL DEFAULT 0,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sideeye_failed_analyses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dlq_next_retry ON public.sideeye_failed_analyses(next_retry_at) WHERE resolved_at IS NULL;

-- SAVED VIEWS
CREATE TABLE IF NOT EXISTS public.sideeye_admin_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sideeye_admin_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "views readable by owner or shared inst" ON public.sideeye_admin_views;
CREATE POLICY "views readable by owner or shared inst" ON public.sideeye_admin_views
  FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR (is_shared AND institution_id IS NOT NULL AND public.is_institution_member(institution_id, auth.uid(), 'proctor_viewer'))
  );

DROP POLICY IF EXISTS "views manageable by owner" ON public.sideeye_admin_views;
CREATE POLICY "views manageable by owner" ON public.sideeye_admin_views
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- FP REVIEW FEEDBACK
CREATE TABLE IF NOT EXISTS public.sideeye_review_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid,
  finding_type text,
  is_false_positive boolean NOT NULL,
  note text,
  reviewer_id uuid NOT NULL,
  contest_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sideeye_review_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback insertable by reviewer" ON public.sideeye_review_feedback;
CREATE POLICY "feedback insertable by reviewer" ON public.sideeye_review_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "feedback readable by inst proctors" ON public.sideeye_review_feedback;
CREATE POLICY "feedback readable by inst proctors" ON public.sideeye_review_feedback
  FOR SELECT TO authenticated
  USING (
    auth.uid() = reviewer_id
    OR EXISTS (
      SELECT 1 FROM public.contests c
      WHERE c.id = contest_id AND c.institution_id IS NOT NULL
        AND public.is_institution_member(c.institution_id, auth.uid(), 'proctor_reviewer')
    )
  );

-- CANDIDATE REPORTS
CREATE TABLE IF NOT EXISTS public.sideeye_candidate_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  session_id uuid,
  user_id uuid NOT NULL,
  category text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolver_id uuid,
  resolver_note text
);
ALTER TABLE public.sideeye_candidate_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_candrep_contest ON public.sideeye_candidate_reports(contest_id, status);

DROP POLICY IF EXISTS "candidate reports insert by self" ON public.sideeye_candidate_reports;
CREATE POLICY "candidate reports insert by self" ON public.sideeye_candidate_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "candidate reports read by self or inst" ON public.sideeye_candidate_reports;
CREATE POLICY "candidate reports read by self or inst" ON public.sideeye_candidate_reports
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.contests c
      WHERE c.id = contest_id AND c.institution_id IS NOT NULL
        AND public.is_institution_member(c.institution_id, auth.uid(), 'proctor_reviewer')
    )
  );

DROP POLICY IF EXISTS "candidate reports update by inst admin" ON public.sideeye_candidate_reports;
CREATE POLICY "candidate reports update by inst admin" ON public.sideeye_candidate_reports
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_id AND c.institution_id IS NOT NULL
      AND public.is_institution_member(c.institution_id, auth.uid(), 'proctor_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_id AND c.institution_id IS NOT NULL
      AND public.is_institution_member(c.institution_id, auth.uid(), 'proctor_admin')
  ));

-- IDENTITY VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.contest_identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  id_card_path text,
  selfie_path text,
  match_score numeric,
  status text NOT NULL DEFAULT 'pending',
  reasons jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contest_id, user_id)
);
ALTER TABLE public.contest_identity_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "id verify read by self" ON public.contest_identity_verifications;
CREATE POLICY "id verify read by self" ON public.contest_identity_verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "id verify read by inst admins" ON public.contest_identity_verifications;
CREATE POLICY "id verify read by inst admins" ON public.contest_identity_verifications
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_id AND c.institution_id IS NOT NULL
      AND public.is_institution_member(c.institution_id, auth.uid(), 'proctor_reviewer')
  ));

DROP POLICY IF EXISTS "id verify insert by self" ON public.contest_identity_verifications;
CREATE POLICY "id verify insert by self" ON public.contest_identity_verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
