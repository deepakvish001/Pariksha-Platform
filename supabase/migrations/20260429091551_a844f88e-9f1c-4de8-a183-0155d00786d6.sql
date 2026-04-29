-- 1. user_study_profile
CREATE TABLE public.user_study_profile (
  user_id UUID NOT NULL PRIMARY KEY,
  goal TEXT NOT NULL,
  target_date DATE,
  weekday_minutes INTEGER NOT NULL DEFAULT 60,
  weekend_minutes INTEGER NOT NULL DEFAULT 120,
  level TEXT NOT NULL DEFAULT 'beginner',
  topics_known TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_study_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own study profile" ON public.user_study_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own study profile" ON public.user_study_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own study profile" ON public.user_study_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own study profile" ON public.user_study_profile FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_study_profile_updated BEFORE UPDATE ON public.user_study_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. user_platform_stats
CREATE TABLE public.user_platform_stats (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  rating INTEGER,
  solved_easy INTEGER NOT NULL DEFAULT 0,
  solved_medium INTEGER NOT NULL DEFAULT 0,
  solved_hard INTEGER NOT NULL DEFAULT 0,
  solved_total INTEGER NOT NULL DEFAULT 0,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  sync_status TEXT NOT NULL DEFAULT 'ok',
  sync_error TEXT,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);
ALTER TABLE public.user_platform_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own platform stats" ON public.user_platform_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own platform stats" ON public.user_platform_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own platform stats" ON public.user_platform_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own platform stats" ON public.user_platform_stats FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_platform_stats_updated BEFORE UPDATE ON public.user_platform_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. user_study_plans
CREATE TABLE public.user_study_plans (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own study plans" ON public.user_study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own study plans" ON public.user_study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own study plans" ON public.user_study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own study plans" ON public.user_study_plans FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_user_study_plans_user_active ON public.user_study_plans(user_id, is_active);
CREATE TRIGGER trg_user_study_plans_updated BEFORE UPDATE ON public.user_study_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. user_study_plan_tasks
CREATE TABLE public.user_study_plan_tasks (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.user_study_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_date DATE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  est_minutes INTEGER NOT NULL DEFAULT 30,
  source_type TEXT,
  source_id TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_study_plan_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own plan tasks" ON public.user_study_plan_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plan tasks" ON public.user_study_plan_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plan tasks" ON public.user_study_plan_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plan tasks" ON public.user_study_plan_tasks FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_user_study_plan_tasks_user_day ON public.user_study_plan_tasks(user_id, day_date);
CREATE INDEX idx_user_study_plan_tasks_plan ON public.user_study_plan_tasks(plan_id);
CREATE TRIGGER trg_user_study_plan_tasks_updated BEFORE UPDATE ON public.user_study_plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();