CREATE OR REPLACE FUNCTION public.preview_invite_source_backfill()
RETURNS TABLE(inferred_source text, count bigint, sample jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can preview the invite source backfill'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH ranked AS (
    SELECT
      public._infer_invite_source(ai.external_id, ai.name, ai.email)::text AS inferred,
      ai.id, ai.email, ai.name, ai.external_id, ai.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY public._infer_invite_source(ai.external_id, ai.name, ai.email)
        ORDER BY ai.created_at DESC
      ) AS rn
    FROM public.assessment_invites ai
    WHERE ai.source IS NULL
  ),
  counts AS (
    SELECT inferred, COUNT(*)::bigint AS c FROM ranked GROUP BY inferred
  ),
  samples AS (
    SELECT inferred,
           COALESCE(jsonb_agg(jsonb_build_object(
             'id', id, 'email', email, 'name', name, 'external_id', external_id
           ) ORDER BY created_at DESC), '[]'::jsonb) AS s
      FROM ranked
     WHERE rn <= 5
     GROUP BY inferred
  )
  SELECT c.inferred, c.c, COALESCE(s.s, '[]'::jsonb)
    FROM counts c
    LEFT JOIN samples s USING (inferred)
   ORDER BY c.c DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.preview_invite_source_backfill() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_invite_source_backfill() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_run_invite_source_backfill()
RETURNS TABLE(
  run_id        uuid,
  rows_scanned  bigint,
  rows_updated  bigint,
  by_source     jsonb,
  duration_ms   integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can run the invite source backfill'
      USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.backfill_assessment_invite_sources();
END;
$$;
REVOKE ALL ON FUNCTION public.admin_run_invite_source_backfill() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_run_invite_source_backfill() TO authenticated;