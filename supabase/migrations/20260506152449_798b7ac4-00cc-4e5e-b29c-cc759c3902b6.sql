-- Extend existing sideeye_review_feedback with session_id + verdict.
ALTER TABLE public.sideeye_review_feedback
  ADD COLUMN IF NOT EXISTS session_id uuid,
  ADD COLUMN IF NOT EXISTS verdict text,
  ADD COLUMN IF NOT EXISTS finding_kind text,
  ADD COLUMN IF NOT EXISTS reason text;

-- Backfill session_id from audit log when possible.
UPDATE public.sideeye_review_feedback f
SET session_id = a.session_id
FROM public.contest_side_camera_audit_logs a
WHERE f.session_id IS NULL AND f.audit_log_id = a.id;

-- Map legacy is_false_positive → verdict if verdict still null.
UPDATE public.sideeye_review_feedback
SET verdict = CASE WHEN is_false_positive THEN 'false_positive' ELSE 'confirmed' END
WHERE verdict IS NULL;

ALTER TABLE public.sideeye_review_feedback
  ALTER COLUMN verdict SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sideeye_review_feedback_verdict_chk'
  ) THEN
    ALTER TABLE public.sideeye_review_feedback
      ADD CONSTRAINT sideeye_review_feedback_verdict_chk
      CHECK (verdict IN ('false_positive','confirmed','needs_more_info'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sideeye_review_feedback_session_idx
  ON public.sideeye_review_feedback (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sideeye_review_feedback_kind_idx
  ON public.sideeye_review_feedback (finding_kind, verdict);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sideeye_review_feedback_unique_reviewer_row'
  ) THEN
    ALTER TABLE public.sideeye_review_feedback
      ADD CONSTRAINT sideeye_review_feedback_unique_reviewer_row
      UNIQUE (audit_log_id, reviewer_id);
  END IF;
END $$;

-- Unified risk score: fuses side-camera + screen + presence findings into 0-100.
CREATE OR REPLACE FUNCTION public.sideeye_unified_risk_score(_session_id uuid)
RETURNS TABLE (
  score integer,
  side_camera_count integer,
  screen_count integer,
  presence_count integer,
  high_severity_count integer,
  false_positive_count integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH agg AS (
    SELECT
      COUNT(*) FILTER (WHERE (raw->>'source') = 'side_camera')::int AS side_c,
      COUNT(*) FILTER (WHERE (raw->>'source') = 'screen')::int AS screen_c,
      COUNT(*) FILTER (WHERE (raw->>'source') = 'presence')::int AS presence_c,
      COUNT(*) FILTER (WHERE severity IN ('flag','fatal'))::int AS high_c
    FROM public.contest_proctor_findings
    WHERE session_id = _session_id
  ),
  fp AS (
    SELECT COUNT(*)::int AS c FROM public.sideeye_review_feedback
    WHERE session_id = _session_id AND verdict = 'false_positive'
  )
  SELECT
    LEAST(100, GREATEST(0,
      (agg.side_c * 5) + (agg.screen_c * 4) + (agg.presence_c * 3)
      + (agg.high_c * 10) - (fp.c * 6)
    ))::int AS score,
    agg.side_c, agg.screen_c, agg.presence_c, agg.high_c, fp.c
  FROM agg, fp;
$$;

GRANT EXECUTE ON FUNCTION public.sideeye_unified_risk_score(uuid) TO authenticated;