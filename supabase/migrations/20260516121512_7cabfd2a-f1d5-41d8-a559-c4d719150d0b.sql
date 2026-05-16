-- Idempotent migration: ensure invite_source enum + assessment_invites.source column
-- exist with a safe default. Safe to re-run on environments where the previous
-- migration already ran.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_source') THEN
    CREATE TYPE public.invite_source AS ENUM ('email', 'link', 'bulk_upload', 'manual', 'api');
  END IF;
END$$;

ALTER TABLE public.assessment_invites
  ADD COLUMN IF NOT EXISTS source public.invite_source NOT NULL DEFAULT 'manual';

-- Backfill any rows that somehow lack a source (defensive — default handles new rows).
UPDATE public.assessment_invites SET source = 'manual' WHERE source IS NULL;

CREATE INDEX IF NOT EXISTS assessment_invites_assessment_source_idx
  ON public.assessment_invites (assessment_id, source);