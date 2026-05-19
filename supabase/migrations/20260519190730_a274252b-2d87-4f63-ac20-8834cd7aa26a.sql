
-- =========================================================
-- Placement student scores
-- =========================================================
CREATE TABLE IF NOT EXISTS public.placement_student_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.org_students(id) ON DELETE CASCADE,
  score numeric(6,2) NOT NULL DEFAULT 0,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  rank_in_org integer,
  rank_in_branch integer,
  assessments_taken integer NOT NULL DEFAULT 0,
  avg_assessment_score numeric(6,2),
  avg_integrity numeric(6,2),
  applications_count integer NOT NULL DEFAULT 0,
  shortlisted_count integer NOT NULL DEFAULT 0,
  offers_count integer NOT NULL DEFAULT 0,
  is_placed boolean NOT NULL DEFAULT false,
  is_multi_offer boolean NOT NULL DEFAULT false,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_pss_org_score ON public.placement_student_scores (org_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_pss_student ON public.placement_student_scores (student_id);

ALTER TABLE public.placement_student_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read student scores"
ON public.placement_student_scores FOR SELECT TO authenticated
USING (public.is_org_member(org_id));

CREATE POLICY "student reads own score"
ON public.placement_student_scores FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.org_students s
  WHERE s.id = placement_student_scores.student_id
    AND s.user_id = auth.uid()
));

CREATE POLICY "org admins write student scores"
ON public.placement_student_scores FOR ALL TO authenticated
USING (public.is_org_member(org_id, ARRAY['owner'::org_member_role,'admin'::org_member_role,'recruiter'::org_member_role]))
WITH CHECK (public.is_org_member(org_id, ARRAY['owner'::org_member_role,'admin'::org_member_role,'recruiter'::org_member_role]));

-- =========================================================
-- Student profile preferences (opt-in / headline)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.student_profile_preferences (
  student_id uuid PRIMARY KEY REFERENCES public.org_students(id) ON DELETE CASCADE,
  allow_public_share boolean NOT NULL DEFAULT true,
  show_resume boolean NOT NULL DEFAULT true,
  show_contact boolean NOT NULL DEFAULT false,
  headline text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_profile_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student manages own prefs"
ON public.student_profile_preferences FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.org_students s
  WHERE s.id = student_profile_preferences.student_id AND s.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.org_students s
  WHERE s.id = student_profile_preferences.student_id AND s.user_id = auth.uid()
));

CREATE POLICY "org admins read prefs"
ON public.student_profile_preferences FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.org_students s
  WHERE s.id = student_profile_preferences.student_id
    AND public.is_org_member(s.org_id, ARRAY['owner'::org_member_role,'admin'::org_member_role,'recruiter'::org_member_role])
));

-- =========================================================
-- Share links + views
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.student_share_kind AS ENUM ('profile','shortlist');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.student_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind public.student_share_kind NOT NULL DEFAULT 'profile',
  token text NOT NULL UNIQUE,
  student_id uuid REFERENCES public.org_students(id) ON DELETE CASCADE,
  student_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  recruiter_email text,
  recruiter_name text,
  message text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  revoked_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_org ON public.student_share_links (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_token ON public.student_share_links (token);

ALTER TABLE public.student_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org admins manage share links"
ON public.student_share_links FOR ALL TO authenticated
USING (public.is_org_member(org_id, ARRAY['owner'::org_member_role,'admin'::org_member_role,'recruiter'::org_member_role]))
WITH CHECK (public.is_org_member(org_id, ARRAY['owner'::org_member_role,'admin'::org_member_role,'recruiter'::org_member_role]));

CREATE POLICY "student reads own share links"
ON public.student_share_links FOR SELECT TO authenticated
USING (
  student_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.org_students s
    WHERE s.id = student_share_links.student_id AND s.user_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS public.student_share_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES public.student_share_links(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  user_agent text,
  referrer text
);

CREATE INDEX IF NOT EXISTS idx_share_views_share ON public.student_share_views (share_id, viewed_at DESC);

ALTER TABLE public.student_share_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org admins read share views"
ON public.student_share_views FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.student_share_links l
  WHERE l.id = student_share_views.share_id
    AND public.is_org_member(l.org_id, ARRAY['owner'::org_member_role,'admin'::org_member_role,'recruiter'::org_member_role])
));

