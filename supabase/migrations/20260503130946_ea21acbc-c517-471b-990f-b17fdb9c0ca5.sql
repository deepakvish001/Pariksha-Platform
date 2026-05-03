
-- ============ ENUMS ============
do $$ begin
  create type public.battle_status as enum ('pending','live','ended','abandoned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.battle_difficulty as enum ('easy','medium','hard');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.friendship_status as enum ('pending','accepted','blocked');
exception when duplicate_object then null; end $$;

-- ============ player_ratings ============
create table if not exists public.player_ratings (
  user_id uuid primary key,
  elo integer not null default 1000,
  peak_elo integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  total_battles integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.player_ratings enable row level security;
create policy "ratings public read" on public.player_ratings for select using (true);
create policy "ratings self upsert" on public.player_ratings for insert to authenticated with check (auth.uid() = user_id);

-- ============ battle_queue ============
create table if not exists public.battle_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  topic text,
  difficulty public.battle_difficulty not null default 'medium',
  elo integer not null default 1000,
  status text not null default 'waiting',
  joined_at timestamptz not null default now()
);
create index if not exists battle_queue_match_idx on public.battle_queue(status, difficulty, elo);
alter table public.battle_queue enable row level security;
create policy "queue self all" on public.battle_queue for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "queue admin read" on public.battle_queue for select to authenticated using (has_role(auth.uid(),'admin'::app_role));

-- ============ battles ============
create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  player_a uuid not null,
  player_b uuid not null,
  problem_slug text not null,
  topic text,
  difficulty public.battle_difficulty not null default 'medium',
  status public.battle_status not null default 'pending',
  duration_sec integer not null default 900,
  started_at timestamptz,
  ends_at timestamptz,
  ended_at timestamptz,
  winner_id uuid,
  end_reason text,
  is_private boolean not null default false,
  invite_code text,
  elo_a_before integer,
  elo_b_before integer,
  elo_a_after integer,
  elo_b_after integer,
  created_at timestamptz not null default now()
);
create index if not exists battles_status_idx on public.battles(status, started_at desc);
create index if not exists battles_players_idx on public.battles(player_a, player_b);
alter table public.battles enable row level security;
create policy "battles participant read" on public.battles for select using (
  auth.uid() in (player_a, player_b) or has_role(auth.uid(),'admin'::app_role)
);
create policy "battles admin all" on public.battles for all to authenticated
  using (has_role(auth.uid(),'admin'::app_role)) with check (has_role(auth.uid(),'admin'::app_role));

-- ============ battle_events ============
create table if not exists public.battle_events (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists battle_events_battle_idx on public.battle_events(battle_id, created_at);
alter table public.battle_events enable row level security;
create policy "events participant read" on public.battle_events for select using (
  exists (select 1 from public.battles b where b.id = battle_id and (auth.uid() in (b.player_a, b.player_b) or has_role(auth.uid(),'admin'::app_role)))
);
create policy "events participant insert" on public.battle_events for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.battles b where b.id = battle_id and auth.uid() in (b.player_a, b.player_b) and b.status = 'live'
  )
);

-- ============ battle_submissions ============
create table if not exists public.battle_submissions (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null,
  language text not null,
  source_code text not null,
  passed integer not null default 0,
  total integer not null default 0,
  verdict text not null,
  runtime_ms integer,
  created_at timestamptz not null default now()
);
create index if not exists battle_subs_battle_idx on public.battle_submissions(battle_id, created_at);
alter table public.battle_submissions enable row level security;
create policy "battle subs participant read" on public.battle_submissions for select using (
  exists (select 1 from public.battles b where b.id = battle_id and (auth.uid() in (b.player_a, b.player_b) or (b.status='ended' and has_role(auth.uid(),'admin'::app_role))))
);
create policy "battle subs self insert" on public.battle_submissions for insert to authenticated with check (auth.uid() = user_id);

-- ============ battle_achievements ============
create table if not exists public.battle_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  achievement_key text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);
alter table public.battle_achievements enable row level security;
create policy "battle achievements public read" on public.battle_achievements for select using (true);

-- ============ friendships ============
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null,
  addressee_id uuid not null,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
