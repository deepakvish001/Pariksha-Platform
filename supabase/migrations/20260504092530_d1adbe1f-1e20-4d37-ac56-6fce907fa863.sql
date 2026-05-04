-- Telemetry for blocked aux-panel interactions during a contest.
CREATE TABLE IF NOT EXISTS public.contest_lock_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID,
  problem_slug TEXT,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  event_kind TEXT NOT NULL,
  target TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_lock_events_contest ON public.contest_lock_events(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_lock_events_user ON public.contest_lock_events(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_lock_events_created ON public.contest_lock_events(created_at DESC);

ALTER TABLE public.contest_lock_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own contest lock events"
  ON public.contest_lock_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own contest lock events"
  ON public.contest_lock_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all contest lock events"
  ON public.contest_lock_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
