
-- Extend placement_rankings with sort + student_ids filter
CREATE OR REPLACE FUNCTION public.placement_rankings(
  _org_id uuid,
  _filters jsonb DEFAULT '{}'::jsonb,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0,
  _sort text DEFAULT 'score',
  _student_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  student_id uuid,
  full_name text,
  email text,
  roll_number text,
  branch text,
  batch_year integer,
  section text,
  score numeric,
  rank_in_org integer,
  rank_in_branch integer,
  assessments_taken integer,
  avg_assessment_score numeric,
  avg_integrity numeric,
  applications_count integer,
  shortlisted_count integer,
  offers_count integer,
  is_placed boolean,
  is_multi_offer boolean,
  scores jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      s.id AS student_id,
      s.full_name, s.email, s.roll_number, s.branch, s.batch_year, s.section,
      COALESCE(pss.score, 0)               AS score,
      pss.rank_in_org, pss.rank_in_branch,
      COALESCE(pss.assessments_taken, 0)   AS assessments_taken,
      pss.avg_assessment_score, pss.avg_integrity,
      COALESCE(pss.applications_count, 0)  AS applications_count,
      COALESCE(pss.shortlisted_count, 0)   AS shortlisted_count,
      COALESCE(pss.offers_count, 0)        AS offers_count,
      COALESCE(pss.is_placed, false)       AS is_placed,
      COALESCE(pss.is_multi_offer, false)  AS is_multi_offer,
      COALESCE(pss.scores, '{}'::jsonb)    AS scores
    FROM public.org_students s
    LEFT JOIN public.placement_student_scores pss
      ON pss.student_id = s.id AND pss.org_id = s.org_id
    WHERE s.org_id = _org_id
      AND public.is_org_member(_org_id)
      AND (_student_ids IS NULL OR s.id = ANY(_student_ids))
      AND (_filters->>'batch_year' IS NULL OR s.batch_year = (_filters->>'batch_year')::int)
      AND (_filters->>'branch' IS NULL OR s.branch = _filters->>'branch')
      AND (_filters->>'section' IS NULL OR s.section = _filters->>'section')
      AND (_filters->>'status' IS NULL OR (
        CASE _filters->>'status'
          WHEN 'placed' THEN COALESCE(pss.is_placed, false) = true
          WHEN 'multi'  THEN COALESCE(pss.is_multi_offer, false) = true
          WHEN 'unplaced' THEN COALESCE(pss.is_placed, false) = false
          ELSE true
        END
      ))
      AND (_filters->>'min_score' IS NULL OR COALESCE(pss.score, 0) >= (_filters->>'min_score')::numeric)
      AND (_filters->>'search' IS NULL OR (
        s.full_name ILIKE '%' || (_filters->>'search') || '%'
        OR s.email ILIKE '%' || (_filters->>'search') || '%'
        OR COALESCE(s.roll_number, '') ILIKE '%' || (_filters->>'search') || '%'
      ))
  )
  SELECT
    student_id, full_name, email, roll_number, branch, batch_year, section,
    score, rank_in_org, rank_in_branch, assessments_taken,
    avg_assessment_score, avg_integrity, applications_count, shortlisted_count,
    offers_count, is_placed, is_multi_offer, scores
  FROM base
  ORDER BY
    CASE WHEN _sort = 'assessment' THEN COALESCE(avg_assessment_score, -1) END DESC NULLS LAST,
    CASE WHEN _sort = 'offers'     THEN offers_count END DESC NULLS LAST,
    CASE WHEN _sort = 'engagement' THEN (applications_count + 2 * shortlisted_count + 4 * offers_count) END DESC NULLS LAST,
    score DESC,
    full_name ASC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit, 200))
  OFFSET GREATEST(0, _offset);
$$;

-- Count of matching rows for the same filters (for pagination UI)
CREATE OR REPLACE FUNCTION public.placement_rankings_count(
  _org_id uuid,
  _filters jsonb DEFAULT '{}'::jsonb,
  _student_ids uuid[] DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.org_students s
  LEFT JOIN public.placement_student_scores pss
    ON pss.student_id = s.id AND pss.org_id = s.org_id
  WHERE s.org_id = _org_id
    AND public.is_org_member(_org_id)
    AND (_student_ids IS NULL OR s.id = ANY(_student_ids))
    AND (_filters->>'batch_year' IS NULL OR s.batch_year = (_filters->>'batch_year')::int)
    AND (_filters->>'branch' IS NULL OR s.branch = _filters->>'branch')
    AND (_filters->>'section' IS NULL OR s.section = _filters->>'section')
    AND (_filters->>'status' IS NULL OR (
      CASE _filters->>'status'
        WHEN 'placed' THEN COALESCE(pss.is_placed, false) = true
        WHEN 'multi'  THEN COALESCE(pss.is_multi_offer, false) = true
        WHEN 'unplaced' THEN COALESCE(pss.is_placed, false) = false
        ELSE true
      END
    ))
    AND (_filters->>'min_score' IS NULL OR COALESCE(pss.score, 0) >= (_filters->>'min_score')::numeric)
    AND (_filters->>'search' IS NULL OR (
      s.full_name ILIKE '%' || (_filters->>'search') || '%'
      OR s.email ILIKE '%' || (_filters->>'search') || '%'
      OR COALESCE(s.roll_number, '') ILIKE '%' || (_filters->>'search') || '%'
    ));
$$;

-- Distinct filter values for the dropdowns (independent of current page)
CREATE OR REPLACE FUNCTION public.placement_rankings_filter_values(
  _org_id uuid
)
RETURNS TABLE (
  branches text[],
  batches integer[],
  sections text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(array_agg(DISTINCT branch ORDER BY branch) FILTER (WHERE branch IS NOT NULL), '{}'::text[]),
    COALESCE(array_agg(DISTINCT batch_year ORDER BY batch_year) FILTER (WHERE batch_year IS NOT NULL), '{}'::integer[]),
    COALESCE(array_agg(DISTINCT section ORDER BY section) FILTER (WHERE section IS NOT NULL), '{}'::text[])
  FROM public.org_students
  WHERE org_id = _org_id
    AND public.is_org_member(_org_id);
$$;
