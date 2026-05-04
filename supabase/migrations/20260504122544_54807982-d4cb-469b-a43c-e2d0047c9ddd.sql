-- 1) Retention config columns
ALTER TABLE public.sideeye_notification_settings
  ADD COLUMN IF NOT EXISTS retention_days_audit integer NOT NULL DEFAULT 30
    CHECK (retention_days_audit BETWEEN 1 AND 365),
  ADD COLUMN IF NOT EXISTS retention_days_frames integer NOT NULL DEFAULT 30
    CHECK (retention_days_frames BETWEEN 1 AND 365),
  ADD COLUMN IF NOT EXISTS retention_days_recordings integer NOT NULL DEFAULT 30
    CHECK (retention_days_recordings BETWEEN 1 AND 365);

-- 2) Purge function (deletes DB rows + storage objects)
CREATE OR REPLACE FUNCTION public.sideeye_purge_old_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg RECORD;
  cutoff_audit timestamptz;
  cutoff_frames timestamptz;
  cutoff_recs timestamptz;
  deleted_audit int := 0;
  deleted_frames int := 0;
  deleted_recordings int := 0;
  deleted_objects int := 0;
BEGIN
  SELECT retention_days_audit, retention_days_frames, retention_days_recordings
  INTO cfg
  FROM public.sideeye_notification_settings
  WHERE singleton = true
  LIMIT 1;

  IF cfg IS NULL THEN
    cutoff_audit := now() - interval '30 days';
    cutoff_frames := now() - interval '30 days';
    cutoff_recs := now() - interval '30 days';
  ELSE
    cutoff_audit := now() - make_interval(days => cfg.retention_days_audit);
    cutoff_frames := now() - make_interval(days => cfg.retention_days_frames);
    cutoff_recs := now() - make_interval(days => cfg.retention_days_recordings);
  END IF;

  -- Frame storage objects to delete (by storage_path). Wrapped in DO/EXCEPTION
  -- so a missing object doesn't abort the whole purge.
  WITH old_frames AS (
    SELECT storage_path FROM public.contest_side_camera_frames
    WHERE captured_at < cutoff_frames AND storage_path IS NOT NULL
  )
  DELETE FROM storage.objects o
  USING old_frames f
  WHERE o.bucket_id = 'contest-side-camera' AND o.name = f.storage_path;
  GET DIAGNOSTICS deleted_objects = ROW_COUNT;

  -- Recording storage objects
  WITH old_recs AS (
    SELECT storage_path FROM public.contest_side_camera_recordings
    WHERE started_at < cutoff_recs AND storage_path IS NOT NULL
  )
  DELETE FROM storage.objects o
  USING old_recs r
  WHERE o.bucket_id = 'contest-side-camera' AND o.name = r.storage_path;

  -- Then delete the DB rows
  DELETE FROM public.contest_side_camera_frames
  WHERE captured_at < cutoff_frames;
  GET DIAGNOSTICS deleted_frames = ROW_COUNT;

  DELETE FROM public.contest_side_camera_recordings
  WHERE started_at < cutoff_recs;
  GET DIAGNOSTICS deleted_recordings = ROW_COUNT;

  DELETE FROM public.contest_side_camera_audit_logs
  WHERE created_at < cutoff_audit;
  GET DIAGNOSTICS deleted_audit = ROW_COUNT;

  RETURN jsonb_build_object(
    'deleted_audit', deleted_audit,
    'deleted_frames', deleted_frames,
    'deleted_recordings', deleted_recordings,
    'deleted_storage_objects', deleted_objects,
    'cutoff_audit', cutoff_audit,
    'cutoff_frames', cutoff_frames,
    'cutoff_recordings', cutoff_recs,
    'ran_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sideeye_purge_old_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sideeye_purge_old_data() TO service_role;

-- 3) Admin-callable wrapper (RLS-style guard)
CREATE OR REPLACE FUNCTION public.admin_run_sideeye_purge()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN public.sideeye_purge_old_data();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_run_sideeye_purge() TO authenticated;

-- 4) Real-time on audit logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'contest_side_camera_audit_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_side_camera_audit_logs';
  END IF;
END $$;

ALTER TABLE public.contest_side_camera_audit_logs REPLICA IDENTITY FULL;