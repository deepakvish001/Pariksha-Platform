-- Admin: full user detail (timeline, xp history, achievements)
create or replace function public.admin_user_detail(_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;

  select jsonb_build_object(
    'profile', (
      select to_jsonb(p) from (
        select pr.user_id, pr.full_name, pr.avatar_url, pe.username, pe.bio, pe.location,
               pe.total_xp, pe.current_level, pe.xp_this_week, pe.is_suspended,
               pe.suspended_reason, pe.suspended_at, pe.leaderboard_hidden,
               pe.coding_leaderboard_hidden, pe.created_at, pe.updated_at
        from profiles pr
        left join user_profiles_extended pe on pe.user_id = pr.user_id
        where pr.user_id = _user_id
        limit 1
      ) p
    ),
    'roles', coalesce((select jsonb_agg(role::text) from user_roles where user_id = _user_id), '[]'::jsonb),
    'achievements', coalesce((
      select jsonb_agg(jsonb_build_object('achievement_id', achievement_id, 'earned_at', earned_at) order by earned_at desc)
      from user_achievements where user_id = _user_id
    ), '[]'::jsonb),
    'xp_recent', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'amount', amount, 'source', source, 'description', description, 'created_at', created_at
      ) order by created_at desc)
      from (select * from xp_transactions where user_id = _user_id order by created_at desc limit 50) x
    ), '[]'::jsonb),
    'recent_submissions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'problem_slug', problem_slug, 'verdict', verdict, 'language', language, 'created_at', created_at
      ) order by created_at desc)
      from (select * from code_submissions where user_id = _user_id order by created_at desc limit 25) s
    ), '[]'::jsonb),
    'audit_actions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'action', action, 'entity_type', entity_type, 'entity_slug', entity_slug, 'created_at', created_at
      ) order by created_at desc)
      from (select * from admin_audit_log where actor_id = _user_id order by created_at desc limit 25) a
    ), '[]'::jsonb)
  )
  into result;

  return result;
end;
$$;

grant execute on function public.admin_user_detail(uuid) to authenticated;

-- Admin: revoke all achievements from a user
create or replace function public.admin_revoke_achievement(_user_id uuid, _achievement_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;
  delete from user_achievements where user_id = _user_id and achievement_id = _achievement_id;

  insert into admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  values (auth.uid(), 'achievement.revoke', 'user', _user_id::text, jsonb_build_object('achievement_id', _achievement_id));
end;
$$;

grant execute on function public.admin_revoke_achievement(uuid, text) to authenticated;

-- Admin: adjust XP (add/remove) with audit trail
create or replace function public.admin_adjust_xp(_user_id uuid, _amount int, _reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;

  insert into xp_transactions(user_id, amount, source, description)
  values (_user_id, _amount, 'admin_adjustment', coalesce(_reason, 'Admin adjustment'));

  update user_profiles_extended
  set total_xp = greatest(0, coalesce(total_xp,0) + _amount),
      updated_at = now()
  where user_id = _user_id;

  insert into admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  values (auth.uid(), 'xp.adjust', 'user', _user_id::text, jsonb_build_object('amount', _amount, 'reason', _reason));
end;
$$;

grant execute on function public.admin_adjust_xp(uuid, int, text) to authenticated;

-- Admin: leaderboard view (top users by XP) and toggle hide
create or replace function public.admin_leaderboard_top(_window text default 'all', _limit int default 100)
returns table(user_id uuid, full_name text, username text, avatar_url text,
              total_xp int, xp_this_week int, current_level int, leaderboard_hidden boolean)
language sql
security definer
set search_path = public
as $$
  select pe.user_id, pr.full_name, pe.username, pr.avatar_url,
         pe.total_xp, pe.xp_this_week, pe.current_level, pe.leaderboard_hidden
  from user_profiles_extended pe
  left join profiles pr on pr.user_id = pe.user_id
  where has_role(auth.uid(), 'admin'::app_role)
  order by case when _window = 'week' then pe.xp_this_week else pe.total_xp end desc nulls last
  limit greatest(1, least(_limit, 500));
$$;

grant execute on function public.admin_leaderboard_top(text, int) to authenticated;

create or replace function public.admin_set_leaderboard_hidden(_user_id uuid, _hidden boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;
  update user_profiles_extended set leaderboard_hidden = _hidden, updated_at = now() where user_id = _user_id;
  insert into admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  values (auth.uid(), 'leaderboard.hide', 'user', _user_id::text, jsonb_build_object('hidden', _hidden));
end;
$$;

grant execute on function public.admin_set_leaderboard_hidden(uuid, boolean) to authenticated;

-- Admin: force snapshot today's coding leaderboard (best effort - inserts top weighted)
create or replace function public.admin_force_snapshot_leaderboard()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted int := 0;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;

  with ranked as (
    select user_id,
           count(*) filter (where verdict = 'accepted')::int as solved,
           sum(case verdict when 'accepted' then 1.0 else 0.2 end)::numeric(12,2) as score,
           row_number() over (order by count(*) filter (where verdict = 'accepted') desc) as rk
    from code_submissions
    where created_at >= now() - interval '7 days'
    group by user_id
    order by solved desc
    limit 100
  )
  insert into coding_leaderboard_snapshots(snapshot_date, user_id, weighted_score, rank, window_kind, problems_solved)
  select current_date, user_id, score, rk::int, 'week', solved from ranked
  on conflict do nothing;

  get diagnostics inserted = row_count;

  insert into admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  values (auth.uid(), 'leaderboard.snapshot', 'system', null, jsonb_build_object('inserted', inserted));

  return inserted;
end;
$$;

grant execute on function public.admin_force_snapshot_leaderboard() to authenticated;

-- Admin: gamification rules read/write — stored as platform_settings keys
-- Convenience: read all rule keys
create or replace function public.admin_get_gamification_rules()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
  from platform_settings
  where key like 'gamification.%';
$$;

grant execute on function public.admin_get_gamification_rules() to authenticated, anon;

-- Admin: achievement counts per achievement_id
create or replace function public.admin_achievement_stats()
returns table(achievement_id text, earned_count bigint, last_earned timestamptz)
language sql
security definer
set search_path = public
as $$
  select achievement_id, count(*)::bigint, max(earned_at)
  from user_achievements
  where has_role(auth.uid(), 'admin'::app_role)
  group by achievement_id
  order by count(*) desc;
$$;

grant execute on function public.admin_achievement_stats() to authenticated;
