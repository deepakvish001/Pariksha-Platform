-- Tier 3 anti-cheat: variants, similarity, viva queue
-- Tables first (no inter-table policy refs yet) ------------------------
CREATE TABLE IF NOT EXISTS public.contest_problem_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  problem_slug text NOT NULL,
  variant_key text NOT NULL,
  title text,
  statement_md text,
  hidden_test_seed text,
  weight numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, problem_slug, variant_key)
);
CREATE INDEX IF NOT EXISTS idx_cpv_contest_problem
  ON public.contest_problem_variants (contest_id, problem_slug);

CREATE TABLE IF NOT EXISTS public.contest_user_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  problem_slug text NOT NULL,
  variant_id uuid NOT NULL REFERENCES public.contest_problem_variants(id) ON DELETE CASCADE,
  variant_key text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, user_id, problem_slug)
);
CREATE INDEX IF NOT EXISTS idx_cuv_user ON public.contest_user_variants (user_id, contest_id);

CREATE TABLE IF NOT EXISTS public.contest_similarity_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  problem_slug text NOT NULL,
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  submission_a uuid,
  submission_b uuid,
  similarity numeric NOT NULL CHECK (similarity >= 0 AND similarity <= 1),
  method text NOT NULL DEFAULT 'gemini',
  verdict text NOT NULL DEFAULT 'pending'
    CHECK (verdict IN ('pending','clean','flag','dq','waived')),
  rationale text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT csp_user_order CHECK (user_a < user_b)
);
CREATE INDEX IF NOT EXISTS idx_csp_contest_problem
  ON public.contest_similarity_pairs (contest_id, problem_slug, similarity DESC);
CREATE INDEX IF NOT EXISTS idx_csp_users
  ON public.contest_similarity_pairs (user_a, user_b);

CREATE TABLE IF NOT EXISTS public.contest_viva_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  problem_slug text,
  reason text NOT NULL,
  source text NOT NULL DEFAULT 'auto' CHECK (source IN ('auto','admin','user_request')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','scheduled','passed','failed','waived','cancelled')),
  scheduled_at timestamptz,
  reviewer_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, user_id, problem_slug)
);
CREATE INDEX IF NOT EXISTS idx_cvq_status
  ON public.contest_viva_queue (contest_id, status, created_at DESC);

-- RLS ------------------------------------------------------------------
ALTER TABLE public.contest_problem_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_user_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_similarity_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_viva_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cpv admin all" ON public.contest_problem_variants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cpv participant read assigned" ON public.contest_problem_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contest_user_variants uv
      WHERE uv.variant_id = contest_problem_variants.id AND uv.user_id = auth.uid()
    )
  );

CREATE POLICY "cuv admin all" ON public.contest_user_variants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cuv self read" ON public.contest_user_variants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "csp admin all" ON public.contest_similarity_pairs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "csp self read" ON public.contest_similarity_pairs
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "cvq admin all" ON public.contest_viva_queue
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cvq self read" ON public.contest_viva_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Triggers / functions -------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_cvq_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS cvq_touch_updated_at ON public.contest_viva_queue;
CREATE TRIGGER cvq_touch_updated_at
  BEFORE UPDATE ON public.contest_viva_queue
  FOR EACH ROW EXECUTE FUNCTION public.tg_cvq_touch_updated_at();

CREATE OR REPLACE FUNCTION public.assign_contest_variant(
  _contest_id uuid, _problem_slug text
) RETURNS public.contest_user_variants
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user uuid := auth.uid();
  _existing public.contest_user_variants;
  _chosen public.contest_problem_variants;
  _count int;
  _idx int;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _existing FROM public.contest_user_variants
  WHERE contest_id = _contest_id AND user_id = _user AND problem_slug = _problem_slug;
  IF FOUND THEN RETURN _existing; END IF;

  SELECT count(*) INTO _count FROM public.contest_problem_variants
  WHERE contest_id = _contest_id AND problem_slug = _problem_slug;
  IF _count = 0 THEN RAISE EXCEPTION 'no variants configured for problem'; END IF;

  _idx := abs(('x' || substr(md5(_user::text || ':' || _problem_slug), 1, 8))::bit(32)::int) % _count;

  SELECT * INTO _chosen FROM public.contest_problem_variants
  WHERE contest_id = _contest_id AND problem_slug = _problem_slug
  ORDER BY variant_key OFFSET _idx LIMIT 1;

  INSERT INTO public.contest_user_variants
    (contest_id, user_id, problem_slug, variant_id, variant_key)
  VALUES (_contest_id, _user, _problem_slug, _chosen.id, _chosen.variant_key)
  RETURNING * INTO _existing;
  RETURN _existing;
END $$;
GRANT EXECUTE ON FUNCTION public.assign_contest_variant(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.contest_force_dq(
  _contest_id uuid, _user_id uuid, _reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  UPDATE public.contest_sessions SET is_active = false, invalidated_at = now()
  WHERE contest_id = _contest_id AND user_id = _user_id AND is_active;
  INSERT INTO public.contest_violations (contest_id, user_id, type, severity, meta)
  VALUES (_contest_id, _user_id, 'admin_force_dq', 'fatal',
          jsonb_build_object('reason', _reason, 'admin_id', auth.uid()));
END $$;
GRANT EXECUTE ON FUNCTION public.contest_force_dq(uuid, uuid, text) TO authenticated;

-- Realtime publication for live admin monitor --------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_violations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_proctor_snapshots;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_similarity_pairs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_viva_queue;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;