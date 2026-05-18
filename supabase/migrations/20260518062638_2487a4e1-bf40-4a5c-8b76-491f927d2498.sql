create table if not exists public.contest_behavioral_baselines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.contest_sessions(id) on delete cascade,
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null,
  mean_inter_key_ms numeric not null,
  std_inter_key_ms numeric not null,
  mean_mouse_speed numeric not null default 0,
  std_mouse_speed numeric not null default 0,
  sample_n integer not null,
  calibrated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (session_id)
);

alter table public.contest_behavioral_baselines enable row level security;

create policy "candidate reads own baseline"
on public.contest_behavioral_baselines
for select
to authenticated
using (auth.uid() = user_id);

create policy "contest admin reads baselines"
on public.contest_behavioral_baselines
for select
to authenticated
using (
  exists (
    select 1 from public.contests c
    where c.id = contest_behavioral_baselines.contest_id
      and c.created_by = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
);

create index if not exists idx_behavioral_baselines_session
  on public.contest_behavioral_baselines(session_id);
create index if not exists idx_behavioral_baselines_contest_user
  on public.contest_behavioral_baselines(contest_id, user_id);