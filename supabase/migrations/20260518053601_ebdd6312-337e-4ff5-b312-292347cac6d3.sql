CREATE TABLE IF NOT EXISTS public.contest_keystroke_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  profile jsonb NOT NULL,
  samples integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contest_keystroke_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidate reads own keystroke baseline"
  ON public.contest_keystroke_baselines FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all keystroke baselines"
  ON public.contest_keystroke_baselines FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_keystroke_baselines_user ON public.contest_keystroke_baselines(user_id);

CREATE TRIGGER trg_keystroke_baselines_updated
  BEFORE UPDATE ON public.contest_keystroke_baselines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();