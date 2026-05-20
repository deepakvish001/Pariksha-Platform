CREATE TABLE IF NOT EXISTS public.mock_interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  company text,
  difficulty text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'active',
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  scorecard jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mock_interview_status_check CHECK (status IN ('active','completed','abandoned'))
);

ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mis_user ON public.mock_interview_sessions(user_id, started_at DESC);

CREATE POLICY "Users view own mock sessions"
  ON public.mock_interview_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own mock sessions"
  ON public.mock_interview_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own mock sessions"
  ON public.mock_interview_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all mock sessions"
  ON public.mock_interview_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER mock_interview_sessions_updated_at
  BEFORE UPDATE ON public.mock_interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();