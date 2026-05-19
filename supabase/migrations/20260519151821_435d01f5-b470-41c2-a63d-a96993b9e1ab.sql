
-- =====================================================================
-- Placement Report Dashboard — Phase 1 (retry)
-- =====================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.recruiter_sector AS ENUM (
    'tech','consulting','finance','product','core','analytics','startup','psu','edtech','healthtech','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.drive_type AS ENUM ('on_campus','pool','off_campus','virtual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.drive_status AS ENUM ('upcoming','open','closed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.application_stage AS ENUM (
    'applied','shortlisted','in_rounds','offered','accepted','rejected','withdrew'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.offer_type AS ENUM ('intern','fte','ppo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.placement_ai_kind AS ENUM ('nl_query','weekly_digest','at_risk','recruiter_outreach');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- recruiters ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recruiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  sector public.recruiter_sector NOT NULL DEFAULT 'other',
  website text,
  hq_city text,
  notes text,
  contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  first_visit_year int,
  last_visit_year int,
  is_repeat boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS recruiters_org_name_unique
  ON public.recruiters (org_id, lower(name));
CREATE INDEX IF NOT EXISTS idx_recruiters_org ON public.recruiters(org_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_sector ON public.recruiters(org_id, sector);

ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read recruiters" ON public.recruiters
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "writers insert recruiters" ON public.recruiters
  FOR INSERT TO authenticated WITH CHECK (public.can_write_org(org_id));
CREATE POLICY "writers update recruiters" ON public.recruiters
  FOR UPDATE TO authenticated USING (public.can_write_org(org_id))
  WITH CHECK (public.can_write_org(org_id));
CREATE POLICY "writers delete recruiters" ON public.recruiters
  FOR DELETE TO authenticated USING (public.can_write_org(org_id));

CREATE TRIGGER trg_recruiters_updated_at BEFORE UPDATE ON public.recruiters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- placement_drives ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL REFERENCES public.recruiters(id) ON DELETE RESTRICT,
  title text NOT NULL,
  role_title text,
  drive_type public.drive_type NOT NULL DEFAULT 'on_campus',
  status public.drive_status NOT NULL DEFAULT 'upcoming',
  opens_at timestamptz,
  closes_at timestamptz,
  eligibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  ctc_min numeric,
  ctc_max numeric,
  currency text NOT NULL DEFAULT 'INR',
  location text,
  bond_months int,
  is_dream boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_drives_org ON public.placement_drives(org_id);
CREATE INDEX IF NOT EXISTS idx_drives_recruiter ON public.placement_drives(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_drives_status ON public.placement_drives(org_id, status, closes_at DESC);

ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read drives" ON public.placement_drives
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "writers insert drives" ON public.placement_drives
  FOR INSERT TO authenticated WITH CHECK (public.can_write_org(org_id));
CREATE POLICY "writers update drives" ON public.placement_drives
  FOR UPDATE TO authenticated USING (public.can_write_org(org_id))
  WITH CHECK (public.can_write_org(org_id));
CREATE POLICY "writers delete drives" ON public.placement_drives
  FOR DELETE TO authenticated USING (public.can_write_org(org_id));

CREATE TRIGGER trg_drives_updated_at BEFORE UPDATE ON public.placement_drives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.drive_org(_drive uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT org_id FROM public.placement_drives WHERE id = _drive $$;

CREATE OR REPLACE FUNCTION public.mark_recruiter_repeat()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  drive_count int;
  yr int;
BEGIN
  SELECT count(*) INTO drive_count
    FROM public.placement_drives WHERE recruiter_id = NEW.recruiter_id;
  yr := COALESCE(EXTRACT(YEAR FROM NEW.opens_at)::int, EXTRACT(YEAR FROM now())::int);
  UPDATE public.recruiters
     SET is_repeat = (drive_count >= 2),
         last_visit_year = GREATEST(COALESCE(last_visit_year, yr), yr),
         first_visit_year = LEAST(COALESCE(first_visit_year, yr), yr)
   WHERE id = NEW.recruiter_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_drive_recruiter_repeat ON public.placement_drives;
CREATE TRIGGER trg_drive_recruiter_repeat
AFTER INSERT ON public.placement_drives
FOR EACH ROW EXECUTE FUNCTION public.mark_recruiter_repeat();

-- drive_applications -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drive_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id uuid NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.org_students(id) ON DELETE CASCADE,
  applied_at timestamptz NOT NULL DEFAULT now(),
  stage public.application_stage NOT NULL DEFAULT 'applied',
  current_round int NOT NULL DEFAULT 0,
  last_event_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (drive_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_apps_drive ON public.drive_applications(drive_id, stage);
CREATE INDEX IF NOT EXISTS idx_apps_student ON public.drive_applications(student_id);

ALTER TABLE public.drive_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read apps" ON public.drive_applications
  FOR SELECT TO authenticated USING (public.is_org_member(public.drive_org(drive_id)));
CREATE POLICY "writers insert apps" ON public.drive_applications
  FOR INSERT TO authenticated WITH CHECK (public.can_write_org(public.drive_org(drive_id)));
CREATE POLICY "writers update apps" ON public.drive_applications
  FOR UPDATE TO authenticated USING (public.can_write_org(public.drive_org(drive_id)))
  WITH CHECK (public.can_write_org(public.drive_org(drive_id)));
CREATE POLICY "writers delete apps" ON public.drive_applications
  FOR DELETE TO authenticated USING (public.can_write_org(public.drive_org(drive_id)));

CREATE TRIGGER trg_apps_updated_at BEFORE UPDATE ON public.drive_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- placement_offers ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  drive_id uuid REFERENCES public.placement_drives(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.org_students(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL REFERENCES public.recruiters(id) ON DELETE RESTRICT,
  offered_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  ctc numeric,
  currency text NOT NULL DEFAULT 'INR',
  role_title text,
  location text,
  offer_type public.offer_type NOT NULL DEFAULT 'fte',
  is_dream_offer boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offers_org ON public.placement_offers(org_id);
CREATE INDEX IF NOT EXISTS idx_offers_student ON public.placement_offers(student_id);
CREATE INDEX IF NOT EXISTS idx_offers_recruiter ON public.placement_offers(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_offers_accepted ON public.placement_offers(org_id, accepted_at);

ALTER TABLE public.placement_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read offers" ON public.placement_offers
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "writers insert offers" ON public.placement_offers
  FOR INSERT TO authenticated WITH CHECK (public.can_write_org(org_id));
CREATE POLICY "writers update offers" ON public.placement_offers
  FOR UPDATE TO authenticated USING (public.can_write_org(org_id))
  WITH CHECK (public.can_write_org(org_id));
CREATE POLICY "writers delete offers" ON public.placement_offers
  FOR DELETE TO authenticated USING (public.can_write_org(org_id));

CREATE TRIGGER trg_offers_updated_at BEFORE UPDATE ON public.placement_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- placement_views ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_views_org_user ON public.placement_views(org_id, user_id);

ALTER TABLE public.placement_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read own or shared views" ON public.placement_views
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id) AND (user_id = auth.uid() OR is_shared));
CREATE POLICY "members insert own views" ON public.placement_views
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(org_id) AND user_id = auth.uid());
CREATE POLICY "owners update own views" ON public.placement_views
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owners delete own views" ON public.placement_views
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER trg_views_updated_at BEFORE UPDATE ON public.placement_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- placement_ai_runs --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  kind public.placement_ai_kind NOT NULL,
  prompt text,
  response text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  tokens int,
  cost_cents int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_runs_org ON public.placement_ai_runs(org_id, created_at DESC);

ALTER TABLE public.placement_ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read ai runs" ON public.placement_ai_runs
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "writers insert ai runs" ON public.placement_ai_runs
  FOR INSERT TO authenticated WITH CHECK (public.can_write_org(org_id));

-- placement_snapshots ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  batch_year int NOT NULL,
  branch text,
  total_eligible int NOT NULL DEFAULT 0,
  placed_count int NOT NULL DEFAULT 0,
  multi_offer_count int NOT NULL DEFAULT 0,
  dream_offers int NOT NULL DEFAULT 0,
  avg_ctc numeric,
  median_ctc numeric,
  top_ctc numeric,
  is_public boolean NOT NULL DEFAULT false,
  snapshot_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS snapshots_org_batch_branch_unique
  ON public.placement_snapshots (org_id, batch_year, COALESCE(branch, ''));
CREATE INDEX IF NOT EXISTS idx_snapshots_org ON public.placement_snapshots(org_id, batch_year);

ALTER TABLE public.placement_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read snapshots" ON public.placement_snapshots
  FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "public reads public snapshots" ON public.placement_snapshots
  FOR SELECT TO anon USING (is_public = true);

-- RPC: placement_overview --------------------------------------------
CREATE OR REPLACE FUNCTION public.placement_overview(_org uuid, _filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_batch_years int[]   := NULLIF(ARRAY(SELECT jsonb_array_elements_text(_filters->'batch_years'))::int[], '{}');
  v_branches    text[]  := NULLIF(ARRAY(SELECT jsonb_array_elements_text(_filters->'branches')), '{}');
  v_sections    text[]  := NULLIF(ARRAY(SELECT jsonb_array_elements_text(_filters->'sections')), '{}');
  v_statuses    text[]  := NULLIF(ARRAY(SELECT jsonb_array_elements_text(_filters->'drive_statuses')), '{}');
  v_sectors     text[]  := NULLIF(ARRAY(SELECT jsonb_array_elements_text(_filters->'sectors')), '{}');
  v_date_from   timestamptz := NULLIF(_filters->>'date_from','')::timestamptz;
  v_date_to     timestamptz := NULLIF(_filters->>'date_to','')::timestamptz;
  v_ctc_min     numeric := NULLIF(_filters->>'ctc_min','')::numeric;
  v_ctc_max     numeric := NULLIF(_filters->>'ctc_max','')::numeric;
  v_stud_status text    := NULLIF(_filters->>'student_status','');
  v_result      jsonb;
BEGIN
  IF NOT public.is_org_member(_org) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  WITH
  students AS (
    SELECT s.*
    FROM public.org_students s
    WHERE s.org_id = _org
      AND (v_batch_years IS NULL OR s.batch_year = ANY(v_batch_years))
      AND (v_branches    IS NULL OR s.branch    = ANY(v_branches))
      AND (v_sections    IS NULL OR s.section   = ANY(v_sections))
  ),
  drives AS (
    SELECT d.*, r.sector AS r_sector, r.name AS recruiter_name
    FROM public.placement_drives d
    JOIN public.recruiters r ON r.id = d.recruiter_id
    WHERE d.org_id = _org
      AND (v_statuses IS NULL OR d.status::text = ANY(v_statuses))
      AND (v_sectors  IS NULL OR r.sector::text = ANY(v_sectors))
      AND (v_date_from IS NULL OR COALESCE(d.closes_at, d.opens_at, d.created_at) >= v_date_from)
      AND (v_date_to   IS NULL OR COALESCE(d.opens_at, d.closes_at, d.created_at) <= v_date_to)
      AND (v_ctc_min IS NULL OR COALESCE(d.ctc_max, d.ctc_min) >= v_ctc_min)
      AND (v_ctc_max IS NULL OR COALESCE(d.ctc_min, d.ctc_max) <= v_ctc_max)
  ),
  apps AS (
    SELECT a.*
    FROM public.drive_applications a
    WHERE a.drive_id IN (SELECT id FROM drives)
      AND a.student_id IN (SELECT id FROM students)
  ),
  offers AS (
    SELECT o.*
    FROM public.placement_offers o
    JOIN students s ON s.id = o.student_id
    LEFT JOIN public.recruiters r ON r.id = o.recruiter_id
    WHERE o.org_id = _org
      AND (v_sectors IS NULL OR r.sector::text = ANY(v_sectors))
      AND (v_date_from IS NULL OR COALESCE(o.accepted_at, o.offered_at) >= v_date_from)
      AND (v_date_to   IS NULL OR COALESCE(o.accepted_at, o.offered_at) <= v_date_to)
      AND (v_ctc_min IS NULL OR o.ctc >= v_ctc_min)
      AND (v_ctc_max IS NULL OR o.ctc <= v_ctc_max)
  ),
  placed_students AS (
    SELECT DISTINCT student_id FROM offers WHERE accepted_at IS NOT NULL
  ),
  multi_offer_students AS (
    SELECT student_id FROM offers GROUP BY student_id HAVING count(*) > 1
  ),
  scoped_students AS (
    SELECT s.* FROM students s
    WHERE v_stud_status IS NULL OR v_stud_status = 'any'
       OR (v_stud_status = 'placed'      AND s.id IN (SELECT student_id FROM placed_students))
       OR (v_stud_status = 'unplaced'    AND s.id NOT IN (SELECT student_id FROM placed_students))
       OR (v_stud_status = 'multi_offer' AND s.id IN (SELECT student_id FROM multi_offer_students))
  )
  SELECT jsonb_build_object(
    'kpis', jsonb_build_object(
      'total_students',  (SELECT count(*) FROM scoped_students),
      'eligible',        (SELECT count(*) FROM scoped_students),
      'applied',         (SELECT count(DISTINCT student_id) FROM apps WHERE student_id IN (SELECT id FROM scoped_students)),
      'shortlisted',     (SELECT count(DISTINCT student_id) FROM apps WHERE stage IN ('shortlisted','in_rounds','offered','accepted') AND student_id IN (SELECT id FROM scoped_students)),
      'offered',         (SELECT count(DISTINCT student_id) FROM offers WHERE student_id IN (SELECT id FROM scoped_students)),
      'accepted',        (SELECT count(DISTINCT student_id) FROM offers WHERE accepted_at IS NOT NULL AND student_id IN (SELECT id FROM scoped_students)),
      'placement_pct',   CASE WHEN (SELECT count(*) FROM scoped_students) = 0 THEN 0
                              ELSE round(100.0 * (SELECT count(DISTINCT student_id) FROM offers WHERE accepted_at IS NOT NULL AND student_id IN (SELECT id FROM scoped_students))
                                              / (SELECT count(*) FROM scoped_students), 2) END,
      'multi_offer',     (SELECT count(*) FROM multi_offer_students WHERE student_id IN (SELECT id FROM scoped_students)),
      'avg_ctc',         (SELECT round(avg(ctc)::numeric, 2) FROM offers WHERE ctc IS NOT NULL AND student_id IN (SELECT id FROM scoped_students)),
      'median_ctc',      (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY ctc) FROM offers WHERE ctc IS NOT NULL AND student_id IN (SELECT id FROM scoped_students)),
      'top_ctc',         (SELECT max(ctc) FROM offers WHERE student_id IN (SELECT id FROM scoped_students)),
      'dream_offers',    (SELECT count(*) FROM offers WHERE is_dream_offer = true AND student_id IN (SELECT id FROM scoped_students)),
      'drives_total',    (SELECT count(*) FROM drives),
      'drives_open',     (SELECT count(*) FROM drives WHERE status = 'open'),
      'recruiters_total',(SELECT count(DISTINCT recruiter_id) FROM drives)
    ),
    'funnel', jsonb_build_array(
      jsonb_build_object('stage','eligible',   'count',(SELECT count(*) FROM scoped_students)),
      jsonb_build_object('stage','applied',    'count',(SELECT count(DISTINCT student_id) FROM apps WHERE student_id IN (SELECT id FROM scoped_students))),
      jsonb_build_object('stage','shortlisted','count',(SELECT count(DISTINCT student_id) FROM apps WHERE stage IN ('shortlisted','in_rounds','offered','accepted') AND student_id IN (SELECT id FROM scoped_students))),
      jsonb_build_object('stage','offered',    'count',(SELECT count(DISTINCT student_id) FROM offers WHERE student_id IN (SELECT id FROM scoped_students))),
      jsonb_build_object('stage','accepted',   'count',(SELECT count(DISTINCT student_id) FROM offers WHERE accepted_at IS NOT NULL AND student_id IN (SELECT id FROM scoped_students)))
    ),
    'by_branch', COALESCE((
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT COALESCE(s.branch,'Unknown') AS branch,
               count(s.id) AS total,
               count(o.student_id) FILTER (WHERE o.accepted_at IS NOT NULL) AS placed
        FROM scoped_students s
        LEFT JOIN offers o ON o.student_id = s.id
        GROUP BY COALESCE(s.branch,'Unknown')
        ORDER BY count(s.id) DESC
      ) t
    ), '[]'::jsonb),
    'by_sector', COALESCE((
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT COALESCE(r.sector::text,'other') AS sector,
               count(o.id) AS offers,
               round(avg(o.ctc)::numeric, 2) AS avg_ctc
        FROM offers o
        LEFT JOIN public.recruiters r ON r.id = o.recruiter_id
        WHERE o.student_id IN (SELECT id FROM scoped_students)
        GROUP BY r.sector
        ORDER BY count(o.id) DESC
      ) t
    ), '[]'::jsonb),
    'ctc_distribution', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('band', band, 'count', cnt) ORDER BY band_order)
      FROM (
        SELECT
          CASE WHEN ctc < 500000 THEN '<5L'
               WHEN ctc < 1000000 THEN '5-10L'
               WHEN ctc < 1500000 THEN '10-15L'
               WHEN ctc < 2500000 THEN '15-25L'
               WHEN ctc < 5000000 THEN '25-50L'
               ELSE '50L+' END AS band,
          CASE WHEN ctc < 500000 THEN 1
               WHEN ctc < 1000000 THEN 2
               WHEN ctc < 1500000 THEN 3
               WHEN ctc < 2500000 THEN 4
               WHEN ctc < 5000000 THEN 5
               ELSE 6 END AS band_order,
          count(*) AS cnt
        FROM offers
        WHERE ctc IS NOT NULL AND student_id IN (SELECT id FROM scoped_students)
        GROUP BY 1,2
      ) t
    ), '[]'::jsonb),
    'top_recruiters', COALESCE((
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT r.id AS recruiter_id, r.name, r.sector::text AS sector,
               count(o.id) AS offers,
               round(avg(o.ctc)::numeric, 2) AS avg_ctc,
               r.is_repeat
        FROM offers o
        JOIN public.recruiters r ON r.id = o.recruiter_id
        WHERE o.student_id IN (SELECT id FROM scoped_students)
        GROUP BY r.id, r.name, r.sector, r.is_repeat
        ORDER BY count(o.id) DESC
        LIMIT 10
      ) t
    ), '[]'::jsonb),
    'live_drives', COALESCE((
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT d.id AS drive_id, d.title, d.recruiter_name, d.r_sector::text AS sector,
               d.status::text AS status, d.opens_at, d.closes_at, d.ctc_min, d.ctc_max,
               (SELECT count(*) FROM apps a WHERE a.drive_id = d.id) AS applied,
               (SELECT count(*) FROM apps a WHERE a.drive_id = d.id AND a.stage IN ('shortlisted','in_rounds','offered','accepted')) AS shortlisted,
               (SELECT count(*) FROM public.placement_offers o WHERE o.drive_id = d.id) AS offered
        FROM drives d
        ORDER BY COALESCE(d.closes_at, d.opens_at, d.created_at) DESC
        LIMIT 50
      ) t
    ), '[]'::jsonb),
    'filter_options', jsonb_build_object(
      'branches',     COALESCE((SELECT jsonb_agg(DISTINCT branch ORDER BY branch) FROM public.org_students WHERE org_id = _org AND branch IS NOT NULL), '[]'::jsonb),
      'batch_years',  COALESCE((SELECT jsonb_agg(DISTINCT batch_year ORDER BY batch_year DESC) FROM public.org_students WHERE org_id = _org AND batch_year IS NOT NULL), '[]'::jsonb),
      'sections',     COALESCE((SELECT jsonb_agg(DISTINCT section ORDER BY section) FROM public.org_students WHERE org_id = _org AND section IS NOT NULL), '[]'::jsonb),
      'sectors',      COALESCE((SELECT jsonb_agg(DISTINCT sector::text ORDER BY sector::text) FROM public.recruiters WHERE org_id = _org), '[]'::jsonb)
    )
  ) INTO v_result;

  RETURN v_result;
END $$;

GRANT EXECUTE ON FUNCTION public.placement_overview(uuid, jsonb) TO authenticated;
