CREATE OR REPLACE FUNCTION public.get_insight_feedback_signals(
  _org_id uuid,
  _days integer DEFAULT 90
)
RETURNS TABLE (
  insight_key text,
  insight_title text,
  up_count bigint,
  down_count bigint,
  net_score bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window integer := GREATEST(1, LEAST(COALESCE(_days, 90), 365));
BEGIN
  IF NOT public.is_org_member(_org_id) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    f.insight_key,
    (ARRAY_AGG(f.insight_title ORDER BY f.created_at DESC))[1] AS insight_title,
    COUNT(*) FILTER (WHERE f.rating = 'up')::bigint   AS up_count,
    COUNT(*) FILTER (WHERE f.rating = 'down')::bigint AS down_count,
    (COUNT(*) FILTER (WHERE f.rating = 'up')
     - COUNT(*) FILTER (WHERE f.rating = 'down'))::bigint AS net_score
  FROM public.ai_insight_feedback f
  WHERE f.org_id = _org_id
    AND f.created_at >= (now() - make_interval(days => _window))
  GROUP BY f.insight_key;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_insight_feedback_signals(uuid, integer) TO authenticated;