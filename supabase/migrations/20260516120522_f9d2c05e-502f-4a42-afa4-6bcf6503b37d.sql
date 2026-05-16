-- Track how each candidate invite was created so the dashboard can report real channel mix.
CREATE TYPE public.invite_source AS ENUM ('email', 'link', 'bulk_upload', 'manual', 'api');

ALTER TABLE public.assessment_invites
  ADD COLUMN source public.invite_source NOT NULL DEFAULT 'manual';

CREATE INDEX idx_assessment_invites_assessment_source
  ON public.assessment_invites (assessment_id, source);