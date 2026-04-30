
-- Filtered audit log
CREATE OR REPLACE FUNCTION public.admin_list_audit_log(
  _actor uuid DEFAULT NULL,
  _action text DEFAULT NULL,
  _entity_type text DEFAULT NULL,
  _from timestamptz DEFAULT NULL,
  _to timestamptz DEFAULT NULL,
  _limit int DEFAULT 100,
  _offset int DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  actor_id uuid,
  actor_name text,
  action text,
  entity_type text,
  entity_slug text,
  diff jsonb,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT a.*, COUNT(*) OVER() AS total
    FROM public.admin_audit_log a
    WHERE (_actor IS NULL OR a.actor_id = _actor)
      AND (_action IS NULL OR a.action ILIKE '%' || _action || '%')
      AND (_entity_type IS NULL OR a.entity_type = _entity_type)
      AND (_from IS NULL OR a.created_at >= _from)
      AND (_to IS NULL OR a.created_at <= _to)
    ORDER BY a.created_at DESC
    LIMIT GREATEST(_limit, 1) OFFSET GREATEST(_offset, 0)
  )
  SELECT
    f.id, f.actor_id,
    COALESCE(p.full_name, upe.username, 'Unknown')::text AS actor_name,
    f.action, f.entity_type, f.entity_slug, f.diff, f.created_at,
    f.total
  FROM filtered f
  LEFT JOIN public.profiles p ON p.user_id = f.actor_id
  LEFT JOIN public.user_profiles_extended upe ON upe.user_id = f.actor_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_audit_log(uuid,text,text,timestamptz,timestamptz,int,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_audit_log(uuid,text,text,timestamptz,timestamptz,int,int) TO authenticated;

-- Export users
CREATE OR REPLACE FUNCTION public.admin_export_users(_limit int DEFAULT 5000)
RETURNS TABLE(
  user_id uuid, email text, full_name text, username text,
  total_xp int, current_level int, joined_at timestamptz,
  last_active_at timestamptz, is_suspended boolean, roles text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    p.full_name,
    upe.username,
    COALESCE(upe.total_xp, 0),
    COALESCE(upe.current_level, 1),
    u.created_at,
    u.last_sign_in_at,
    COALESCE(upe.is_suspended, false),
    COALESCE(string_agg(ur.role::text, ',' ORDER BY ur.role), '')
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.user_profiles_extended upe ON upe.user_id = u.id
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  GROUP BY u.id, u.email, p.full_name, upe.username, upe.total_xp,
           upe.current_level, u.created_at, u.last_sign_in_at, upe.is_suspended
  ORDER BY u.created_at DESC
  LIMIT GREATEST(_limit, 1);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_export_users(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_export_users(int) TO authenticated;

-- Export submissions
CREATE OR REPLACE FUNCTION public.admin_export_submissions(_days int DEFAULT 30, _limit int DEFAULT 10000)
RETURNS TABLE(
  id uuid, user_id uuid, problem_slug text, language text,
  verdict text, runtime_ms int, memory_kb int,
  is_submission boolean, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT s.id, s.user_id, s.problem_slug, s.language, s.verdict,
         s.runtime_ms, s.memory_kb, s.is_submission, s.created_at
  FROM public.code_submissions s
  WHERE s.created_at >= now() - (_days || ' days')::interval
  ORDER BY s.created_at DESC
  LIMIT GREATEST(_limit, 1);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_export_submissions(int,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_export_submissions(int,int) TO authenticated;

-- Distinct entity types for audit filter
CREATE OR REPLACE FUNCTION public.admin_audit_entity_types()
RETURNS TABLE(entity_type text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
  SELECT DISTINCT a.entity_type FROM public.admin_audit_log a
  WHERE a.entity_type IS NOT NULL
  ORDER BY 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_audit_entity_types() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_audit_entity_types() TO authenticated;
