
-- 1) Revoke EXECUTE from PUBLIC/anon/authenticated on internal trigger funcs.
-- Triggers run independent of EXECUTE ACLs, so this is safe.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.handle_new_user()',
    'public.handle_code_submission_aftermath()',
    'public.log_quiz_activity()',
    'public.log_xp_activity()',
    'public.log_topic_activity()',
    'public.log_achievement_activity()',
    'public.log_outreach_activity()',
    'public.log_resume_download_activity()',
    'public.notify_on_follow()',
    'public.notify_on_rare_achievement()',
    'public.send_notification_email()',
    'public.update_content_likes_count()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END LOOP;
END$$;

-- 2) Gamification rule history
CREATE TABLE IF NOT EXISTS public.gamification_rule_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  old_value jsonb,
  new_value jsonb NOT NULL,
  note text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grh_key_time ON public.gamification_rule_history (rule_key, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_grh_time ON public.gamification_rule_history (changed_at DESC);

ALTER TABLE public.gamification_rule_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read rule history" ON public.gamification_rule_history;
CREATE POLICY "Admins read rule history"
  ON public.gamification_rule_history FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert rule history" ON public.gamification_rule_history;
CREATE POLICY "Admins insert rule history"
  ON public.gamification_rule_history FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) Admin RPC: set rule + record history
CREATE OR REPLACE FUNCTION public.admin_set_gamification_rule(
  _key text, _value jsonb, _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _full_key text;
  _old jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  _full_key := CASE WHEN _key LIKE 'gamification.%' THEN _key ELSE 'gamification.' || _key END;

  SELECT value INTO _old FROM public.platform_settings WHERE key = _full_key;

  INSERT INTO public.platform_settings(key, value, updated_by, updated_at)
  VALUES (_full_key, _value, auth.uid(), now())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_by = auth.uid(),
      updated_at = now();

  INSERT INTO public.gamification_rule_history(rule_key, old_value, new_value, note, changed_by)
  VALUES (_full_key, _old, _value, _note, auth.uid());

  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(), 'gamification.rule_set', 'platform_setting', _full_key,
          jsonb_build_object('old', _old, 'new', _value, 'note', _note));
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_set_gamification_rule(text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_gamification_rule(text, jsonb, text) TO authenticated;

-- 4) Admin RPC: list history
CREATE OR REPLACE FUNCTION public.admin_gamification_history(_key text DEFAULT NULL, _limit int DEFAULT 50)
RETURNS TABLE (
  id uuid, rule_key text, old_value jsonb, new_value jsonb, note text,
  changed_by uuid, changed_at timestamptz, actor_name text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT h.id, h.rule_key, h.old_value, h.new_value, h.note,
         h.changed_by, h.changed_at,
         COALESCE(p.full_name, '')::text AS actor_name
  FROM public.gamification_rule_history h
  LEFT JOIN public.profiles p ON p.user_id = h.changed_by
  WHERE _key IS NULL OR h.rule_key = _key OR h.rule_key = 'gamification.' || _key
  ORDER BY h.changed_at DESC
  LIMIT GREATEST(_limit, 1);
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_gamification_history(text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_gamification_history(text, int) TO authenticated;

-- 5) Admin RPC: search users (used by Achievements grant/revoke picker)
CREATE OR REPLACE FUNCTION public.admin_search_users(_q text, _limit int DEFAULT 20)
RETURNS TABLE (user_id uuid, full_name text, username text, avatar_url text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT pe.user_id, p.full_name, pe.username, p.avatar_url
  FROM public.user_profiles_extended pe
  LEFT JOIN public.profiles p ON p.user_id = pe.user_id
  WHERE _q IS NULL OR _q = ''
     OR pe.username ILIKE '%' || _q || '%'
     OR p.full_name ILIKE '%' || _q || '%'
     OR pe.user_id::text = _q
  ORDER BY p.full_name NULLS LAST
  LIMIT GREATEST(_limit, 1);
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_search_users(text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, int) TO authenticated;
