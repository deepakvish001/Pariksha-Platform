alter publication supabase_realtime add table public.attempt_events;
alter table public.attempt_events replica identity full;