
-- 1. Placement Readiness Scores
CREATE TABLE public.placement_readiness_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  dsa_score INTEGER NOT NULL DEFAULT 0,
  srs_score INTEGER NOT NULL DEFAULT 0,
  contest_score INTEGER NOT NULL DEFAULT 0,
  resume_score INTEGER NOT NULL DEFAULT 0,
  consistency_score INTEGER NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  level TEXT NOT NULL DEFAULT 'beginner',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.placement_readiness_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PRS publicly readable"
  ON public.placement_readiness_scores FOR SELECT
  USING (true);

CREATE POLICY "Users insert own PRS"
  ON public.placement_readiness_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own PRS"
  ON public.placement_readiness_scores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_prs_score ON public.placement_readiness_scores(score DESC);

-- 2. Target companies
CREATE TABLE public.target_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'SDE-1',
  timeline_weeks INTEGER NOT NULL DEFAULT 8 CHECK (timeline_weeks BETWEEN 2 AND 52),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.target_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own targets"
  ON public.target_companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own targets"
  ON public.target_companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own targets"
  ON public.target_companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own targets"
  ON public.target_companies FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_target_user ON public.target_companies(user_id);

-- 3. Company prep plans
CREATE TABLE public.company_prep_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_company_id UUID NOT NULL REFERENCES public.target_companies(id) ON DELETE CASCADE,
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_prep_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own plans"
  ON public.company_prep_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plans"
  ON public.company_prep_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plans"
  ON public.company_prep_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plans"
  ON public.company_prep_plans FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_plan_user ON public.company_prep_plans(user_id);
CREATE INDEX idx_plan_target ON public.company_prep_plans(target_company_id);

-- 4. Portfolio settings
CREATE TABLE public.portfolio_settings (
  user_id UUID NOT NULL PRIMARY KEY,
  is_public BOOLEAN NOT NULL DEFAULT true,
  show_prs BOOLEAN NOT NULL DEFAULT true,
  show_contests BOOLEAN NOT NULL DEFAULT true,
  show_badges BOOLEAN NOT NULL DEFAULT true,
  show_resume_score BOOLEAN NOT NULL DEFAULT false,
  show_target_company BOOLEAN NOT NULL DEFAULT true,
  tagline TEXT,
  custom_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio settings publicly readable"
  ON public.portfolio_settings FOR SELECT USING (true);
CREATE POLICY "Users upsert own portfolio settings"
  ON public.portfolio_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own portfolio settings"
  ON public.portfolio_settings FOR UPDATE USING (auth.uid() = user_id);

-- Reuse existing update_updated_at_column trigger
CREATE TRIGGER trg_target_companies_updated_at
  BEFORE UPDATE ON public.target_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_company_prep_plans_updated_at
  BEFORE UPDATE ON public.company_prep_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_portfolio_settings_updated_at
  BEFORE UPDATE ON public.portfolio_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