-- =========================================================
-- Score recompute function
-- =========================================================
CREATE OR REPLACE FUNCTION public.placement_recompute_scores(_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.is_org_member(_org_id, ARRAY['owner'::org_member_role,'admin'::org_member_role,'recruiter'::org_member_role]) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH base AS (
    SELECT
      s.id AS student_id,
      s.org_id,
      s.branch,
      s.user_id,
      COALESCE(att.attempts_taken, 0) AS attempts_taken,
      COALESCE(att.avg_score, 0)      AS avg_score,
      COALESCE(att.avg_integrity, 0)  AS avg_integrity,
      COALESCE(apps.applications_count, 0) AS applications_count,
      COALESCE(apps.shortlisted_count, 0)  AS shortlisted_count,
      COALESCE(off.offers_count, 0)        AS offers_count,
      (COALESCE(off.offers_count, 0) >= 1) AS is_placed,
      (COALESCE(off.offers_count, 0) >= 2) AS is_multi_offer
    FROM public.org_students s
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)                                    AS attempts_taken,
        AVG(NULLIF(a.score, NULL))                  AS avg_score,
        AVG(NULLIF(a.integrity_score, NULL))        AS avg_integrity
      FROM public.assessment_attempts a
      WHERE a.user_id = s.user_id
        AND a.status = 'submitted'
    ) att ON s.user_id IS NOT NULL
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)                                                     AS applications_count,
        COUNT(*) FILTER (WHERE da.stage IN ('shortlisted','interview','offered')) AS shortlisted_count
      FROM public.drive_applications da
      WHERE da.student_id = s.id
    ) apps ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS offers_count
      FROM public.placement_offers po
      WHERE po.student_id = s.id
    ) off ON true
    WHERE s.org_id = _org_id
  ),
  scored AS (
    SELECT
      b.*,
      LEAST(100, ROUND(
        (0.40 * COALESCE(b.avg_score, 0))
      + (0.20 * COALESCE(b.avg_integrity, 0))
      + (0.15 * LEAST(100, b.applications_count * 10))
      + (0.10 * LEAST(100, b.shortlisted_count * 20))
      + (0.15 * CASE
                  WHEN b.is_multi_offer THEN 100
                  WHEN b.is_placed       THEN 80
                  WHEN b.shortlisted_count > 0 THEN 40
                  ELSE 0
                END)
      , 2)) AS final_score
    FROM base b
  ),
  ranked AS (
    SELECT
      sc.*,
      ROW_NUMBER() OVER (ORDER BY sc.final_score DESC, sc.attempts_taken DESC, sc.student_id) AS rank_in_org,
      ROW_NUMBER() OVER (PARTITION BY sc.branch ORDER BY sc.final_score DESC, sc.attempts_taken DESC, sc.student_id) AS rank_in_branch
    FROM scored sc
  )
  INSERT INTO public.placement_student_scores AS pss
    (org_id, student_id, score, scores, rank_in_org, rank_in_branch,
     assessments_taken, avg_assessment_score, avg_integrity,
     applications_count, shortlisted_count, offers_count,
     is_placed, is_multi_offer, computed_at)
  SELECT
    r.org_id, r.student_id, r.final_score,
    jsonb_build_object(
      'assessment_score', COALESCE(r.avg_score, 0),
      'integrity',        COALESCE(r.avg_integrity, 0),
      'engagement',       LEAST(100, r.applications_count * 10),
      'shortlist_rate',   LEAST(100, r.shortlisted_count * 20),
      'offer_factor',     CASE WHEN r.is_multi_offer THEN 100 WHEN r.is_placed THEN 80 WHEN r.shortlisted_count>0 THEN 40 ELSE 0 END
    ),
    r.rank_in_org, r.rank_in_branch,
    r.attempts_taken, r.avg_score, r.avg_integrity,
    r.applications_count, r.shortlisted_count, r.offers_count,
    r.is_placed, r.is_multi_offer, now()
  FROM ranked r
  ON CONFLICT (org_id, student_id) DO UPDATE SET
    score = EXCLUDED.score,
    scores = EXCLUDED.scores,
    rank_in_org = EXCLUDED.rank_in_org,
    rank_in_branch = EXCLUDED.rank_in_branch,
    assessments_taken = EXCLUDED.assessments_taken,
    avg_assessment_score = EXCLUDED.avg_assessment_score,
    avg_integrity = EXCLUDED.avg_integrity,
    applications_count = EXCLUDED.applications_count,
    shortlisted_count = EXCLUDED.shortlisted_count,
    offers_count = EXCLUDED.offers_count,
    is_placed = EXCLUDED.is_placed,
    is_multi_offer = EXCLUDED.is_multi_offer,
    computed_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =========================================================
-- Rankings RPC
-- =========================================================
CREATE OR REPLACE FUNCTION public.placement_rankings(
  _org_id uuid,
  _filters jsonb DEFAULT '{}'::jsonb,
  _limit integer DEFAULT 200,
  _offset integer DEFAULT 0
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
  SELECT
    s.id, s.full_name, s.email, s.roll_number, s.branch, s.batch_year, s.section,
    COALESCE(pss.score, 0),
    pss.rank_in_org, pss.rank_in_branch,
    COALESCE(pss.assessments_taken, 0),
    pss.avg_assessment_score, pss.avg_integrity,
    COALESCE(pss.applications_count, 0),
    COALESCE(pss.shortlisted_count, 0),
    COALESCE(pss.offers_count, 0),
    COALESCE(pss.is_placed, false),
    COALESCE(pss.is_multi_offer, false),
    COALESCE(pss.scores, '{}'::jsonb)
  FROM public.org_students s
  LEFT JOIN public.placement_student_scores pss
    ON pss.student_id = s.id AND pss.org_id = s.org_id
  WHERE s.org_id = _org_id
    AND public.is_org_member(_org_id)
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
  ORDER BY COALESCE(pss.score, 0) DESC, s.full_name ASC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit, 1000))
  OFFSET GREATEST(0, _offset);
$$;
