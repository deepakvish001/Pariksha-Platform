REVOKE EXECUTE ON FUNCTION public.admin_save_problem(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_problem(jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_get_full_problem(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_full_problem(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;