alter table public.friendships enable row level security;
create policy "friendships parties read" on public.friendships for select using (auth.uid() in (requester_id, addressee_id));
create policy "friendships requester insert" on public.friendships for insert to authenticated with check (auth.uid() = requester_id);
create policy "friendships parties update" on public.friendships for update to authenticated using (auth.uid() in (requester_id, addressee_id)) with check (auth.uid() in (requester_id, addressee_id));
create policy "friendships parties delete" on public.friendships for delete to authenticated using (auth.uid() in (requester_id, addressee_id));

-- ============ battle_invites ============
create table if not exists public.battle_invites (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null,
  to_user uuid not null,
  battle_id uuid references public.battles(id) on delete set null,
  problem_slug text,
  difficulty public.battle_difficulty not null default 'medium',
  duration_sec integer not null default 900,
  status text not null default 'pending',
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  created_at timestamptz not null default now()
);
alter table public.battle_invites enable row level security;
create policy "invites parties read" on public.battle_invites for select using (auth.uid() in (from_user, to_user));
create policy "invites sender insert" on public.battle_invites for insert to authenticated with check (auth.uid() = from_user);
create policy "invites parties update" on public.battle_invites for update to authenticated using (auth.uid() in (from_user, to_user)) with check (auth.uid() in (from_user, to_user));

