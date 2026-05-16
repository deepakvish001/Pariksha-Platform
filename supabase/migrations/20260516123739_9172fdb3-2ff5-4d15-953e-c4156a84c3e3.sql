CREATE TABLE IF NOT EXISTS public.invite_source_backfill_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  duration_ms     integer,
  rows_scanned    bigint NOT NULL DEFAULT 0,
  rows_updated    bigint NOT NULL DEFAULT 0,
  by_source       jsonb  NOT NULL DEFAULT '{}'::jsonb,
  status          text   NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','error')),
  error_message   text,
  triggered_by    uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_source_backfill_runs_started
  ON public.invite_source_backfill_runs(started_at DESC);

ALTER TABLE public.invite_source_backfill_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view backfill runs" ON public.invite_source_backfill_runs;
CREATE POLICY "Admins can view backfill runs"
  ON public.invite_source_backfill_runs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Drop old signature (return type changed) before recreating.
DROP FUNCTION IF EXISTS public.backfill_assessment_invite_sources();

CREATE FUNCTION public.backfill_assessment_invite_sources()
RETURNS TABLE(
  run_id        uuid,
  rows_scanned  bigint,
  rows_updated  bigint,
  by_source     jsonb,
  duration_ms   integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_run_id      uuid := gen_random_uuid();
  v_started_at  timestamptz := clock_timestamp();
  v_scanned     bigint := 0;
  v_updated     bigint := 0;
  v_breakdown   jsonb  := '{}'::jsonb;
  v_duration_ms integer;
  v_actor       uuid;
BEGIN
  BEGIN v_actor := auth.uid(); EXCEPTION WHEN OTHERS THEN v_actor := NULL; END;

  INSERT INTO public.invite_source_backfill_runs (id, started_at, status, triggered_by)
  VALUES (v_run_id, v_started_at, 'ok', v_actor);

  SELECT COUNT(*) INTO v_scanned
    FROM public.assessment_invites WHERE source IS NULL;

  BEGIN
    WITH updated AS (
      UPDATE public.assessment_invites AS ai
         SET source     = public._infer_invite_source(ai.external_id, ai.name, ai.email),
             updated_at = now()
       WHERE ai.source IS NULL
       RETURNING ai.source
    )
    SELECT COUNT(*)::bigint, COALESCE(jsonb_object_agg(src, cnt), '{}'::jsonb)
      INTO v_updated, v_breakdown
    FROM (SELECT source::text src, COUNT(*)::bigint cnt FROM updated GROUP BY source) s;

    v_duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at))::numeric * 1000;

    UPDATE public.invite_source_backfill_runs
       SET finished_at  = clock_timestamp(),
           duration_ms  = v_duration_ms,
           rows_scanned = v_scanned,
           rows_updated = v_updated,
           by_source    = v_breakdown,
           status       = 'ok'
     WHERE id = v_run_id;

    RAISE NOTICE '[backfill_assessment_invite_sources] run=% scanned=% updated=% breakdown=% duration_ms=%',
      v_run_id, v_scanned, v_updated, v_breakdown, v_duration_ms;

    RETURN QUERY SELECT v_run_id, v_scanned, v_updated, v_breakdown, v_duration_ms;
  EXCEPTION WHEN OTHERS THEN
    v_duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at))::numeric * 1000;
    UPDATE public.invite_source_backfill_runs
       SET finished_at   = clock_timestamp(),
           duration_ms   = v_duration_ms,
           rows_scanned  = v_scanned,
           rows_updated  = 0,
           status        = 'error',
           error_message = SQLERRM
     WHERE id = v_run_id;
    RAISE WARNING '[backfill_assessment_invite_sources] run=% FAILED scanned=% error=%',
      v_run_id, v_scanned, SQLERRM;
    RAISE;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_assessment_invite_sources() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_assessment_invite_sources() TO service_role;

CREATE OR REPLACE FUNCTION public.get_invite_source_backfill_runs(p_limit int DEFAULT 50)
RETURNS SETOF public.invite_source_backfill_runs
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT * FROM public.invite_source_backfill_runs
   ORDER BY started_at DESC
   LIMIT GREATEST(1, LEAST(p_limit, 500));
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_source_backfill_runs(int) TO authenticated;

-- Baseline run to seed the ops log and prove wiring works.
SELECT * FROM public.backfill_assessment_invite_sources();