create table if not exists public.contest_session_seals (
  session_id uuid primary key references public.contest_sessions(id) on delete cascade,
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null,
  root_hash text not null,
  hmac text not null,
  components jsonb not null default '{}'::jsonb,
  sealed_at timestamptz not null default now(),
  sealed_by uuid
);

alter table public.contest_session_seals enable row level security;

create policy "candidate reads own seal"
on public.contest_session_seals
for select
to authenticated
using (auth.uid() = user_id);

create policy "contest owner/admin reads seals"
on public.contest_session_seals
for select
to authenticated
using (
  exists (
    select 1 from public.contests c
    where c.id = contest_session_seals.contest_id
      and c.created_by = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
);

create index if not exists idx_session_seals_contest on public.contest_session_seals(contest_id);
create index if not exists idx_session_seals_user on public.contest_session_seals(user_id);