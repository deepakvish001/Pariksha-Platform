
-- =========================================================
-- Phase 1: meaningful slugs for assessments and attempts
-- =========================================================

-- 1) Generic slugify helper (lowercase, ascii, hyphenated, max 60 chars)
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    NULLIF(
      trim(both '-' FROM
        substring(
          regexp_replace(
            regexp_replace(
              lower(coalesce(input, '')),
              '[^a-z0-9]+', '-', 'g'
            ),
            '-+', '-', 'g'
          )
          FROM 1 FOR 60
        )
      ),
      ''
    );
$$;

-- 2) Unique-slug helper: appends -2, -3, ... within a scope
--    scope_table and scope_col are validated against a small allow-list.
CREATE OR REPLACE FUNCTION public.next_unique_slug(
  base       text,
  scope_table text,
  scope_col  text,
  scope_val  uuid
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  candidate text;
  n         int := 1;
  found     int;
  safe_base text := coalesce(public.slugify(base), 'item');
BEGIN
  IF scope_table NOT IN ('assessments', 'assessment_attempts') THEN
    RAISE EXCEPTION 'next_unique_slug: unsupported scope_table %', scope_table;
  END IF;
  IF scope_col NOT IN ('org_id', 'assessment_id') THEN
    RAISE EXCEPTION 'next_unique_slug: unsupported scope_col %', scope_col;
  END IF;

  candidate := safe_base;
  LOOP
    EXECUTE format(
      'SELECT 1 FROM public.%I WHERE slug = $1 AND %I = $2 LIMIT 1',
      scope_table, scope_col
    ) INTO found USING candidate, scope_val;

    IF found IS NULL THEN
      RETURN candidate;
    END IF;

    n := n + 1;
    candidate := safe_base || '-' || n;
  END LOOP;
END;
$$;

-- =========================================================
-- ASSESSMENTS: slug unique per org
-- =========================================================
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.assessments_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    NEW.slug := public.next_unique_slug(NEW.title, 'assessments', 'org_id', NEW.org_id);
  ELSE
    NEW.slug := public.slugify(NEW.slug);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assessments_set_slug_trg ON public.assessments;
CREATE TRIGGER assessments_set_slug_trg
BEFORE INSERT OR UPDATE OF slug, title ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.assessments_set_slug();

-- Backfill existing rows
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id, title, org_id FROM public.assessments WHERE slug IS NULL ORDER BY created_at LOOP
    UPDATE public.assessments
       SET slug = public.next_unique_slug(r.title, 'assessments', 'org_id', r.org_id)
     WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS assessments_org_slug_uniq
  ON public.assessments (org_id, slug);

-- =========================================================
-- ASSESSMENT_ATTEMPTS: slug unique per assessment
--   base = candidate full name (from jsonb) else 'attempt'
-- =========================================================
ALTER TABLE public.assessment_attempts
  ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.assessment_attempts_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    base := coalesce(
      NULLIF(trim(NEW.candidate_details->>'fullName'), ''),
      NULLIF(trim(NEW.candidate_details->>'name'), ''),
      NULLIF(trim(NEW.candidate_details->>'email'), ''),
      'attempt'
    );
    NEW.slug := public.next_unique_slug(base, 'assessment_attempts', 'assessment_id', NEW.assessment_id);
  ELSE
    NEW.slug := public.slugify(NEW.slug);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assessment_attempts_set_slug_trg ON public.assessment_attempts;
CREATE TRIGGER assessment_attempts_set_slug_trg
BEFORE INSERT OR UPDATE OF slug, candidate_details ON public.assessment_attempts
FOR EACH ROW EXECUTE FUNCTION public.assessment_attempts_set_slug();

-- Backfill
DO $$
DECLARE r record;
DECLARE base text;
BEGIN
  FOR r IN
    SELECT id, assessment_id, candidate_details
      FROM public.assessment_attempts
     WHERE slug IS NULL
     ORDER BY created_at
  LOOP
    base := coalesce(
      NULLIF(trim(r.candidate_details->>'fullName'), ''),
      NULLIF(trim(r.candidate_details->>'name'), ''),
      NULLIF(trim(r.candidate_details->>'email'), ''),
      'attempt'
    );
    UPDATE public.assessment_attempts
       SET slug = public.next_unique_slug(base, 'assessment_attempts', 'assessment_id', r.assessment_id)
     WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS assessment_attempts_assessment_slug_uniq
  ON public.assessment_attempts (assessment_id, slug);
