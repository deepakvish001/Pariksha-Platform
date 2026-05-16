-- Org-scoped aggregate of AI insight feedback (up/down counts per insight)
CREATE OR REPLACE FUNCTION public.get_ai_insight_feedback_summary(_org_id uuid)
RETURNS TABLE (
  insight_key text,
  insight_title text,
  up_count bigint,
  down_count bigint,
  total_count bigint,
  net_score bigint,
  last_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_org_member(_org_id) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    f.insight_key,
    -- Most recent title seen for this insight key
    (ARRAY_AGG(f.insight_title ORDER BY f.created_at DESC))[1] AS insight_title,
    COUNT(*) FILTER (WHERE f.rating = 'up')::bigint   AS up_count,
    COUNT(*) FILTER (WHERE f.rating = 'down')::bigint AS down_count,
    COUNT(*)::bigint AS total_count,
    (COUNT(*) FILTER (WHERE f.rating = 'up')
     - COUNT(*) FILTER (WHERE f.rating = 'down'))::bigint AS net_score,
    MAX(f.created_at) AS last_at
  FROM public.ai_insight_feedback f
  WHERE f.org_id = _org_id
  GROUP BY f.insight_key
  ORDER BY total_count DESC, last_at DESC;
END;
$$;

-- Daily up/down trend per insight (defaults to last 30 days)
CREATE OR REPLACE FUNCTION public.get_ai_insight_feedback_trend(
  _org_id uuid,
  _days integer DEFAULT 30
)
RETURNS TABLE (
  day date,
  insight_key text,
  insight_title text,
  up_count bigint,
  down_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window integer := GREATEST(1, LEAST(COALESCE(_days, 30), 365));
BEGIN
  IF NOT public.is_org_member(_org_id) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    (f.created_at AT TIME ZONE 'UTC')::date AS day,
    f.insight_key,
    (ARRAY_AGG(f.insight_title ORDER BY f.created_at DESC))[1] AS insight_title,
    COUNT(*) FILTER (WHERE f.rating = 'up')::bigint   AS up_count,
    COUNT(*) FILTER (WHERE f.rating = 'down')::bigint AS down_count
  FROM public.ai_insight_feedback f
  WHERE f.org_id = _org_id
    AND f.created_at >= (now() - make_interval(days => _window))
  GROUP BY day, f.insight_key
  ORDER BY day ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ai_insight_feedback_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_insight_feedback_trend(uuid, integer) TO authenticated;