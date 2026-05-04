
-- Provenance ledger
CREATE TABLE IF NOT EXISTS public.contest_code_provenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  contest_id UUID NOT NULL,
  user_id UUID NOT NULL,
  problem_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('keystroke','paste','cut','delete_block','ai_suggest','undo','redo','snapshot')),
  char_count INTEGER,
  paste_size INTEGER,
  diff_summary JSONB,
  client_ts TIMESTAMPTZ NOT NULL,
  server_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  suspicious BOOLEAN NOT NULL DEFAULT false,
  reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_provenance_session ON public.contest_code_provenance(session_id, server_ts DESC);
CREATE INDEX IF NOT EXISTS idx_provenance_user ON public.contest_code_provenance(user_id, contest_id);
ALTER TABLE public.contest_code_provenance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own provenance" ON public.contest_code_provenance;
CREATE POLICY "Users insert own provenance" ON public.contest_code_provenance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins view all provenance" ON public.contest_code_provenance;
CREATE POLICY "Admins view all provenance" ON public.contest_code_provenance FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users view own provenance" ON public.contest_code_provenance;
CREATE POLICY "Users view own provenance" ON public.contest_code_provenance FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Variant test bindings
CREATE TABLE IF NOT EXISTS public.contest_variant_test_bindings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL,
  problem_id UUID NOT NULL,
  variant_key TEXT NOT NULL,
  test_bundle JSONB NOT NULL,
  bundle_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contest_id, problem_id, variant_key)
);
ALTER TABLE public.contest_variant_test_bindings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage variant tests" ON public.contest_variant_test_bindings;
CREATE POLICY "Admins manage variant tests" ON public.contest_variant_test_bindings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Solve time analysis
CREATE TABLE IF NOT EXISTS public.contest_solve_time_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  contest_id UUID NOT NULL,
  problem_id UUID NOT NULL,
  expected_min_seconds INTEGER NOT NULL,
  actual_seconds INTEGER NOT NULL,
  z_score NUMERIC,
  ai_likelihood NUMERIC,
  verdict TEXT NOT NULL CHECK (verdict IN ('normal','fast','too_fast','impossible')),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contest_solve_time_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read solve time" ON public.contest_solve_time_analysis;
CREATE POLICY "Admins read solve time" ON public.contest_solve_time_analysis FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Service writes solve time" ON public.contest_solve_time_analysis;
CREATE POLICY "Service writes solve time" ON public.contest_solve_time_analysis FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Cross-contest similarity
CREATE TABLE IF NOT EXISTS public.contest_cross_similarity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_session_id UUID NOT NULL,
  source_user_id UUID NOT NULL,
  source_contest_id UUID NOT NULL,
  match_session_id UUID,
  match_user_id UUID,
  match_contest_id UUID,
  match_source TEXT NOT NULL CHECK (match_source IN ('internal','github','codeforces','leetcode','stackoverflow','web')),
  match_url TEXT,
  similarity NUMERIC NOT NULL,
  matched_lines INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cross_sim_source ON public.contest_cross_similarity(source_user_id, similarity DESC);
ALTER TABLE public.contest_cross_similarity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read cross similarity" ON public.contest_cross_similarity;
CREATE POLICY "Admins read cross similarity" ON public.contest_cross_similarity FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins write cross similarity" ON public.contest_cross_similarity;
CREATE POLICY "Admins write cross similarity" ON public.contest_cross_similarity FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Augment existing viva queue
ALTER TABLE public.contest_viva_queue
  ADD COLUMN IF NOT EXISTS session_id UUID,
  ADD COLUMN IF NOT EXISTS rank INTEGER;

-- Two-admin DQ sign-off
CREATE TABLE IF NOT EXISTS public.contest_dq_signoffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  proposed_by UUID NOT NULL,
  proposed_reason TEXT NOT NULL,
  evidence JSONB NOT NULL,
  approver_id UUID,
  approver_decision TEXT CHECK (approver_decision IN ('approved','rejected')),
  approver_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);
ALTER TABLE public.contest_dq_signoffs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage signoffs" ON public.contest_dq_signoffs;
CREATE POLICY "Admins manage signoffs" ON public.contest_dq_signoffs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Integrity reports
CREATE TABLE IF NOT EXISTS public.contest_integrity_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL UNIQUE,
  total_participants INTEGER NOT NULL DEFAULT 0,
  flagged_count INTEGER NOT NULL DEFAULT 0,
  dq_count INTEGER NOT NULL DEFAULT 0,
  viva_count INTEGER NOT NULL DEFAULT 0,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contest_integrity_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads published reports" ON public.contest_integrity_reports;
CREATE POLICY "Public reads published reports" ON public.contest_integrity_reports FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "Admins manage reports" ON public.contest_integrity_reports;
CREATE POLICY "Admins manage reports" ON public.contest_integrity_reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Account bindings
CREATE TABLE IF NOT EXISTS public.contest_account_bindings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  id_document_hash TEXT NOT NULL,
  face_embedding_hash TEXT NOT NULL,
  primary_device_fingerprint TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_device TEXT,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contest_account_bindings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own binding" ON public.contest_account_bindings;
CREATE POLICY "Users view own binding" ON public.contest_account_bindings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins manage bindings" ON public.contest_account_bindings;
CREATE POLICY "Admins manage bindings" ON public.contest_account_bindings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers
CREATE OR REPLACE FUNCTION public.trg_notify_dq_signoff()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_alerts (alert_type, severity, title, message, metadata)
  VALUES (
    'contest_dq_signoff_request', 'high',
    'DQ sign-off requested',
    format('Session %s in contest %s — reason: %s', NEW.session_id, NEW.contest_id, NEW.proposed_reason),
    jsonb_build_object('signoff_id', NEW.id, 'contest_id', NEW.contest_id, 'session_id', NEW.session_id, 'user_id', NEW.user_id, 'evidence', NEW.evidence)
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_dq_signoff_notify ON public.contest_dq_signoffs;
CREATE TRIGGER trg_dq_signoff_notify AFTER INSERT ON public.contest_dq_signoffs FOR EACH ROW EXECUTE FUNCTION public.trg_notify_dq_signoff();

CREATE OR REPLACE FUNCTION public.trg_notify_cross_similarity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.similarity >= 0.80 THEN
    INSERT INTO public.admin_alerts (alert_type, severity, title, message, metadata)
    VALUES (
      'contest_cross_similarity_high', 'high',
      'Cross-contest code match',
      format('Session %s matches %s source at %s%%', NEW.source_session_id, NEW.match_source, ROUND(NEW.similarity * 100)),
      jsonb_build_object('row', to_jsonb(NEW))
    );
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_cross_sim_notify ON public.contest_cross_similarity;
CREATE TRIGGER trg_cross_sim_notify AFTER INSERT ON public.contest_cross_similarity FOR EACH ROW EXECUTE FUNCTION public.trg_notify_cross_similarity();

DROP TRIGGER IF EXISTS trg_integrity_reports_updated ON public.contest_integrity_reports;
CREATE TRIGGER trg_integrity_reports_updated BEFORE UPDATE ON public.contest_integrity_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_account_bindings_updated ON public.contest_account_bindings;
CREATE TRIGGER trg_account_bindings_updated BEFORE UPDATE ON public.contest_account_bindings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
