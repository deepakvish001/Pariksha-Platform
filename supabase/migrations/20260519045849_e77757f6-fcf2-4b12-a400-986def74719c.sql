ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS allowed_email_domains text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS require_mfa boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_session_minutes integer;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_team_session_minutes_check
    CHECK (team_session_minutes IS NULL OR team_session_minutes IN (480, 1440, 10080));