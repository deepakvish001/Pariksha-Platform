-- Admin flags for low-quality AI insights (keyed by the stable insight_key)
CREATE TABLE public.ai_insight_flags (
  insight_key text PRIMARY KEY,
  insight_title text NOT NULL,
  reason text,
  flagged_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insight_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read insight flags"
  ON public.ai_insight_flags FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins write insight flags"
  ON public.ai_insight_flags FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete insight flags"
  ON public.ai_insight_flags FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin: list raw feedback responses with user identity (paginated, filterable)
CREATE OR REPLACE FUNCTION public.admin_list_ai_insight_feedback(
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0,
  _rating public.ai_insight_rating DEFAULT NULL,
  _insight_key text DEFAULT NULL,
  _org_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  user_email text,
  user_full_name text,
  user_avatar_url text,
  org_id uuid,
  org_name text,
  insight_key text,
  insight_title text,
  rating public.ai_insight_rating,
  comment text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lim integer := GREATEST(1, LEAST(COALESCE(_limit, 50), 200));
  _off integer := GREATEST(0, COALESCE(_offset, 0));
  _total bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*) INTO _total
  FROM public.ai_insight_feedback f
  WHERE (_rating IS NULL OR f.rating = _rating)
    AND (_insight_key IS NULL OR f.insight_key = _insight_key)
    AND (_org_id IS NULL OR f.org_id = _org_id);

  RETURN QUERY
  SELECT
    f.id,
    f.created_at,
    f.updated_at,
    f.user_id,
    u.email::text AS user_email,
    p.full_name AS user_full_name,
    p.avatar_url AS user_avatar_url,
    f.org_id,
    o.name AS org_name,
    f.insight_key,
    f.insight_title,
    f.rating,
    f.comment,
    _total AS total_count
  FROM public.ai_insight_feedback f
  LEFT JOIN public.profiles p ON p.user_id = f.user_id
  LEFT JOIN auth.users u ON u.id = f.user_id
  LEFT JOIN public.organizations o ON o.id = f.org_id
  WHERE (_rating IS NULL OR f.rating = _rating)
    AND (_insight_key IS NULL OR f.insight_key = _insight_key)
    AND (_org_id IS NULL OR f.org_id = _org_id)
  ORDER BY f.created_at DESC
  LIMIT _lim OFFSET _off;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_ai_insight_feedback(integer, integer, public.ai_insight_rating, text, uuid) TO authenticated;

-- Admin: aggregate per-insight overview across all orgs (with flag status)
CREATE OR REPLACE FUNCTION public.admin_get_ai_insight_overview(
  _days integer DEFAULT 90
)
RETURNS TABLE (
  insight_key text,
  insight_title text,
  up_count bigint,
  down_count bigint,
  total_count bigint,
  net_score bigint,
  org_count bigint,
  last_at timestamptz,
  is_flagged boolean,
  flag_reason text,
  flagged_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window integer := GREATEST(1, LEAST(COALESCE(_days, 90), 365));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    f.insight_key,
    (ARRAY_AGG(f.insight_title ORDER BY f.created_at DESC))[1] AS insight_title,
    COUNT(*) FILTER (WHERE f.rating = 'up')::bigint   AS up_count,
    COUNT(*) FILTER (WHERE f.rating = 'down')::bigint AS down_count,
    COUNT(*)::bigint AS total_count,
    (COUNT(*) FILTER (WHERE f.rating = 'up')
     - COUNT(*) FILTER (WHERE f.rating = 'down'))::bigint AS net_score,
    COUNT(DISTINCT f.org_id)::bigint AS org_count,
    MAX(f.created_at) AS last_at,
    (fl.insight_key IS NOT NULL) AS is_flagged,
    fl.reason AS flag_reason,
    fl.created_at AS flagged_at
  FROM public.ai_insight_feedback f
  LEFT JOIN public.ai_insight_flags fl ON fl.insight_key = f.insight_key
  WHERE f.created_at >= (now() - make_interval(days => _window))
  GROUP BY f.insight_key, fl.insight_key, fl.reason, fl.created_at
  ORDER BY total_count DESC, last_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_ai_insight_overview(integer) TO authenticated;

-- Admin: toggle a flag on an insight
CREATE OR REPLACE FUNCTION public.admin_set_insight_flag(
  _insight_key text,
  _insight_title text,
  _reason text DEFAULT NULL,
  _flagged boolean DEFAULT true
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF _insight_key IS NULL OR length(trim(_insight_key)) = 0 THEN
    RAISE EXCEPTION 'insight_key required';
  END IF;

  IF _flagged THEN
    INSERT INTO public.ai_insight_flags (insight_key, insight_title, reason, flagged_by)
    VALUES (_insight_key, COALESCE(_insight_title, _insight_key), NULLIF(trim(_reason), ''), auth.uid())
    ON CONFLICT (insight_key) DO UPDATE
      SET insight_title = EXCLUDED.insight_title,
          reason = EXCLUDED.reason,
          flagged_by = EXCLUDED.flagged_by,
          created_at = now();
    RETURN true;
  ELSE
    DELETE FROM public.ai_insight_flags WHERE insight_key = _insight_key;
    RETURN false;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_insight_flag(text, text, text, boolean) TO authenticated;