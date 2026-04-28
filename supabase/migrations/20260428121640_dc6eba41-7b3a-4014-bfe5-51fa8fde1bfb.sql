CREATE TABLE public.user_problem_solutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  problem_slug TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  code JSONB NOT NULL DEFAULT '{}'::jsonb,
  code_updated_at JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, problem_slug)
);

ALTER TABLE public.user_problem_solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own solutions"
ON public.user_problem_solutions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own solutions"
ON public.user_problem_solutions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own solutions"
ON public.user_problem_solutions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own solutions"
ON public.user_problem_solutions FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_user_problem_solutions_user ON public.user_problem_solutions(user_id);
CREATE INDEX idx_user_problem_solutions_slug ON public.user_problem_solutions(user_id, problem_slug);

CREATE TRIGGER update_user_problem_solutions_updated_at
BEFORE UPDATE ON public.user_problem_solutions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();