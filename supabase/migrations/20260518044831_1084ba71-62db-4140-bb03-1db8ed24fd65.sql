-- 1) Enforcement mode on contests
DO $$ BEGIN
  CREATE TYPE public.contest_enforcement_mode AS ENUM ('open','standard','hard','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.contests
  ADD COLUMN IF NOT EXISTS enforcement_mode public.contest_enforcement_mode NOT NULL DEFAULT 'hard';

-- 2) Termination columns on sessions
ALTER TABLE public.contest_sessions
  ADD COLUMN IF NOT EXISTS terminated_at timestamptz,
  ADD COLUMN IF NOT EXISTS terminated_reason text,
  ADD COLUMN IF NOT EXISTS risk_score numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_contest_sessions_terminated
  ON public.contest_sessions (contest_id) WHERE terminated_at IS NOT NULL;

-- 3) Trust attestations (pre-test gate snapshot)
CREATE TABLE IF NOT EXISTS public.contest_trust_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  id_match_score numeric,
  id_match_passed boolean,
  single_monitor_ok boolean,
  display_count int,
  vm_detected boolean,
  rdp_detected boolean,
  webgl_renderer text,
  devtools_open boolean,
  automation_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_reputation jsonb NOT NULL DEFAULT '{}'::jsonb,
  side_eye_paired boolean,
  signed_token text,
  gate_passed boolean NOT NULL DEFAULT false,
  failures text[] NOT NULL DEFAULT ARRAY[]::text[],
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_attestations_session
  ON public.contest_trust_attestations(session_id);
CREATE INDEX IF NOT EXISTS idx_trust_attestations_contest_user
  ON public.contest_trust_attestations(contest_id, user_id, created_at DESC);

ALTER TABLE public.contest_trust_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trust_attestations self read"
  ON public.contest_trust_attestations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "trust_attestations admin all"
  ON public.contest_trust_attestations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4) Integrity verdicts (admin decision + public verifiable link)
DO $$ BEGIN
  CREATE TYPE public.integrity_verdict AS ENUM ('pending','confirmed','disputed','inconclusive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.contest_integrity_verdicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  verdict public.integrity_verdict NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamptz,
  reason text,
  public_token text UNIQUE,
  final_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integrity_verdicts_contest
  ON public.contest_integrity_verdicts(contest_id, verdict, created_at DESC);

ALTER TABLE public.contest_integrity_verdicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrity_verdicts self read"
  ON public.contest_integrity_verdicts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "integrity_verdicts admin all"
  ON public.contest_integrity_verdicts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public read via signed token only (RPC below — no direct table policy needed for token reads)

CREATE OR REPLACE FUNCTION public.get_public_integrity_verdict(p_token text)
RETURNS TABLE (
  session_id uuid,
  contest_id uuid,
  verdict public.integrity_verdict,
  decided_at timestamptz,
  final_hash text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT session_id, contest_id, verdict, decided_at, final_hash
  FROM public.contest_integrity_verdicts
  WHERE public_token = p_token AND verdict <> 'pending'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_integrity_verdict(text) TO anon, authenticated;

-- 5) Updated-at trigger for verdicts
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_integrity_verdicts_touch ON public.contest_integrity_verdicts;
CREATE TRIGGER trg_integrity_verdicts_touch
  BEFORE UPDATE ON public.contest_integrity_verdicts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();