CREATE TABLE public.code_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  problem_slug text NOT NULL,
  language text NOT NULL,
  language_id integer NOT NULL,
  source_code text NOT NULL DEFAULT '',
  stdin text NOT NULL DEFAULT '',
  stdout text,
  stderr text,
  compile_output text,
  status text,
  status_id integer,
  time_ms integer,
  memory_kb integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.code_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own runs"
  ON public.code_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own runs"
  ON public.code_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own runs"
  ON public.code_runs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_code_runs_user_problem ON public.code_runs (user_id, problem_slug, created_at DESC);
CREATE INDEX idx_code_runs_user_created ON public.code_runs (user_id, created_at DESC);