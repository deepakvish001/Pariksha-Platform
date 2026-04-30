-- 1) Revoke EXECUTE from PUBLIC and anon for every public.admin_* function
do $$
declare
  r record;
begin
  for r in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'admin\_%'
  loop
    execute format('revoke all on function %I.%I(%s) from public', r.nspname, r.proname, r.args);
    execute format('revoke all on function %I.%I(%s) from anon',   r.nspname, r.proname, r.args);
    execute format('grant execute on function %I.%I(%s) to authenticated', r.nspname, r.proname, r.args);
    execute format('grant execute on function %I.%I(%s) to service_role',  r.nspname, r.proname, r.args);
  end loop;
end$$;

-- 2) Add explicit admin checks where they were missing / filter-based.

-- admin_get_gamification_rules: was readable by anon and had no role check.
create or replace function public.admin_get_gamification_rules()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;
  return coalesce(
    (select jsonb_object_agg(key, value) from platform_settings where key like 'gamification.%'),
    '{}'::jsonb
  );
end;
$$;

-- admin_leaderboard_top: replace filter-based gating with explicit raise.
create or replace function public.admin_leaderboard_top(_window text default 'all', _limit int default 100)
returns table(user_id uuid, full_name text, username text, avatar_url text,
              total_xp int, xp_this_week int, current_level int, leaderboard_hidden boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;
  return query
  select pe.user_id, pr.full_name, pe.username, pr.avatar_url,
         pe.total_xp, pe.xp_this_week, pe.current_level, pe.leaderboard_hidden
  from user_profiles_extended pe
  left join profiles pr on pr.user_id = pe.user_id
  order by case when _window = 'week' then pe.xp_this_week else pe.total_xp end desc nulls last
  limit greatest(1, least(_limit, 500));
end;
$$;

-- admin_achievement_stats: replace filter-based gating with explicit raise.
create or replace function public.admin_achievement_stats()
returns table(achievement_id text, earned_count bigint, last_earned timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;
  return query
  select ua.achievement_id, count(*)::bigint, max(ua.earned_at)
  from user_achievements ua
  group by ua.achievement_id
  order by count(*) desc;
end;
$$;

-- 3) Re-apply revokes/grants on the three functions we just replaced (CREATE OR REPLACE resets ACL to default).
revoke all on function public.admin_get_gamification_rules() from public;
revoke all on function public.admin_get_gamification_rules() from anon;
grant execute on function public.admin_get_gamification_rules() to authenticated;

revoke all on function public.admin_leaderboard_top(text, int) from public;
revoke all on function public.admin_leaderboard_top(text, int) from anon;
grant execute on function public.admin_leaderboard_top(text, int) to authenticated;

revoke all on function public.admin_achievement_stats() from public;
revoke all on function public.admin_achievement_stats() from anon;
grant execute on function public.admin_achievement_stats() to authenticated;
