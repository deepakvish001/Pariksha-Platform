-- 1) Platform settings (feature flags + site config)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings public read" ON public.platform_settings
  FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.platform_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 2) Daily challenge schedule
CREATE TABLE IF NOT EXISTS public.admin_daily_challenge_schedule (
  challenge_date date PRIMARY KEY,
  problem_slug text NOT NULL REFERENCES public.coding_problems(slug) ON DELETE CASCADE,
  set_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_daily_challenge_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dcs public read" ON public.admin_daily_challenge_schedule
  FOR SELECT USING (true);
CREATE POLICY "dcs admin write" ON public.admin_daily_challenge_schedule
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3) Suspensions
ALTER TABLE public.user_profiles_extended
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_reason text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- 4) Content reports
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_by uuid,
  resolved_at timestamptz
);
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report own insert" ON public.content_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "report admin read" ON public.content_reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "report admin update" ON public.content_reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "report admin delete" ON public.content_reports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status, created_at DESC);

-- 5) Admin RPCs

-- 5a) List users (joined view)
CREATE OR REPLACE FUNCTION public.admin_list_users(
  _search text DEFAULT NULL,
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  username text,
  avatar_url text,
  joined_at timestamptz,
  last_active_at timestamptz,
  total_xp integer,
  current_level integer,
  is_suspended boolean,
  roles text[]
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      u.id AS user_id,
      u.email::text AS email,
      u.created_at AS joined_at,
      p.full_name,
      p.avatar_url,
      upe.username,
      upe.total_xp,
      upe.current_level,
      COALESCE(upe.is_suspended, false) AS is_suspended,
      (SELECT MAX(created_at) FROM public.user_activity_log a WHERE a.user_id = u.id) AS last_active_at,
      ARRAY(SELECT r.role::text FROM public.user_roles r WHERE r.user_id = u.id) AS roles
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    LEFT JOIN public.user_profiles_extended upe ON upe.user_id = u.id
  )
  SELECT * FROM base
  WHERE _search IS NULL
     OR email ILIKE '%'||_search||'%'
     OR full_name ILIKE '%'||_search||'%'
     OR username ILIKE '%'||_search||'%'
  ORDER BY joined_at DESC
  LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0);
END;$$;

-- 5b) Grant/revoke role
CREATE OR REPLACE FUNCTION public.admin_grant_role(_user_id uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'grant_role','user', _user_id::text, jsonb_build_object('role',_role));
END;$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(_user_id uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.user_roles WHERE user_id=_user_id AND role=_role;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'revoke_role','user', _user_id::text, jsonb_build_object('role',_role));
END;$$;

-- 5c) Suspend / unsuspend
CREATE OR REPLACE FUNCTION public.admin_suspend_user(_user_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.user_profiles_extended(user_id, is_suspended, suspended_reason, suspended_at)
  VALUES (_user_id, true, _reason, now())
  ON CONFLICT (user_id) DO UPDATE SET
    is_suspended = true,
    suspended_reason = EXCLUDED.suspended_reason,
    suspended_at = now();
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'suspend_user','user', _user_id::text, jsonb_build_object('reason',_reason));
END;$$;

CREATE OR REPLACE FUNCTION public.admin_unsuspend_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.user_profiles_extended
  SET is_suspended = false, suspended_reason = NULL, suspended_at = NULL
  WHERE user_id=_user_id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'unsuspend_user','user', _user_id::text, '{}'::jsonb);
END;$$;

-- 5d) Set platform setting
CREATE OR REPLACE FUNCTION public.admin_set_setting(_key text, _value jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.platform_settings(key, value, updated_by, updated_at)
  VALUES (_key, _value, auth.uid(), now())
  ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=auth.uid(), updated_at=now();
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'set_setting','platform_setting', _key, _value);
END;$$;

-- 5e) Broadcast notification
CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(
  _audience jsonb,
  _title text,
  _message text,
  _data jsonb DEFAULT '{}'::jsonb
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inserted_count int := 0;
  audience_kind text := COALESCE(_audience->>'kind','all');
  min_level int := COALESCE((_audience->>'min_level')::int, 0);
  target_role text := _audience->>'role';
  target_user uuid := NULLIF(_audience->>'user_id','')::uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;

  WITH targets AS (
    SELECT u.id AS uid
    FROM auth.users u
    LEFT JOIN public.user_profiles_extended upe ON upe.user_id = u.id
    WHERE
      CASE audience_kind
        WHEN 'all' THEN true
        WHEN 'level' THEN COALESCE(upe.current_level,1) >= min_level
        WHEN 'role' THEN EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=u.id AND r.role::text=target_role)
        WHEN 'user' THEN u.id = target_user
        ELSE false
      END
      AND COALESCE(upe.is_suspended, false) = false
    LIMIT 50000
  ),
  ins AS (
    INSERT INTO public.notifications(user_id, type, title, message, data)
    SELECT uid, 'broadcast', _title, _message, _data FROM targets
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM ins;

  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'broadcast','notification', NULL,
          jsonb_build_object('audience',_audience,'title',_title,'count',inserted_count));

  RETURN inserted_count;
