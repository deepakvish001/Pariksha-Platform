-- =========================================
-- Coding Problems Hub schema
-- =========================================

-- 1. code_submissions: history of every Run/Submit
CREATE TABLE IF NOT EXISTS public.code_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  problem_slug TEXT NOT NULL,
  language TEXT NOT NULL,
  language_id INTEGER NOT NULL,
  source_code TEXT NOT NULL,
  verdict TEXT NOT NULL,
  runtime_ms INTEGER,
  memory_kb INTEGER,
  passed_tests INTEGER NOT NULL DEFAULT 0,
  total_tests INTEGER NOT NULL DEFAULT 0,
  failing_case JSONB,
  stderr TEXT,
  is_submission BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_code_submissions_user ON public.code_submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_submissions_problem ON public.code_submissions(problem_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_submissions_user_problem ON public.code_submissions(user_id, problem_slug, created_at DESC);

ALTER TABLE public.code_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own submissions"
  ON public.code_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own submissions"
  ON public.code_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. code_drafts: autosaved editor contents per (user, problem, language)
CREATE TABLE IF NOT EXISTS public.code_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  problem_slug TEXT NOT NULL,
  language TEXT NOT NULL,
  source_code TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, problem_slug, language)
);

CREATE INDEX IF NOT EXISTS idx_code_drafts_user_problem ON public.code_drafts(user_id, problem_slug);

ALTER TABLE public.code_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own drafts"
  ON public.code_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own drafts"
  ON public.code_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own drafts"
  ON public.code_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own drafts"
  ON public.code_drafts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_code_drafts_updated_at
  BEFORE UPDATE ON public.code_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. coding_problems_meta: public stats cache
CREATE TABLE IF NOT EXISTS public.coding_problems_meta (
  problem_slug TEXT PRIMARY KEY,
  total_submissions INTEGER NOT NULL DEFAULT 0,
  total_accepted INTEGER NOT NULL DEFAULT 0,
  acceptance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coding_problems_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coding problem stats"
  ON public.coding_problems_meta FOR SELECT
  USING (true);

-- 4. Trigger: update meta stats + activity log on accepted submission
CREATE OR REPLACE FUNCTION public.handle_code_submission_aftermath()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_subs INTEGER;
  total_acc INTEGER;
BEGIN
  -- Only count true submissions (not Run-only)
  IF NEW.is_submission = false THEN
    RETURN NEW;
  END IF;

  -- Upsert stats
  INSERT INTO public.coding_problems_meta (problem_slug, total_submissions, total_accepted, acceptance_rate)
  VALUES (NEW.problem_slug, 1, CASE WHEN NEW.verdict = 'Accepted' THEN 1 ELSE 0 END,
          CASE WHEN NEW.verdict = 'Accepted' THEN 100 ELSE 0 END)
  ON CONFLICT (problem_slug) DO UPDATE
  SET total_submissions = public.coding_problems_meta.total_submissions + 1,
      total_accepted = public.coding_problems_meta.total_accepted +
                       CASE WHEN NEW.verdict = 'Accepted' THEN 1 ELSE 0 END,
      updated_at = now();

  UPDATE public.coding_problems_meta
  SET acceptance_rate = ROUND((total_accepted::numeric / NULLIF(total_submissions, 0)) * 100, 2)
  WHERE problem_slug = NEW.problem_slug;

  -- Log accepted submissions to activity feed
  IF NEW.verdict = 'Accepted' THEN
    INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
    VALUES (
      NEW.user_id,
      'code_submission',
      'Solved Coding Problem',
      NEW.problem_slug,
      jsonb_build_object(
        'problem_slug', NEW.problem_slug,
        'language', NEW.language,
        'runtime_ms', NEW.runtime_ms,
        'memory_kb', NEW.memory_kb
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_handle_code_submission_aftermath
  AFTER INSERT ON public.code_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_code_submission_aftermath();