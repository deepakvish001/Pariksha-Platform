
-- ============= FEATURED CONTENT =============
create table if not exists public.featured_content (
  slot text primary key,
  target_type text not null,
  target_id text not null,
  weight int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.featured_content enable row level security;

drop policy if exists "featured public read" on public.featured_content;
create policy "featured public read" on public.featured_content
  for select using (true);

drop policy if exists "featured admin write" on public.featured_content;
create policy "featured admin write" on public.featured_content
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- ============= LIBRARY HIDDEN ITEMS =============
create table if not exists public.library_hidden_items (
  category text not null,
  item_id text not null,
  hidden_by uuid references auth.users(id),
  hidden_at timestamptz not null default now(),
  primary key (category, item_id)
);
alter table public.library_hidden_items enable row level security;

drop policy if exists "lhi public read" on public.library_hidden_items;
create policy "lhi public read" on public.library_hidden_items
  for select using (true);

drop policy if exists "lhi admin write" on public.library_hidden_items;
create policy "lhi admin write" on public.library_hidden_items
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- ============= ROADMAP OVERRIDES =============
create table if not exists public.roadmap_overrides (
  roadmap_id text primary key,
  is_published boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.roadmap_overrides enable row level security;

drop policy if exists "ro public read" on public.roadmap_overrides;
create policy "ro public read" on public.roadmap_overrides
  for select using (true);

drop policy if exists "ro admin write" on public.roadmap_overrides;
create policy "ro admin write" on public.roadmap_overrides
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- ============= SUPPORT MESSAGES =============
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  subject text not null,
  body text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  replied_at timestamptz,
  replied_by uuid references auth.users(id),
  reply_body text
);
alter table public.support_messages enable row level security;

drop policy if exists "sm public submit" on public.support_messages;
create policy "sm public submit" on public.support_messages
  for insert to anon, authenticated
  with check (true);

drop policy if exists "sm admin read" on public.support_messages;
create policy "sm admin read" on public.support_messages
  for select to authenticated
  using (public.has_role(auth.uid(),'admin'));

drop policy if exists "sm admin update" on public.support_messages;
create policy "sm admin update" on public.support_messages
  for update to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

drop policy if exists "sm admin delete" on public.support_messages;
create policy "sm admin delete" on public.support_messages
  for delete to authenticated
  using (public.has_role(auth.uid(),'admin'));

create index if not exists idx_support_messages_status_created
  on public.support_messages (status, created_at desc);

-- ============= LEADERBOARD HIDE FLAG =============
alter table public.user_profiles_extended
  add column if not exists leaderboard_hidden boolean not null default false;

-- ============= ADMIN RPCS =============

-- Manually grant an achievement
create or replace function public.admin_grant_achievement(_user_id uuid, _achievement_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    raise exception 'forbidden';
  end if;

  insert into public.user_achievements (user_id, achievement_id)
  values (_user_id, _achievement_id)
  on conflict do nothing;

  insert into public.admin_audit_log (actor_id, action, entity_type, entity_slug, diff)
  values (auth.uid(), 'grant_achievement', 'user', _user_id::text,
          jsonb_build_object('achievement_id', _achievement_id));
end;
$$;
revoke all on function public.admin_grant_achievement(uuid, text) from public;
grant execute on function public.admin_grant_achievement(uuid, text) to authenticated;

-- Placeholder for full recomputation (kept idempotent + safe; expand later as needed)
create or replace function public.admin_recompute_achievements(_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt int;
begin
  if not public.has_role(auth.uid(),'admin') then
    raise exception 'forbidden';
  end if;

  select count(*) into cnt from public.user_achievements where user_id = _user_id;

  insert into public.admin_audit_log (actor_id, action, entity_type, entity_slug, diff)
  values (auth.uid(), 'recompute_achievements', 'user', _user_id::text,
          jsonb_build_object('current_count', cnt));

  return cnt;
end;
$$;
revoke all on function public.admin_recompute_achievements(uuid) from public;
grant execute on function public.admin_recompute_achievements(uuid) to authenticated;

-- Recent auth events feed
create or replace function public.admin_recent_auth_events(_limit int default 50)
returns table (id uuid, created_at timestamptz, action text, ip_address text, payload jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    raise exception 'forbidden';
  end if;

  return query
  select e.id, e.created_at, e.payload->>'action' as action,
         e.ip_address::text, e.payload
  from auth.audit_log_entries e
  order by e.created_at desc
  limit greatest(1, least(_limit, 500));
end;
$$;
revoke all on function public.admin_recent_auth_events(int) from public;
grant execute on function public.admin_recent_auth_events(int) to authenticated;
