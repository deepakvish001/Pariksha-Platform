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
      count(*) FILTER (WHERE created_at >= _prev_start AND created_at < _curr_start)::int AS prev,
      count(*) FILTER (WHERE created_at >= _curr_start AND status = 'draft')::int AS curr_draft,
      count(*) FILTER (WHERE created_at >= _prev_start AND created_at < _curr_start AND status = 'draft')::int AS prev_draft,
      count(*) FILTER (WHERE created_at >= _curr_start AND status = 'published')::int AS curr_pub,
      count(*) FILTER (WHERE created_at >= _prev_start AND created_at < _curr_start AND status = 'published')::int AS prev_pub
    FROM public.assessments
    WHERE org_id = _org_id
  ),
  i AS (
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE inv.created_at >= _curr_start)::int AS curr,
      count(*) FILTER (WHERE inv.created_at >= _prev_start AND inv.created_at < _curr_start)::int AS prev,
      count(*) FILTER (WHERE inv.created_at >= _curr_start AND inv.status = 'pending')::int AS curr_pending,
      count(*) FILTER (WHERE inv.created_at >= _prev_start AND inv.created_at < _curr_start AND inv.status = 'pending')::int AS prev_pending,
      count(*) FILTER (WHERE inv.created_at >= _curr_start AND inv.status <> 'pending')::int AS curr_accepted,
      count(*) FILTER (WHERE inv.created_at >= _prev_start AND inv.created_at < _curr_start AND inv.status <> 'pending')::int AS prev_accepted
    FROM public.assessment_invites inv
    JOIN public.assessments ass ON ass.id = inv.assessment_id
    WHERE ass.org_id = _org_id
  ),
  s AS (
    SELECT
      count(*) FILTER (WHERE att.status = 'submitted')::int AS total,
      count(*) FILTER (WHERE att.status = 'submitted' AND att.submitted_at >= _curr_start)::int AS curr,
      count(*) FILTER (WHERE att.status = 'submitted' AND att.submitted_at >= _prev_start AND att.submitted_at < _curr_start)::int AS prev,
      count(*) FILTER (WHERE att.started_at >= _curr_start)::int AS curr_started,
      count(*) FILTER (WHERE att.started_at >= _prev_start AND att.started_at < _curr_start)::int AS prev_started,
      count(*) FILTER (WHERE att.status = 'submitted' AND att.submitted_at >= _curr_start AND coalesce(att.integrity_score, 100) < 70)::int AS curr_low,
      count(*) FILTER (WHERE att.status = 'submitted' AND att.submitted_at >= _prev_start AND att.submitted_at < _curr_start AND coalesce(att.integrity_score, 100) < 70)::int AS prev_low,
      avg(att.integrity_score) FILTER (WHERE att.status = 'submitted')::numeric AS avg_total,
      avg(att.integrity_score) FILTER (WHERE att.status = 'submitted' AND att.submitted_at >= _curr_start)::numeric AS avg_curr,
      avg(att.integrity_score) FILTER (WHERE att.status = 'submitted' AND att.submitted_at >= _prev_start AND att.submitted_at < _curr_start)::numeric AS avg_prev
    FROM public.assessment_attempts att
    JOIN public.assessments ass ON ass.id = att.assessment_id
    WHERE ass.org_id = _org_id
  )
  SELECT jsonb_build_object(
    'window_days', _window_days,
    'assessments', jsonb_build_object(
      'total', a.total, 'curr', a.curr, 'prev', a.prev,
      'breakdown', jsonb_build_object(
        'drafts',    jsonb_build_object('curr', a.curr_draft, 'prev', a.prev_draft),
        'published', jsonb_build_object('curr', a.curr_pub,   'prev', a.prev_pub)
      )
    ),
    'invites', jsonb_build_object(
      'total', i.total, 'curr', i.curr, 'prev', i.prev,
      'breakdown', jsonb_build_object(
        'pending',  jsonb_build_object('curr', i.curr_pending,  'prev', i.prev_pending),
        'accepted', jsonb_build_object('curr', i.curr_accepted, 'prev', i.prev_accepted)
      )
    ),
    'submissions', jsonb_build_object(
      'total', s.total, 'curr', s.curr, 'prev', s.prev,
      'breakdown', jsonb_build_object(
        'started',   jsonb_build_object('curr', s.curr_started, 'prev', s.prev_started),
        'completed', jsonb_build_object('curr', s.curr,         'prev', s.prev)
      )
    ),
    'integrity', jsonb_build_object(
      'total', CASE WHEN s.avg_total IS NULL THEN NULL ELSE round(s.avg_total)::int END,
      'curr',  CASE WHEN s.avg_curr  IS NULL THEN NULL ELSE round(s.avg_curr)::int  END,
      'prev',  CASE WHEN s.avg_prev  IS NULL THEN NULL ELSE round(s.avg_prev)::int  END,
      'breakdown', jsonb_build_object(
        'flagged_low', jsonb_build_object('curr', s.curr_low, 'prev', s.prev_low)
      )
    )
  )
  INTO _result
  FROM a, i, s;

  RETURN _result;
END;
$$;