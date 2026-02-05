-- Create study plan goals table to track progress on study recommendations
CREATE TABLE public.study_plan_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  target_questions INTEGER NOT NULL DEFAULT 10,
  questions_practiced INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Enable RLS
ALTER TABLE public.study_plan_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own study plan goals"
  ON public.study_plan_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study plan goals"
  ON public.study_plan_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study plan goals"
  ON public.study_plan_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study plan goals"
  ON public.study_plan_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_study_plan_goals_user_id ON public.study_plan_goals(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_study_plan_goals_updated_at
  BEFORE UPDATE ON public.study_plan_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();