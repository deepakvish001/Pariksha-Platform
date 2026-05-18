-- Layer 5: Tamper-proof transport — per-session ephemeral signing keys
CREATE TABLE IF NOT EXISTS public.contest_session_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  key_hash TEXT NOT NULL,
  key_secret TEXT NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  rotated_from UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_session_keys_session ON public.contest_session_keys(session_id);
CREATE INDEX IF NOT EXISTS idx_contest_session_keys_active ON public.contest_session_keys(session_id, expires_at) WHERE revoked_at IS NULL;

ALTER TABLE public.contest_session_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can read raw key material; candidates receive keys via the edge function (service role).
CREATE POLICY "Admins can read session keys"
  ON public.contest_session_keys FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- No client-side inserts/updates — service role only.
CREATE POLICY "Admins can manage session keys"
  ON public.contest_session_keys FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tracks per-session monotonic event sequence to detect replay/out-of-order events.
CREATE TABLE IF NOT EXISTS public.contest_session_event_seq (
  session_id UUID PRIMARY KEY,
  last_seq BIGINT NOT NULL DEFAULT 0,
  last_nonce TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contest_session_event_seq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read event sequence"
  ON public.contest_session_event_seq FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage event sequence"
  ON public.contest_session_event_seq FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));