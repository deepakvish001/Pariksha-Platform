-- Single-query aggregation RPC for B2B dashboard KPI deltas.
-- Computes totals plus current-window and previous-window counts in one round trip.

CREATE OR REPLACE FUNCTION public.get_b2b_dashboard_stats(
  _org_id uuid,
  _window_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
  _curr_start timestamptz := _now - make_interval(days => _window_days);
  _prev_start timestamptz := _now - make_interval(days => _window_days * 2);
  _result jsonb;
BEGIN
  WITH a AS (
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE created_at >= _curr_start)::int AS curr,
      count(*) FILTER (WHERE created_at >= _prev_start AND created_at < _curr_start)::int AS prev
    FROM public.assessments
    WHERE org_id = _org_id
  ),
  i AS (
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE inv.created_at >= _curr_start)::int AS curr,
      count(*) FILTER (WHERE inv.created_at >= _prev_start AND inv.created_at < _curr_start)::int AS prev
    FROM public.assessment_invites inv
    JOIN public.assessments ass ON ass.id = inv.assessment_id
    WHERE ass.org_id = _org_id
  ),
  s AS (
    SELECT
      count(*) FILTER (WHERE att.status = 'submitted')::int AS total,
      count(*) FILTER (WHERE att.status = 'submitted' AND att.submitted_at >= _curr_start)::int AS curr,
      count(*) FILTER (WHERE att.status = 'submitted' AND att.submitted_at >= _prev_start AND att.submitted_at < _curr_start)::int AS prev,
      avg(att.integrity_score) FILTER (WHERE att.status = 'submitted')::numeric AS avg_total,
      avg(att.integrity_score) FILTER (WHERE att.status = 'submitted' AND att.submitted_at >= _curr_start)::numeric AS avg_curr,
      avg(att.integrity_score) FILTER (WHERE att.status = 'submitted' AND att.submitted_at >= _prev_start AND att.submitted_at < _curr_start)::numeric AS avg_prev
    FROM public.assessment_attempts att
    JOIN public.assessments ass ON ass.id = att.assessment_id
    WHERE ass.org_id = _org_id
  )
  SELECT jsonb_build_object(
    'window_days', _window_days,
    'assessments', jsonb_build_object('total', a.total, 'curr', a.curr, 'prev', a.prev),
    'invites',     jsonb_build_object('total', i.total, 'curr', i.curr, 'prev', i.prev),
    'submissions', jsonb_build_object('total', s.total, 'curr', s.curr, 'prev', s.prev),
    'integrity',   jsonb_build_object(
      'total', CASE WHEN s.avg_total IS NULL THEN NULL ELSE round(s.avg_total)::int END,
      'curr',  CASE WHEN s.avg_curr  IS NULL THEN NULL ELSE round(s.avg_curr)::int  END,
      'prev',  CASE WHEN s.avg_prev  IS NULL THEN NULL ELSE round(s.avg_prev)::int  END
    )
  )
  INTO _result
  FROM a, i, s;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_b2b_dashboard_stats(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_b2b_dashboard_stats(uuid, integer) TO authenticated;