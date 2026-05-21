-- DSA Practice Journal tables

create table if not exists public.practice_journal_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  mood smallint,
  focus_minutes int,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists idx_pjd_user_date on public.practice_journal_days (user_id, log_date desc);

alter table public.practice_journal_days enable row level security;

create policy "pjd select own" on public.practice_journal_days for select using (auth.uid() = user_id);
create policy "pjd insert own" on public.practice_journal_days for insert with check (auth.uid() = user_id);
create policy "pjd update own" on public.practice_journal_days for update using (auth.uid() = user_id);
create policy "pjd delete own" on public.practice_journal_days for delete using (auth.uid() = user_id);


create table if not exists public.practice_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null references public.practice_journal_days(id) on delete cascade,
  title text not null,
  links jsonb not null default '[]'::jsonb,
  topic text,
  pattern text,
  algorithm text,
  difficulty text check (difficulty in ('Easy','Medium','Hard')),
  personal_difficulty smallint check (personal_difficulty between 1 and 5),
  time_taken_min int,
  attempts int not null default 1,
  solved_clean boolean not null default false,
  mistakes text,
  learnings text,
  notes_md text,
  status text not null default 'solved' check (status in ('solved','partial','stuck')),
  tags text[] not null default '{}',
  next_revision_at date,
  ease_factor real not null default 2.5,
  interval_days int not null default 1,
  mastered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pje_user_day on public.practice_journal_entries (user_id, day_id);
create index if not exists idx_pje_user_revat on public.practice_journal_entries (user_id, next_revision_at);
create index if not exists idx_pje_user_topic on public.practice_journal_entries (user_id, topic);
create index if not exists idx_pje_user_pattern on public.practice_journal_entries (user_id, pattern);

alter table public.practice_journal_entries enable row level security;

create policy "pje select own" on public.practice_journal_entries for select using (auth.uid() = user_id);
create policy "pje insert own" on public.practice_journal_entries for insert with check (auth.uid() = user_id);
create policy "pje update own" on public.practice_journal_entries for update using (auth.uid() = user_id);
create policy "pje delete own" on public.practice_journal_entries for delete using (auth.uid() = user_id);


create table if not exists public.practice_journal_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.practice_journal_entries(id) on delete cascade,
  revised_on date not null default current_date,
  attempts int not null default 1,
  time_taken_min int,
  solved_clean boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pjr_entry on public.practice_journal_revisions (entry_id, revised_on desc);
create index if not exists idx_pjr_user on public.practice_journal_revisions (user_id, revised_on desc);

alter table public.practice_journal_revisions enable row level security;

create policy "pjr select own" on public.practice_journal_revisions for select using (auth.uid() = user_id);
create policy "pjr insert own" on public.practice_journal_revisions for insert with check (auth.uid() = user_id);
create policy "pjr update own" on public.practice_journal_revisions for update using (auth.uid() = user_id);
create policy "pjr delete own" on public.practice_journal_revisions for delete using (auth.uid() = user_id);


-- updated_at trigger (reuse if function exists)
create or replace function public.set_updated_at_pj()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_pjd_updated_at on public.practice_journal_days;
create trigger trg_pjd_updated_at before update on public.practice_journal_days
  for each row execute function public.set_updated_at_pj();

drop trigger if exists trg_pje_updated_at on public.practice_journal_entries;
create trigger trg_pje_updated_at before update on public.practice_journal_entries
  for each row execute function public.set_updated_at_pj();