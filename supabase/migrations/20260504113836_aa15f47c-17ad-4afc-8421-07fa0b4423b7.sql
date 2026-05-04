
-- =========================================================
-- Tier 5 anti-cheat: in-contest sensors
-- =========================================================

-- 1. Per-snapshot AI vision findings
CREATE TABLE IF NOT EXISTS public.contest_proctor_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  snapshot_id uuid,                        -- FK-style ref to contest_proctor_snapshots
  face_count int,                          -- 0 / 1 / 2+
  gaze_direction text,                     -- on_screen | off_screen | unknown
  phone_detected boolean DEFAULT false,
  second_screen_detected boolean DEFAULT false,
  second_person_detected boolean DEFAULT false,
  earbuds_detected boolean DEFAULT false,
  severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info','warn','flag','fatal')),
  ai_summary text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proctor_findings_lookup
  ON public.contest_proctor_findings (contest_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proctor_findings_severity
  ON public.contest_proctor_findings (contest_id, severity, created_at DESC)
  WHERE severity IN ('flag','fatal');

ALTER TABLE public.contest_proctor_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own proctor findings"
  ON public.contest_proctor_findings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage proctor findings"
  ON public.contest_proctor_findings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Screen-share AI audits
CREATE TABLE IF NOT EXISTS public.contest_screen_share_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  storage_path text,                       -- sampled frame path in contest-screen-frames
  surface_kind text,                       -- monitor | window | browser | unknown
  forbidden_apps text[] NOT NULL DEFAULT '{}',
  detected_windows jsonb NOT NULL DEFAULT '[]'::jsonb,
  severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info','warn','flag','fatal')),
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_screen_share_audits_lookup
  ON public.contest_screen_share_audits (contest_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screen_share_audits_severity
  ON public.contest_screen_share_audits (contest_id, severity, created_at DESC)
  WHERE severity IN ('flag','fatal');

ALTER TABLE public.contest_screen_share_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own screen share audits"
  ON public.contest_screen_share_audits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage screen share audits"
  ON public.contest_screen_share_audits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Storage bucket for sampled screen frames (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contest-screen-frames', 'contest-screen-frames', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own screen frames"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'contest-screen-frames'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own screen frames"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contest-screen-frames'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- 4. Keystroke biometric profile per session
CREATE TABLE IF NOT EXISTS public.contest_keystroke_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  -- Statistical fingerprint of the first ~60s of typing.
  -- All values are ms or ratios.
  mean_interval numeric NOT NULL,
  stddev_interval numeric NOT NULL,
  median_interval numeric NOT NULL,
  p90_interval numeric NOT NULL,
  burst_ratio numeric NOT NULL,            -- fraction of intervals < 50ms
  sample_size int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id)                       -- one baseline per session
);

ALTER TABLE public.contest_keystroke_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own keystroke profile"
  ON public.contest_keystroke_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own keystroke profile"
  ON public.contest_keystroke_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage keystroke profiles"
  ON public.contest_keystroke_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Rolling keystroke samples (compared to baseline)
CREATE TABLE IF NOT EXISTS public.contest_keystroke_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  mean_interval numeric NOT NULL,
  stddev_interval numeric NOT NULL,
  burst_ratio numeric NOT NULL,
  sample_size int NOT NULL,
  -- 0..1 cosine-style similarity to the baseline (1 = identical)
  similarity numeric,
  drift boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keystroke_samples_lookup
  ON public.contest_keystroke_samples (session_id, created_at DESC);

ALTER TABLE public.contest_keystroke_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own keystroke samples"
  ON public.contest_keystroke_samples
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own keystroke samples"
  ON public.contest_keystroke_samples
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage keystroke samples"
  ON public.contest_keystroke_samples
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Mouse movement metrics
CREATE TABLE IF NOT EXISTS public.contest_mouse_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  window_ms int NOT NULL,                  -- length of the sampling window
  move_count int NOT NULL,
  click_count int NOT NULL,
  total_distance_px numeric NOT NULL,
  path_entropy numeric NOT NULL,           -- 0..1, higher = more human-like jitter
  idle_ratio numeric NOT NULL,             -- fraction of window with no input
  is_bot_like boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mouse_metrics_lookup
  ON public.contest_mouse_metrics (session_id, created_at DESC);

ALTER TABLE public.contest_mouse_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own mouse metrics"
  ON public.contest_mouse_metrics
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own mouse metrics"
  ON public.contest_mouse_metrics
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage mouse metrics"
  ON public.contest_mouse_metrics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. RPC: record keystroke baseline (idempotent — one per session)
CREATE OR REPLACE FUNCTION public.contest_record_keystroke_profile(
  _contest_id uuid,
  _session_id uuid,
  _mean numeric,
  _stddev numeric,
  _median numeric,
  _p90 numeric,
  _burst_ratio numeric,
  _sample_size int
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
  INSERT INTO public.contest_keystroke_profiles
    (contest_id, user_id, session_id, mean_interval, stddev_interval,
     median_interval, p90_interval, burst_ratio, sample_size)
  VALUES (_contest_id, auth.uid(), _session_id, _mean, _stddev,
          _median, _p90, _burst_ratio, _sample_size)
  ON CONFLICT (session_id) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.contest_record_keystroke_profile(uuid,uuid,numeric,numeric,numeric,numeric,numeric,int) FROM public;
GRANT EXECUTE ON FUNCTION public.contest_record_keystroke_profile(uuid,uuid,numeric,numeric,numeric,numeric,numeric,int) TO authenticated;

-- 8. RPC: record a rolling keystroke sample (computes similarity server-side)
CREATE OR REPLACE FUNCTION public.contest_record_keystroke_sample(
  _contest_id uuid,
  _session_id uuid,
  _mean numeric,
  _stddev numeric,
  _burst_ratio numeric,
  _sample_size int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_baseline RECORD;
  v_sim numeric;
  v_drift boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT * INTO v_baseline
  FROM public.contest_keystroke_profiles
  WHERE session_id = _session_id;

  IF v_baseline IS NULL THEN
    INSERT INTO public.contest_keystroke_samples
      (contest_id, user_id, session_id, mean_interval, stddev_interval, burst_ratio, sample_size, similarity, drift)
    VALUES (_contest_id, auth.uid(), _session_id, _mean, _stddev, _burst_ratio, _sample_size, NULL, false);
    RETURN jsonb_build_object('similarity', NULL, 'drift', false, 'baseline', false);
  END IF;

  -- Cheap composite similarity: 1 - normalized weighted L1 distance across
  -- mean / stddev / burst_ratio. Tuned so a same-typist gets > 0.7,
  -- different-typist usually < 0.5.
  v_sim := GREATEST(0, 1 - (
    0.5 * LEAST(1, ABS(_mean - v_baseline.mean_interval) / NULLIF(v_baseline.mean_interval, 0))
  + 0.3 * LEAST(1, ABS(_stddev - v_baseline.stddev_interval) / GREATEST(v_baseline.stddev_interval, 1))
  + 0.2 * LEAST(1, ABS(_burst_ratio - v_baseline.burst_ratio))
  ));
  v_drift := v_sim < 0.55;

  INSERT INTO public.contest_keystroke_samples
    (contest_id, user_id, session_id, mean_interval, stddev_interval, burst_ratio, sample_size, similarity, drift)
  VALUES (_contest_id, auth.uid(), _session_id, _mean, _stddev, _burst_ratio, _sample_size, v_sim, v_drift);

  IF v_drift THEN
    PERFORM public.contest_log_violation(
      _contest_id,
      _session_id,
      'keystroke_drift',
      'flag',
      jsonb_build_object('similarity', v_sim, 'baseline_mean', v_baseline.mean_interval, 'sample_mean', _mean)
    );
  END IF;

  RETURN jsonb_build_object('similarity', v_sim, 'drift', v_drift, 'baseline', true);
END;
$$;

REVOKE ALL ON FUNCTION public.contest_record_keystroke_sample(uuid,uuid,numeric,numeric,numeric,int) FROM public;
GRANT EXECUTE ON FUNCTION public.contest_record_keystroke_sample(uuid,uuid,numeric,numeric,numeric,int) TO authenticated;

-- 9. RPC: record mouse metrics (auto-flags when bot-like)
CREATE OR REPLACE FUNCTION public.contest_record_mouse_metrics(
  _contest_id uuid,
  _session_id uuid,
  _window_ms int,
  _move_count int,
  _click_count int,
  _total_distance_px numeric,
  _path_entropy numeric,
  _idle_ratio numeric
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_bot boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  -- Heuristic: very low entropy AND many moves AND low idle = mechanical input
  v_bot := (_path_entropy < 0.2 AND _move_count > 30 AND _idle_ratio < 0.2);
  INSERT INTO public.contest_mouse_metrics
    (contest_id, user_id, session_id, window_ms, move_count, click_count,
     total_distance_px, path_entropy, idle_ratio, is_bot_like)
  VALUES (_contest_id, auth.uid(), _session_id, _window_ms, _move_count, _click_count,
          _total_distance_px, _path_entropy, _idle_ratio, v_bot)
  RETURNING id INTO v_id;

  IF v_bot THEN
    PERFORM public.contest_log_violation(
      _contest_id, _session_id, 'mouse_bot_like', 'warn',
      jsonb_build_object('entropy', _path_entropy, 'moves', _move_count, 'idle_ratio', _idle_ratio)
    );
  END IF;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.contest_record_mouse_metrics(uuid,uuid,int,int,int,numeric,numeric,numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.contest_record_mouse_metrics(uuid,uuid,int,int,int,numeric,numeric,numeric) TO authenticated;

-- 10. Notify admins on flag/fatal screen-share audit
CREATE OR REPLACE FUNCTION public.notify_admins_on_screen_audit_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
BEGIN
  IF NEW.severity NOT IN ('flag','fatal') THEN
    RETURN NEW;
  END IF;
  FOR admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      admin_id,
      'contest_screen_audit_flag',
      'Forbidden app on screen share',
      COALESCE(NEW.ai_summary, 'Suspicious window detected on contestant screen.'),
      jsonb_build_object(
        'contest_id', NEW.contest_id,
        'user_id', NEW.user_id,
        'session_id', NEW.session_id,
        'forbidden_apps', NEW.forbidden_apps,
        'surface_kind', NEW.surface_kind,
        'storage_path', NEW.storage_path,
        'severity', NEW.severity
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_screen_audit_flag ON public.contest_screen_share_audits;
CREATE TRIGGER trg_notify_screen_audit_flag
  AFTER INSERT ON public.contest_screen_share_audits
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_screen_audit_flag();

-- 11. Notify admins on flag/fatal proctor finding
CREATE OR REPLACE FUNCTION public.notify_admins_on_proctor_finding_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
BEGIN
  IF NEW.severity NOT IN ('flag','fatal') THEN
    RETURN NEW;
  END IF;
  FOR admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      admin_id,
      'contest_proctor_finding_flag',
      'Webcam finding flagged',
      COALESCE(NEW.ai_summary, 'Suspicious activity detected in webcam snapshot.'),
      jsonb_build_object(
        'contest_id', NEW.contest_id,
        'user_id', NEW.user_id,
        'session_id', NEW.session_id,
        'face_count', NEW.face_count,
        'gaze_direction', NEW.gaze_direction,
        'phone_detected', NEW.phone_detected,
        'second_screen_detected', NEW.second_screen_detected,
        'second_person_detected', NEW.second_person_detected,
        'earbuds_detected', NEW.earbuds_detected,
        'severity', NEW.severity
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_proctor_finding_flag ON public.contest_proctor_findings;
CREATE TRIGGER trg_notify_proctor_finding_flag
  AFTER INSERT ON public.contest_proctor_findings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_proctor_finding_flag();
