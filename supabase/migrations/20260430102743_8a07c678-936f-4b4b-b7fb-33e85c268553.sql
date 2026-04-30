alter table public.scheduled_broadcasts
  add column if not exists recipients_count integer not null default 0;