END;$$;

-- 5f) Schedule daily challenge
CREATE OR REPLACE FUNCTION public.admin_schedule_daily_challenge(_date date, _slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.admin_daily_challenge_schedule(challenge_date, problem_slug, set_by)
  VALUES (_date, _slug, auth.uid())
  ON CONFLICT (challenge_date) DO UPDATE SET problem_slug=EXCLUDED.problem_slug, set_by=auth.uid(), created_at=now();
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'schedule_daily','coding_problem', _slug, jsonb_build_object('date',_date));
END;$$;

-- 5g) Dashboard KPIs
CREATE OR REPLACE FUNCTION public.admin_dashboard_kpis()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'dau', (SELECT COUNT(DISTINCT user_id) FROM public.user_activity_log WHERE created_at >= now() - interval '24 hours'),
    'wau', (SELECT COUNT(DISTINCT user_id) FROM public.user_activity_log WHERE created_at >= now() - interval '7 days'),
    'submissions_total', (SELECT COUNT(*) FROM public.code_submissions WHERE is_submission=true),
    'accepted_today', (SELECT COUNT(*) FROM public.code_submissions WHERE verdict='Accepted' AND created_at >= date_trunc('day', now())),
    'ai_content_total', (SELECT COUNT(*) FROM public.ai_generated_content),
    'open_reports', (SELECT COUNT(*) FROM public.content_reports WHERE status='open'),
    'published_problems', (SELECT COUNT(*) FROM public.coding_problems WHERE is_published=true),
    'draft_problems', (SELECT COUNT(*) FROM public.coding_problems WHERE is_published=false),
    'signups_7d', (SELECT COUNT(*) FROM auth.users WHERE created_at >= now() - interval '7 days')
  ) INTO result;

  RETURN result;
END;$$;

-- 5h) Trend data for charts
CREATE OR REPLACE FUNCTION public.admin_trend_submissions(_days int DEFAULT 30)
RETURNS TABLE (day date, total int, accepted int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  SELECT
    d::date AS day,
    COALESCE(COUNT(s.id) FILTER (WHERE s.is_submission=true),0)::int AS total,
    COALESCE(COUNT(s.id) FILTER (WHERE s.is_submission=true AND s.verdict='Accepted'),0)::int AS accepted
  FROM generate_series(now()::date - (_days-1), now()::date, interval '1 day') d
  LEFT JOIN public.code_submissions s ON s.created_at::date = d::date
  GROUP BY d
  ORDER BY d;
END;$$;

CREATE OR REPLACE FUNCTION public.admin_trend_signups(_days int DEFAULT 30)
RETURNS TABLE (day date, signups int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  SELECT
    d::date AS day,
    COALESCE(COUNT(u.id),0)::int AS signups
  FROM generate_series(now()::date - (_days-1), now()::date, interval '1 day') d
  LEFT JOIN auth.users u ON u.created_at::date = d::date
  GROUP BY d
  ORDER BY d;
END;$$;

-- 5i) Resolve a report
CREATE OR REPLACE FUNCTION public.admin_resolve_report(_id uuid, _new_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _new_status NOT IN ('resolved','dismissed','open') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.content_reports
  SET status=_new_status, resolved_by=auth.uid(), resolved_at=now()
  WHERE id=_id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'resolve_report','content_report', _id::text, jsonb_build_object('status',_new_status));
END;$$;

-- 5j) AI content moderation: force private / delete
CREATE OR REPLACE FUNCTION public.admin_set_ai_content_visibility(_id uuid, _is_public boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.ai_generated_content SET is_public = _is_public WHERE id = _id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'mod_ai_visibility','ai_content', _id::text, jsonb_build_object('is_public',_is_public));
END;$$;

CREATE OR REPLACE FUNCTION public.admin_delete_ai_content(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.ai_generated_content WHERE id = _id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'mod_ai_delete','ai_content', _id::text, '{}'::jsonb);
END;$$;
