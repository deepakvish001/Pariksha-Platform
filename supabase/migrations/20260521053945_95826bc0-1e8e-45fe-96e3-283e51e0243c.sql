ALTER TABLE public.practice_journal_entries
  ADD COLUMN IF NOT EXISTS started_at  timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at    timestamptz,
  ADD COLUMN IF NOT EXISTS session_label text;

CREATE INDEX IF NOT EXISTS idx_pje_user_started
  ON public.practice_journal_entries (user_id, started_at);