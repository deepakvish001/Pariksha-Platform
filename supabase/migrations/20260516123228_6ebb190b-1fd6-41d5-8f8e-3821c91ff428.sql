-- Guarded heuristic backfill for assessment_invites.source
-- Only touches rows where source IS NULL. Idempotent and safe to re-run.

CREATE OR REPLACE FUNCTION public.backfill_assessment_invite_sources()
RETURNS TABLE(updated_count bigint, by_source jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint := 0;
  v_breakdown jsonb;
BEGIN
  -- Heuristic precedence (highest specificity first):
  --   1. external_id starts with 'api_' / 'api:'           -> 'api'
  --   2. external_id present (any other shape)             -> 'bulk_upload'
  --   3. name IS NULL  (link-style invite, no recipient)   -> 'link'
  --   4. name present, email present                       -> 'email'
  --   5. fallback                                          -> 'manual'
  WITH updated AS (
    UPDATE public.assessment_invites AS ai
    SET source = CASE
      WHEN ai.external_id IS NOT NULL
           AND (ai.external_id ILIKE 'api\_%' ESCAPE '\' OR ai.external_id ILIKE 'api:%')
        THEN 'api'::invite_source
      WHEN ai.external_id IS NOT NULL
        THEN 'bulk_upload'::invite_source
      WHEN ai.name IS NULL
        THEN 'link'::invite_source
      WHEN ai.name IS NOT NULL AND ai.email IS NOT NULL
        THEN 'email'::invite_source
      ELSE 'manual'::invite_source
    END,
    updated_at = now()
    WHERE ai.source IS NULL
    RETURNING ai.source
  )
  SELECT COUNT(*)::bigint,
         COALESCE(jsonb_object_agg(src, cnt), '{}'::jsonb)
    INTO v_total, v_breakdown
  FROM (
    SELECT source::text AS src, COUNT(*)::bigint AS cnt
    FROM updated
    GROUP BY source
  ) s;

  RETURN QUERY SELECT v_total, v_breakdown;
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_assessment_invite_sources() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_assessment_invite_sources() TO service_role;

-- Execute once now (no-op if no NULL rows exist).
SELECT public.backfill_assessment_invite_sources();