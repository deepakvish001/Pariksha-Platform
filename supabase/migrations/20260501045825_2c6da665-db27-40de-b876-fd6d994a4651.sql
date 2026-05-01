CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT NULL::text, _limit integer DEFAULT 50, _offset integer DEFAULT 0)
 RETURNS TABLE(user_id uuid, email text, full_name text, username text, avatar_url text, joined_at timestamp with time zone, last_active_at timestamp with time zone, total_xp integer, current_level integer, is_suspended boolean, roles text[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      u.id AS b_user_id,
      u.email::text AS b_email,
      u.created_at AS b_joined_at,
      p.full_name AS b_full_name,
      p.avatar_url AS b_avatar_url,
      upe.username AS b_username,
      upe.total_xp AS b_total_xp,
      upe.current_level AS b_current_level,
      COALESCE(upe.is_suspended, false) AS b_is_suspended,
      (SELECT MAX(a.created_at) FROM public.user_activity_log a WHERE a.user_id = u.id) AS b_last_active_at,
      ARRAY(SELECT r.role::text FROM public.user_roles r WHERE r.user_id = u.id) AS b_roles
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    LEFT JOIN public.user_profiles_extended upe ON upe.user_id = u.id
  )
  SELECT
    b.b_user_id,
    b.b_email,
    b.b_full_name,
    b.b_username,
    b.b_avatar_url,
    b.b_joined_at,
    b.b_last_active_at,
    b.b_total_xp,
    b.b_current_level,
    b.b_is_suspended,
    b.b_roles
  FROM base b
  WHERE _search IS NULL
     OR b.b_email ILIKE '%'||_search||'%'
     OR b.b_full_name ILIKE '%'||_search||'%'
     OR b.b_username ILIKE '%'||_search||'%'
  ORDER BY b.b_joined_at DESC
  LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0);
END;
$function$;