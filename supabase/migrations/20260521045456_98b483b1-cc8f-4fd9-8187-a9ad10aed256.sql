-- Practice Hub: enrich entries with code, complexity, companies, confidence, favorite, snooze, source, archive.
ALTER TABLE public.practice_journal_entries
  ADD COLUMN IF NOT EXISTS code_snippet text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS time_complexity text,
  ADD COLUMN IF NOT EXISTS space_complexity text,
  ADD COLUMN IF NOT EXISTS companies text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS confidence integer,
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS snoozed_until date,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_pj_entries_due
  ON public.practice_journal_entries (user_id, next_revision_at)
  WHERE mastered_at IS NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pj_entries_tags
  ON public.practice_journal_entries USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_pj_entries_companies
  ON public.practice_journal_entries USING GIN (companies);

CREATE INDEX IF NOT EXISTS idx_pj_entries_favorite
  ON public.practice_journal_entries (user_id, is_favorite)
  WHERE is_favorite = true;