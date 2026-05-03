-- User blocking (unilateral) for arena
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON public.user_blocks(blocked_id);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_blocks owner read" ON public.user_blocks
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);
CREATE POLICY "user_blocks owner insert" ON public.user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "user_blocks owner delete" ON public.user_blocks
  FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

-- Reports of arena players
CREATE TABLE IF NOT EXISTS public.player_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reporter_id <> reported_id)
);
CREATE INDEX IF NOT EXISTS player_reports_reporter_idx ON public.player_reports(reporter_id);
CREATE INDEX IF NOT EXISTS player_reports_reported_idx ON public.player_reports(reported_id);
ALTER TABLE public.player_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_reports reporter read" ON public.player_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);
CREATE POLICY "player_reports reporter insert" ON public.player_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Enable realtime for friendships (already in publication per inspection, safe ALTER):
ALTER TABLE public.friendships REPLICA IDENTITY FULL;