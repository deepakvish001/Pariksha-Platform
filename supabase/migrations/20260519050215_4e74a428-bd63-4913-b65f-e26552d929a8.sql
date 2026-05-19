ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS notify_emails text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS slack_webhook_url text,
  ADD COLUMN IF NOT EXISTS daily_summary_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_alert_emails text[] DEFAULT '{}'::text[];