-- ============ helper: ensure rating row ============
create or replace function public.ensure_player_rating(_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.player_ratings(user_id) values (_user)
  on conflict (user_id) do nothing;
end $$;

-- ============ Elo math ============
create or replace function public.calc_elo_delta(_winner_elo int, _loser_elo int, _k int default 32)
returns int language plpgsql immutable as $$
declare expected numeric;
begin
  expected := 1.0 / (1.0 + power(10.0, (_loser_elo - _winner_elo)::numeric / 400.0));
  return greatest(1, round(_k * (1 - expected)));
end $$;

-- ============ matchmaking ============
create or replace function public.battle_matchmake(_topic text, _difficulty public.battle_difficulty)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  my_elo int;
  opp record;
  new_battle uuid;
  problem_slug text;
begin
  if me is null then raise exception 'auth required'; end if;
  perform public.ensure_player_rating(me);
  select elo into my_elo from public.player_ratings where user_id = me;

  -- upsert my queue row
  insert into public.battle_queue(user_id, topic, difficulty, elo)
  values (me, _topic, _difficulty, my_elo)
  on conflict (user_id) do update
    set topic = excluded.topic, difficulty = excluded.difficulty, elo = excluded.elo,
        status = 'waiting', joined_at = now();

  -- find opponent (widening windows: 100, 200, 400, any)
  for opp in
    select * from public.battle_queue
    where user_id <> me and status = 'waiting' and difficulty = _difficulty
      and (_topic is null or topic = _topic or topic is null)
    order by abs(elo - my_elo) asc, joined_at asc
    limit 1
  loop
    -- pick a random published problem matching difficulty
    select slug into problem_slug from public.coding_problems
    where is_published = true and difficulty = _difficulty::text
    order by random() limit 1;

    if problem_slug is null then
      select slug into problem_slug from public.coding_problems where is_published = true order by random() limit 1;
    end if;
    if problem_slug is null then raise exception 'no problems available'; end if;

    insert into public.battles(player_a, player_b, problem_slug, topic, difficulty, status, duration_sec, started_at, ends_at, elo_a_before, elo_b_before)
    values (me, opp.user_id, problem_slug, _topic, _difficulty, 'live', 900, now(), now() + interval '15 minutes', my_elo, opp.elo)
    returning id into new_battle;

    delete from public.battle_queue where user_id in (me, opp.user_id);
    return new_battle;
  end loop;

  return null; -- still waiting
end $$;

-- ============ finish battle ============
create or replace function public.battle_finish(_battle_id uuid, _winner uuid, _reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  b record;
  loser uuid;
  delta int;
  win_before int;
  los_before int;
begin
  select * into b from public.battles where id = _battle_id for update;
  if not found then raise exception 'battle not found'; end if;
  if b.status = 'ended' then return; end if;
  if _winner is not null and _winner not in (b.player_a, b.player_b) then raise exception 'invalid winner'; end if;

  perform public.ensure_player_rating(b.player_a);
  perform public.ensure_player_rating(b.player_b);

  if _winner is null then
    update public.battles set status='ended', ended_at=now(), end_reason=coalesce(_reason,'draw'),
      elo_a_after = b.elo_a_before, elo_b_after = b.elo_b_before
    where id = _battle_id;
    update public.player_ratings set draws = draws+1, total_battles = total_battles+1, updated_at = now()
      where user_id in (b.player_a, b.player_b);
    return;
  end if;

  loser := case when _winner = b.player_a then b.player_b else b.player_a end;
  win_before := case when _winner = b.player_a then b.elo_a_before else b.elo_b_before end;
  los_before := case when _winner = b.player_a then b.elo_b_before else b.elo_a_before end;
  delta := public.calc_elo_delta(win_before, los_before, 32);

  update public.battles set status='ended', ended_at=now(), winner_id=_winner, end_reason=coalesce(_reason,'solved'),
    elo_a_after = case when _winner = b.player_a then b.elo_a_before + delta else b.elo_a_before - delta end,
    elo_b_after = case when _winner = b.player_b then b.elo_b_before + delta else b.elo_b_before - delta end
  where id = _battle_id;

  update public.player_ratings
    set elo = elo + delta,
        peak_elo = greatest(peak_elo, elo + delta),
        wins = wins + 1,
        current_streak = current_streak + 1,
        best_streak = greatest(best_streak, current_streak + 1),
        total_battles = total_battles + 1,
        updated_at = now()
    where user_id = _winner;

  update public.player_ratings
    set elo = greatest(100, elo - delta),
        losses = losses + 1,
        current_streak = 0,
        total_battles = total_battles + 1,
        updated_at = now()
    where user_id = loser;

  insert into public.notifications(user_id, type, title, message, data)
  values
    (_winner, 'battle_result', 'Victory!', 'You won the battle (+' || delta || ' Elo)', jsonb_build_object('battle_id', _battle_id, 'delta', delta)),
    (loser,   'battle_result', 'Defeat',   'You lost the battle (-' || delta || ' Elo)', jsonb_build_object('battle_id', _battle_id, 'delta', -delta));
end $$;

-- ============ private invite create ============
create or replace function public.battle_create_private(_to_user uuid, _problem_slug text, _difficulty public.battle_difficulty, _duration int default 900)
returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); inv uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  if me = _to_user then raise exception 'cannot invite yourself'; end if;
  insert into public.battle_invites(from_user, to_user, problem_slug, difficulty, duration_sec)
  values (me, _to_user, _problem_slug, _difficulty, _duration)
  returning id into inv;
  insert into public.notifications(user_id, type, title, message, data)
    values (_to_user, 'battle_invite', 'Battle Invite', 'You have a new 1v1 challenge', jsonb_build_object('invite_id', inv));
  return inv;
end $$;

-- ============ accept invite ============
create or replace function public.battle_accept_invite(_invite uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare i record; new_battle uuid; ea int; eb int;
begin
  select * into i from public.battle_invites where id = _invite for update;
  if not found or i.to_user <> auth.uid() then raise exception 'invite not found'; end if;
  if i.status <> 'pending' or i.expires_at < now() then raise exception 'invite expired'; end if;

  perform public.ensure_player_rating(i.from_user);
  perform public.ensure_player_rating(i.to_user);
  select elo into ea from public.player_ratings where user_id = i.from_user;
  select elo into eb from public.player_ratings where user_id = i.to_user;

  insert into public.battles(player_a, player_b, problem_slug, difficulty, status, duration_sec, started_at, ends_at, is_private, elo_a_before, elo_b_before)
  values (i.from_user, i.to_user, i.problem_slug, i.difficulty, 'live', i.duration_sec, now(), now() + (i.duration_sec || ' seconds')::interval, true, ea, eb)
  returning id into new_battle;

  update public.battle_invites set status='accepted', battle_id=new_battle where id=_invite;
  return new_battle;
end $$;

-- ============ realtime publication ============
alter publication supabase_realtime add table public.battles;
alter publication supabase_realtime add table public.battle_events;
alter publication supabase_realtime add table public.battle_queue;
alter publication supabase_realtime add table public.battle_invites;
alter publication supabase_realtime add table public.friendships;
