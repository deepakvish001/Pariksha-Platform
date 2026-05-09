
-- Enums
DO $$ BEGIN
  CREATE TYPE public.assessment_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM ('coding','mcq','sql','subjective');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: can the current user write (create/update/delete) for this org?
CREATE OR REPLACE FUNCTION public.can_write_org(_org uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = _org
      AND user_id = auth.uid()
      AND role IN ('owner','admin','recruiter')
  );
$$;

-- Assessments
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  duration_min integer NOT NULL DEFAULT 60,
  starts_at timestamptz,
  ends_at timestamptz,
  max_attempts integer NOT NULL DEFAULT 1,
  proctoring_enabled boolean NOT NULL DEFAULT false,
  status public.assessment_status NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_assessments_org ON public.assessments(org_id);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read assessments" ON public.assessments FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "org writers insert assessments" ON public.assessments FOR INSERT WITH CHECK (public.can_write_org(org_id));
CREATE POLICY "org writers update assessments" ON public.assessments FOR UPDATE USING (public.can_write_org(org_id));
CREATE POLICY "org writers delete assessments" ON public.assessments FOR DELETE USING (public.can_write_org(org_id));

CREATE TRIGGER trg_assessments_updated_at BEFORE UPDATE ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sections
CREATE TABLE public.assessment_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  title text NOT NULL,
  weight numeric NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sections_assessment ON public.assessment_sections(assessment_id);
ALTER TABLE public.assessment_sections ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.assessment_org(_assessment uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT org_id FROM public.assessments WHERE id = _assessment $$;

CREATE POLICY "members read sections" ON public.assessment_sections FOR SELECT USING (public.is_org_member(public.assessment_org(assessment_id)));
CREATE POLICY "writers insert sections" ON public.assessment_sections FOR INSERT WITH CHECK (public.can_write_org(public.assessment_org(assessment_id)));
CREATE POLICY "writers update sections" ON public.assessment_sections FOR UPDATE USING (public.can_write_org(public.assessment_org(assessment_id)));
CREATE POLICY "writers delete sections" ON public.assessment_sections FOR DELETE USING (public.can_write_org(public.assessment_org(assessment_id)));

-- Questions (org-level question bank)
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type public.question_type NOT NULL,
  title text NOT NULL,
  body_md text,
  language text,
  starter_code text,
  points integer NOT NULL DEFAULT 10,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_org ON public.questions(org_id);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read questions" ON public.questions FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "writers insert questions" ON public.questions FOR INSERT WITH CHECK (public.can_write_org(org_id));
CREATE POLICY "writers update questions" ON public.questions FOR UPDATE USING (public.can_write_org(org_id));
CREATE POLICY "writers delete questions" ON public.questions FOR DELETE USING (public.can_write_org(org_id));

CREATE TRIGGER trg_questions_updated_at BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.question_org(_question uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT org_id FROM public.questions WHERE id = _question $$;

-- Test cases
CREATE TABLE public.question_test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  input text NOT NULL DEFAULT '',
  expected_output text NOT NULL DEFAULT '',
  is_hidden boolean NOT NULL DEFAULT true,
  weight numeric NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tests_question ON public.question_test_cases(question_id);
ALTER TABLE public.question_test_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read tests" ON public.question_test_cases FOR SELECT USING (public.is_org_member(public.question_org(question_id)));
CREATE POLICY "writers insert tests" ON public.question_test_cases FOR INSERT WITH CHECK (public.can_write_org(public.question_org(question_id)));
CREATE POLICY "writers update tests" ON public.question_test_cases FOR UPDATE USING (public.can_write_org(public.question_org(question_id)));
CREATE POLICY "writers delete tests" ON public.question_test_cases FOR DELETE USING (public.can_write_org(public.question_org(question_id)));

-- MCQ options
CREATE TABLE public.mcq_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_options_question ON public.mcq_options(question_id);
ALTER TABLE public.mcq_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read options" ON public.mcq_options FOR SELECT USING (public.is_org_member(public.question_org(question_id)));
CREATE POLICY "writers insert options" ON public.mcq_options FOR INSERT WITH CHECK (public.can_write_org(public.question_org(question_id)));
CREATE POLICY "writers update options" ON public.mcq_options FOR UPDATE USING (public.can_write_org(public.question_org(question_id)));
CREATE POLICY "writers delete options" ON public.mcq_options FOR DELETE USING (public.can_write_org(public.question_org(question_id)));

-- Section <-> Questions
CREATE TABLE public.section_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.assessment_sections(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  weight_override numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, question_id)
);
CREATE INDEX idx_sq_section ON public.section_questions(section_id);

CREATE OR REPLACE FUNCTION public.section_org(_section uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT a.org_id FROM public.assessment_sections s JOIN public.assessments a ON a.id = s.assessment_id WHERE s.id = _section $$;

ALTER TABLE public.section_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read sq" ON public.section_questions FOR SELECT USING (public.is_org_member(public.section_org(section_id)));
CREATE POLICY "writers insert sq" ON public.section_questions FOR INSERT WITH CHECK (public.can_write_org(public.section_org(section_id)));
CREATE POLICY "writers update sq" ON public.section_questions FOR UPDATE USING (public.can_write_org(public.section_org(section_id)));
CREATE POLICY "writers delete sq" ON public.section_questions FOR DELETE USING (public.can_write_org(public.section_org(section_id)));
