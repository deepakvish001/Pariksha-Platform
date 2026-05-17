-- SOS status enum
do $$ begin
  create type public.sos_status as enum ('open','acknowledged','resolved');
exception when duplicate_object then null; end $$;

-- History table
create table if not exists public.assessment_sos_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  raised_by uuid not null,
  issue text not null,
  notes text,
  status public.sos_status not null default 'open',
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sos_attempt on public.assessment_sos_events(attempt_id);
create index if not exists idx_sos_status on public.assessment_sos_events(status);
create index if not exists idx_sos_raised_by on public.assessment_sos_events(raised_by);

alter table public.assessment_sos_events enable row level security;

-- Candidate: read & insert own
create policy "candidate reads own sos"
on public.assessment_sos_events for select
using (attempt_owner(attempt_id) = auth.uid());

create policy "candidate inserts own sos"
on public.assessment_sos_events for insert
with check (attempt_owner(attempt_id) = auth.uid() and raised_by = auth.uid());

-- Org proctors / recruiters: read & update (ack/resolve)
create policy "org reads sos"
on public.assessment_sos_events for select
using (is_org_member(attempt_assessment_org(attempt_id)));

create policy "org updates sos"
on public.assessment_sos_events for update
using (is_org_member(attempt_assessment_org(attempt_id)))
with check (is_org_member(attempt_assessment_org(attempt_id)));

-- updated_at trigger
create or replace function public.touch_sos_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_sos_touch on public.assessment_sos_events;
create trigger trg_sos_touch before update on public.assessment_sos_events
for each row execute function public.touch_sos_updated_at();
