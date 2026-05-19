CREATE OR REPLACE FUNCTION public.increment_share_view_count(p_share_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.student_share_links
  SET view_count = view_count + 1,
      last_viewed_at = now()
  WHERE id = p_share_id;
$$;

REVOKE ALL ON FUNCTION public.increment_share_view_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_share_view_count(uuid) TO service_role;