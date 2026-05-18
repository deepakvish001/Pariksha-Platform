-- Layer 3 — Active liveness challenges issued mid-session.
CREATE TABLE public.contest_liveness_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  contest_id UUID NOT NULL,
  user_id UUID NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('fingers','head_turn','color_card')),
  prompt JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','passed','failed','timeout')),
  evidence_path TEXT,
  ai_verdict JSONB,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '45 seconds')
);

CREATE INDEX idx_contest_liveness_session ON public.contest_liveness_challenges(session_id, issued_at DESC);
CREATE INDEX idx_contest_liveness_pending ON public.contest_liveness_challenges(session_id) WHERE status = 'pending';

ALTER TABLE public.contest_liveness_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "liveness self read"
ON public.contest_liveness_challenges
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "liveness admin all"
ON public.contest_liveness_challenges
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_liveness_challenges;