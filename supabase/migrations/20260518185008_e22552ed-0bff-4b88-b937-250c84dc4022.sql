
-- 1) Add columns to questions
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS global_curated_by uuid NULL;

ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_tier_check;
ALTER TABLE public.questions
  ADD CONSTRAINT questions_tier_check CHECK (tier IN ('free','premium'));

-- Make org_id nullable so global rows can omit it
ALTER TABLE public.questions ALTER COLUMN org_id DROP NOT NULL;

-- Guard: org_id must be set unless global
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_org_or_global_check;
ALTER TABLE public.questions
  ADD CONSTRAINT questions_org_or_global_check
  CHECK ( (is_global = true AND org_id IS NULL) OR (is_global = false AND org_id IS NOT NULL) );

CREATE INDEX IF NOT EXISTS idx_questions_tier ON public.questions(tier);
CREATE INDEX IF NOT EXISTS idx_questions_global ON public.questions(is_global) WHERE is_global = true;

-- 2) Profiles premium flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- 3) Helper: is the user premium?
CREATE OR REPLACE FUNCTION public.user_is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_premium FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    false
  );
$$;

-- 4) RLS for global rows on questions
DROP POLICY IF EXISTS "anyone reads global questions" ON public.questions;
CREATE POLICY "anyone reads global questions"
ON public.questions FOR SELECT
TO authenticated
USING (is_global = true);

DROP POLICY IF EXISTS "admins insert global questions" ON public.questions;
CREATE POLICY "admins insert global questions"
ON public.questions FOR INSERT
TO authenticated
WITH CHECK (is_global = true AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins update global questions" ON public.questions;
CREATE POLICY "admins update global questions"
ON public.questions FOR UPDATE
TO authenticated
USING (is_global = true AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (is_global = true AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins delete global questions" ON public.questions;
CREATE POLICY "admins delete global questions"
ON public.questions FOR DELETE
TO authenticated
USING (is_global = true AND public.has_role(auth.uid(), 'admin'));

-- 5) Mirror on children — helper that says "the parent question is global"
CREATE OR REPLACE FUNCTION public.question_is_global(_qid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_global FROM public.questions WHERE id = _qid), false);
$$;

-- mcq_options global policies
DROP POLICY IF EXISTS "anyone reads global options" ON public.mcq_options;
CREATE POLICY "anyone reads global options"
ON public.mcq_options FOR SELECT
TO authenticated
USING (public.question_is_global(question_id));

DROP POLICY IF EXISTS "admins write global options" ON public.mcq_options;
CREATE POLICY "admins write global options"
ON public.mcq_options FOR ALL
TO authenticated
USING (public.question_is_global(question_id) AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.question_is_global(question_id) AND public.has_role(auth.uid(), 'admin'));

-- question_test_cases global policies
DROP POLICY IF EXISTS "anyone reads global tests" ON public.question_test_cases;
CREATE POLICY "anyone reads global tests"
ON public.question_test_cases FOR SELECT
TO authenticated
USING (public.question_is_global(question_id));

DROP POLICY IF EXISTS "admins write global tests" ON public.question_test_cases;
CREATE POLICY "admins write global tests"
ON public.question_test_cases FOR ALL
TO authenticated
USING (public.question_is_global(question_id) AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.question_is_global(question_id) AND public.has_role(auth.uid(), 'admin'));

-- 6) clone_global_question RPC: copies a global question (+ options + tests) into target_org
CREATE OR REPLACE FUNCTION public.clone_global_question(_question_id uuid, _target_org uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  src public.questions;
  new_id uuid;
BEGIN
  -- Caller must be a writer in the target org
  IF NOT public.can_write_org(_target_org) THEN
    RAISE EXCEPTION 'Not authorized to write to target org';
  END IF;

  SELECT * INTO src FROM public.questions WHERE id = _question_id AND is_global = true;
  IF src.id IS NULL THEN
    RAISE EXCEPTION 'Global question not found';
  END IF;

  INSERT INTO public.questions (
    org_id, type, title, body_md, language, starter_code, points, meta, tier, is_global, created_by
  ) VALUES (
    _target_org, src.type, src.title, src.body_md, src.language, src.starter_code,
    src.points, src.meta, src.tier, false, auth.uid()
  ) RETURNING id INTO new_id;

  INSERT INTO public.mcq_options (question_id, body, is_correct, order_index)
  SELECT new_id, body, is_correct, order_index FROM public.mcq_options WHERE question_id = src.id;

  INSERT INTO public.question_test_cases (question_id, input, expected_output, is_hidden, weight, order_index)
  SELECT new_id, input, expected_output, is_hidden, weight, order_index
  FROM public.question_test_cases WHERE question_id = src.id;

  RETURN new_id;
END;
$$;
