
-- =========================================================
-- Tier 4 anti-cheat: pre-flight + room-scan + network severity
-- =========================================================

-- 1. Pre-flight environment checks
CREATE TABLE IF NOT EXISTS public.contest_preflight_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  -- One row per participant attempt; latest row wins
  status text NOT NULL CHECK (status IN ('pass','warn','fail')),
  -- Individual probe results: vm_detected, multi_monitor, virtual_camera,
  -- extensions_detected, resolution_mismatch, browser_unsupported, etc.
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preflight_contest_user
  ON public.contest_preflight_checks (contest_id, user_id, created_at DESC);

ALTER TABLE public.contest_preflight_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own preflight"
  ON public.contest_preflight_checks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own preflight"
  ON public.contest_preflight_checks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage preflight"
  ON public.contest_preflight_checks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Room scan recordings + verdict
CREATE TABLE IF NOT EXISTS public.contest_room_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  storage_path text NOT NULL,
  duration_ms int,
  -- AI verdict
  verdict text NOT NULL DEFAULT 'pending'
    CHECK (verdict IN ('pending','clean','suspicious','blocked','error')),
  ai_summary text,
  ai_findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_scans_contest_user
  ON public.contest_room_scans (contest_id, user_id, created_at DESC);

ALTER TABLE public.contest_room_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own room scan"
  ON public.contest_room_scans
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own room scan"
  ON public.contest_room_scans
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage room scans"
  ON public.contest_room_scans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Storage bucket for room-scan recordings (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contest-room-scans', 'contest-room-scans', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own room scan"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'contest-room-scans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own room scan files"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contest-room-scans'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- 4. Extend network audit with severity
ALTER TABLE public.contest_network_audit
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info','warn','high'));

CREATE INDEX IF NOT EXISTS idx_network_audit_severity
  ON public.contest_network_audit (contest_id, severity, created_at DESC)
  WHERE severity = 'high';

-- 5. RPC: record pre-flight result
CREATE OR REPLACE FUNCTION public.contest_record_preflight(
  _contest_id uuid,
  _session_id uuid,
  _status text,
  _details jsonb,
  _user_agent text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF _status NOT IN ('pass','warn','fail') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  INSERT INTO public.contest_preflight_checks
    (contest_id, user_id, session_id, status, details, user_agent)
  VALUES
    (_contest_id, auth.uid(), _session_id, _status, COALESCE(_details, '{}'::jsonb), _user_agent)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.contest_record_preflight(uuid,uuid,text,jsonb,text) FROM public;
GRANT EXECUTE ON FUNCTION public.contest_record_preflight(uuid,uuid,text,jsonb,text) TO authenticated;

-- 6. RPC: record room-scan upload (verdict will be set by edge function)
CREATE OR REPLACE FUNCTION public.contest_record_room_scan(
  _contest_id uuid,
  _session_id uuid,
  _storage_path text,
  _duration_ms int
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  INSERT INTO public.contest_room_scans
    (contest_id, user_id, session_id, storage_path, duration_ms)
  VALUES
    (_contest_id, auth.uid(), _session_id, _storage_path, _duration_ms)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.contest_record_room_scan(uuid,uuid,text,int) FROM public;
GRANT EXECUTE ON FUNCTION public.contest_record_room_scan(uuid,uuid,text,int) TO authenticated;

-- 7. Notify admins on failed pre-flight or blocked/suspicious room scan
CREATE OR REPLACE FUNCTION public.notify_admins_on_preflight_fail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
BEGIN
  IF NEW.status <> 'fail' THEN
    RETURN NEW;
  END IF;
  FOR admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      admin_id,
      'contest_preflight_fail',
      'Contest pre-flight failed',
      'A participant''s environment failed pre-flight checks.',
      jsonb_build_object(
        'contest_id', NEW.contest_id,
        'user_id', NEW.user_id,
        'session_id', NEW.session_id,
        'details', NEW.details
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_preflight_fail ON public.contest_preflight_checks;
CREATE TRIGGER trg_notify_preflight_fail
  AFTER INSERT ON public.contest_preflight_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_preflight_fail();

CREATE OR REPLACE FUNCTION public.notify_admins_on_room_scan_verdict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
BEGIN
  IF NEW.verdict NOT IN ('suspicious','blocked') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.verdict = NEW.verdict THEN
    RETURN NEW;
  END IF;
  FOR admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      admin_id,
      'contest_room_scan_flag',
      'Contest room scan flagged',
      CASE WHEN NEW.verdict = 'blocked'
        THEN 'Room scan blocked: suspicious objects/people detected.'
        ELSE 'Room scan flagged for admin review.'
      END,
      jsonb_build_object(
        'contest_id', NEW.contest_id,
        'user_id', NEW.user_id,
        'session_id', NEW.session_id,
        'verdict', NEW.verdict,
        'summary', NEW.ai_summary,
        'findings', NEW.ai_findings,
        'storage_path', NEW.storage_path
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_room_scan_verdict ON public.contest_room_scans;
CREATE TRIGGER trg_notify_room_scan_verdict
  AFTER INSERT OR UPDATE OF verdict ON public.contest_room_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_room_scan_verdict();
