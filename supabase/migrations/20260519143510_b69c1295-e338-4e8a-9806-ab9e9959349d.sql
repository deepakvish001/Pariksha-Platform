
-- Status enum
DO $$ BEGIN
  CREATE TYPE public.org_student_status AS ENUM ('invited','active','suspended','alumni');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Main enrollment table
CREATE TABLE IF NOT EXISTS public.org_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_id uuid,
  full_name text,
  roll_number text,
  branch text,
  batch_year int,
  section text,
  status public.org_student_status NOT NULL DEFAULT 'invited',
  enrolled_by uuid,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  last_active_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS org_students_org_email_unique
  ON public.org_students (org_id, lower(email));
CREATE INDEX IF NOT EXISTS idx_org_students_org ON public.org_students(org_id);
CREATE INDEX IF NOT EXISTS idx_org_students_user ON public.org_students(user_id);
CREATE INDEX IF NOT EXISTS idx_org_students_email ON public.org_students(lower(email));

-- Pending invites
CREATE TABLE IF NOT EXISTS public.org_student_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.org_students(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  invited_by uuid,
  accepted_at timestamptz,
  accepted_by uuid,
  last_sent_at timestamptz,
  send_count int NOT NULL DEFAULT 0,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_student_invites_org ON public.org_student_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_org_student_invites_student ON public.org_student_invites(student_id);
CREATE INDEX IF NOT EXISTS idx_org_student_invites_email ON public.org_student_invites(lower(email));

-- Link assessment invites back to the enrollment record (optional)
ALTER TABLE public.assessment_invites
  ADD COLUMN IF NOT EXISTS org_student_id uuid REFERENCES public.org_students(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_invites_org_student
  ON public.assessment_invites(org_student_id);

-- Touch updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_org_students_touch ON public.org_students;
CREATE TRIGGER trg_org_students_touch
BEFORE UPDATE ON public.org_students
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Security-definer helper: is the current user an active student in an org?
CREATE OR REPLACE FUNCTION public.is_org_student(_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_students
    WHERE org_id = _org_id
      AND user_id = auth.uid()
      AND status IN ('invited','active')
  );
$$;

-- Auto-link enrollment when a matching auth user signs up
CREATE OR REPLACE FUNCTION public.link_org_student_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.org_students
     SET user_id = NEW.id,
         status = CASE WHEN status = 'invited' THEN 'active'::public.org_student_status ELSE status END,
         activated_at = COALESCE(activated_at, now())
   WHERE user_id IS NULL
     AND lower(email) = lower(NEW.email);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_link_org_student_on_signup ON auth.users;
CREATE TRIGGER trg_link_org_student_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_org_student_on_signup();

-- Auto-link an assessment_invites row to the matching enrollment
CREATE OR REPLACE FUNCTION public.link_assessment_invite_to_student()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _org uuid;
  _sid uuid;
BEGIN
  IF NEW.org_student_id IS NOT NULL THEN RETURN NEW; END IF;
  SELECT a.org_id INTO _org FROM public.assessments a WHERE a.id = NEW.assessment_id;
  IF _org IS NULL THEN RETURN NEW; END IF;
  SELECT s.id INTO _sid FROM public.org_students s
    WHERE s.org_id = _org AND lower(s.email) = lower(NEW.email) LIMIT 1;
  IF _sid IS NOT NULL THEN NEW.org_student_id = _sid; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_link_assessment_invite_to_student ON public.assessment_invites;
CREATE TRIGGER trg_link_assessment_invite_to_student
BEFORE INSERT ON public.assessment_invites
FOR EACH ROW EXECUTE FUNCTION public.link_assessment_invite_to_student();

-- RLS
ALTER TABLE public.org_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_student_invites ENABLE ROW LEVEL SECURITY;

-- Admin/owner/recruiter manage students
DROP POLICY IF EXISTS "Org staff can view students" ON public.org_students;
CREATE POLICY "Org staff can view students" ON public.org_students FOR SELECT
USING (public.is_org_member(org_id, ARRAY['owner','admin','recruiter','proctor','viewer']::org_member_role[]));

DROP POLICY IF EXISTS "Org admins can insert students" ON public.org_students;
CREATE POLICY "Org admins can insert students" ON public.org_students FOR INSERT
WITH CHECK (public.is_org_member(org_id, ARRAY['owner','admin','recruiter']::org_member_role[]));

DROP POLICY IF EXISTS "Org admins can update students" ON public.org_students;
CREATE POLICY "Org admins can update students" ON public.org_students FOR UPDATE
USING (public.is_org_member(org_id, ARRAY['owner','admin','recruiter']::org_member_role[]))
WITH CHECK (public.is_org_member(org_id, ARRAY['owner','admin','recruiter']::org_member_role[]));

DROP POLICY IF EXISTS "Org admins can delete students" ON public.org_students;
CREATE POLICY "Org admins can delete students" ON public.org_students FOR DELETE
USING (public.is_org_member(org_id, ARRAY['owner','admin']::org_member_role[]));

-- Student sees their own enrollment
DROP POLICY IF EXISTS "Students see their own enrollment" ON public.org_students;
CREATE POLICY "Students see their own enrollment" ON public.org_students FOR SELECT
USING (auth.uid() = user_id);

-- Students can update their own profile fields (limited via app logic)
DROP POLICY IF EXISTS "Students can update self enrollment" ON public.org_students;
CREATE POLICY "Students can update self enrollment" ON public.org_students FOR UPDATE
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Invites: org staff manage; invitee may read by token (via edge function only)
DROP POLICY IF EXISTS "Org staff view invites" ON public.org_student_invites;
CREATE POLICY "Org staff view invites" ON public.org_student_invites FOR SELECT
USING (public.is_org_member(org_id, ARRAY['owner','admin','recruiter','proctor','viewer']::org_member_role[]));

DROP POLICY IF EXISTS "Org admins manage invites" ON public.org_student_invites;
CREATE POLICY "Org admins manage invites" ON public.org_student_invites FOR ALL
USING (public.is_org_member(org_id, ARRAY['owner','admin','recruiter']::org_member_role[]))
WITH CHECK (public.is_org_member(org_id, ARRAY['owner','admin','recruiter']::org_member_role[]));
