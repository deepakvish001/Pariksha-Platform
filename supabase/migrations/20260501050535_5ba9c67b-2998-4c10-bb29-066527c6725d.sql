-- Admin-only: read role change history with actor and target details
CREATE OR REPLACE FUNCTION public.admin_role_audit(
  _user_id uuid DEFAULT NULL,
  _action text DEFAULT NULL,
  _limit int DEFAULT 200
)
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  action text,
  actor_id uuid,
  actor_name text,
  actor_email text,
  target_user_id uuid,
  target_name text,
  target_email text,
  role text,
  diff jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.created_at,
    l.action,
    l.actor_id,
    pa.full_name AS actor_name,
    ua.email::text AS actor_email,
    NULLIF(l.entity_slug,'')::uuid AS target_user_id,
    pt.full_name AS target_name,
    ut.email::text AS target_email,
    (l.diff->>'role')::text AS role,
    l.diff
  FROM public.admin_audit_log l
  LEFT JOIN auth.users ua ON ua.id = l.actor_id
  LEFT JOIN public.profiles pa ON pa.user_id = l.actor_id
  LEFT JOIN auth.users ut ON ut.id::text = l.entity_slug
  LEFT JOIN public.profiles pt ON pt.user_id = ut.id
  WHERE l.action IN ('grant_role','revoke_role')
    AND (_user_id IS NULL OR l.entity_slug = _user_id::text)
    AND (_action  IS NULL OR l.action = _action)
  ORDER BY l.created_at DESC
  LIMIT GREATEST(_limit, 1);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_role_audit(uuid, text, int) FROM anon;
GRANT  EXECUTE ON FUNCTION public.admin_role_audit(uuid, text, int) TO authenticated;

-- Admin-only: list RLS policies on a public schema table for the RLS Tester page
CREATE OR REPLACE FUNCTION public.admin_list_table_policies(_table text)
RETURNS TABLE(
  policy_name text,
  command text,
  roles text[],
  using_expr text,
  check_expr text,
  permissive text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.policyname::text,
    p.cmd::text,
    p.roles::text[],
    p.qual::text,
    p.with_check::text,
    p.permissive::text
  FROM pg_policies p
  WHERE p.schemaname = 'public' AND p.tablename = _table
  ORDER BY p.policyname;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_table_policies(text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_table_policies(text) TO authenticated;

-- Admin-only: list public schema table names for the tester picker
CREATE OR REPLACE FUNCTION public.admin_list_public_tables()
RETURNS TABLE(table_name text, rls_enabled boolean, policy_count int)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    c.relname::text,
    c.relrowsecurity,
    (SELECT COUNT(*)::int FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname)
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY c.relname;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_public_tables() FROM anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_public_tables() TO authenticated;