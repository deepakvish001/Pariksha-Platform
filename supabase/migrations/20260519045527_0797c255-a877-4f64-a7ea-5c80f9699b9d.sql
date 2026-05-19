ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS default_duration_min integer,
  ADD COLUMN IF NOT EXISTS default_proctoring text,
  ADD COLUMN IF NOT EXISTS default_pass_mark integer,
  ADD COLUMN IF NOT EXISTS allow_retake_default boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_release_results boolean DEFAULT true;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_default_proctoring_check
    CHECK (default_proctoring IS NULL OR default_proctoring IN ('off','basic','strict'));

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_default_duration_min_check
    CHECK (default_duration_min IS NULL OR (default_duration_min BETWEEN 5 AND 600));

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_default_pass_mark_check
    CHECK (default_pass_mark IS NULL OR (default_pass_mark BETWEEN 0 AND 100));