
CREATE OR REPLACE FUNCTION public.admin_system_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'users_total', (SELECT count(*) FROM auth.users),
    'users_24h', (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '24 hours'),
    'problems_total', (SELECT count(*) FROM public.coding_problems),
    'submissions_total', (SELECT count(*) FROM public.coding_submissions),
    'submissions_24h', (SELECT count(*) FROM public.coding_submissions WHERE created_at > now() - interval '24 hours'),
    'ai_content_total', (SELECT count(*) FROM public.ai_generated_content),
    'audit_24h', (SELECT count(*) FROM public.admin_audit_log WHERE created_at > now() - interval '24 hours'),
    'reports_open', (SELECT count(*) FROM public.content_reports WHERE status = 'open'),
    'now', now()
  )
  INTO result;

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_system_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_system_health() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  command text,
  active boolean,
  last_run_started_at timestamptz,
  last_status text,
  last_return_message text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    j.jobid,
    j.jobname,
    j.schedule,
    j.command,
    j.active,
    r.start_time AS last_run_started_at,
    r.status AS last_status,
    r.return_message AS last_return_message
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT start_time, status, return_message
    FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY d.start_time DESC
    LIMIT 1
  ) r ON true
  ORDER BY j.jobname;
EXCEPTION WHEN undefined_table OR invalid_schema_name THEN
  RETURN;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_cron_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_cron_jobs() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_storage_stats()
RETURNS TABLE (bucket_id text, object_count bigint, total_bytes bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    o.bucket_id::text,
    count(*)::bigint AS object_count,
    COALESCE(sum((o.metadata->>'size')::bigint), 0)::bigint AS total_bytes
  FROM storage.objects o
  GROUP BY o.bucket_id
  ORDER BY o.bucket_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_storage_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_storage_stats() TO authenticated;
