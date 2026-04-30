
-- ============================================================================
-- PHASE 1: ADMIN CONTROL CENTER — TABLES, RLS, AND RPCs
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. NEW TABLES
-- ─────────────────────────────────────────────────────────────

create table if not exists public.scheduled_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null default 'announcement',
  target_filter jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  recipient_count integer,
  cancelled_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_scheduled_broadcasts_pending
  on public.scheduled_broadcasts (scheduled_for) where sent_at is null and cancelled_at is null;

alter table public.scheduled_broadcasts enable row level security;

create policy "sb admin all" on public.scheduled_broadcasts
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- ─────────────────────────────────────────────────────────────

create table if not exists public.support_canned_replies (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  body text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_canned_replies enable row level security;

create policy "scr admin all" on public.support_canned_replies
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- ─────────────────────────────────────────────────────────────

create table if not exists public.admin_feature_flag_registry (
  key text primary key,
  type text not null check (type in ('boolean','number','string','json')),
  schema jsonb not null default '{}'::jsonb,
  description text,
  rollout_pct integer not null default 100 check (rollout_pct between 0 and 100),
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.admin_feature_flag_registry enable row level security;

create policy "affr admin all" on public.admin_feature_flag_registry
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "affr public read" on public.admin_feature_flag_registry
  for select to public using (true);

-- ─────────────────────────────────────────────────────────────

create table if not exists public.admin_session_invalidations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reason text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index if not exists idx_asi_user_created on public.admin_session_invalidations(user_id, created_at desc);

alter table public.admin_session_invalidations enable row level security;

create policy "asi admin all" on public.admin_session_invalidations
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "asi self read" on public.admin_session_invalidations
  for select to authenticated using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────

create table if not exists public.admin_outreach_hidden (
  template_id uuid primary key,
  hidden_by uuid,
  reason text,
  hidden_at timestamptz not null default now()
);

alter table public.admin_outreach_hidden enable row level security;

create policy "aoh admin all" on public.admin_outreach_hidden
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "aoh public read" on public.admin_outreach_hidden
  for select to public using (true);

-- ─────────────────────────────────────────────────────────────

alter table public.notifications add column if not exists sent_by_admin uuid;

-- ─────────────────────────────────────────────────────────────
-- 2. AUDIT HELPER (internal)
-- ─────────────────────────────────────────────────────────────

create or replace function public._admin_audit(_action text, _entity_type text, _entity_slug text, _diff jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_slug, diff)
  values (auth.uid(), _action, _entity_type, _entity_slug, coalesce(_diff, '{}'::jsonb));
end;
$$;

revoke all on function public._admin_audit(text, text, text, jsonb) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. NOTIFICATIONS ADMIN
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_list_notifications(
  _user_id uuid default null,
  _type text default null,
  _limit int default 100,
  _offset int default 0
)
returns table (
  id uuid, user_id uuid, full_name text, username text,
  type text, title text, message text, data jsonb,
  read boolean, created_at timestamptz, sent_by_admin uuid
)
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select n.id, n.user_id, p.full_name, p.username, n.type, n.title, n.message, n.data,
         n.read, n.created_at, n.sent_by_admin
  from public.notifications n
  left join public.profiles p on p.user_id = n.user_id
  where (_user_id is null or n.user_id = _user_id)
    and (_type is null or n.type = _type)
  order by n.created_at desc
  limit greatest(_limit, 1) offset greatest(_offset, 0);
end; $$;

create or replace function public.admin_send_notification(
  _user_id uuid, _title text, _message text, _type text default 'admin_message', _data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare _id uuid;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  if _user_id is null or coalesce(trim(_title), '') = '' or coalesce(trim(_message), '') = '' then
    raise exception 'user_id, title and message required';
  end if;
  insert into public.notifications (user_id, type, title, message, data, sent_by_admin)
  values (_user_id, coalesce(_type,'admin_message'), _title, _message, coalesce(_data,'{}'::jsonb), auth.uid())
  returning id into _id;
  perform _admin_audit('send_notification', 'notification', _id::text,
    jsonb_build_object('to', _user_id, 'title', _title, 'type', _type));
  return _id;
end; $$;

create or replace function public.admin_list_push_subscriptions(_user_id uuid default null, _limit int default 200)
returns table (id uuid, user_id uuid, full_name text, endpoint text, is_active boolean, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select ps.id, ps.user_id, p.full_name, ps.endpoint, ps.is_active, ps.created_at
  from public.push_subscriptions ps
  left join public.profiles p on p.user_id = ps.user_id
  where (_user_id is null or ps.user_id = _user_id)
  order by ps.created_at desc
  limit greatest(_limit, 1);
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 4. QUIZZES + SRS ADMIN
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_list_quiz_attempts(
  _user_id uuid default null, _category text default null, _limit int default 100, _offset int default 0
)
returns table (
  id uuid, user_id uuid, full_name text, username text,
  quiz_type text, category text, difficulty text,
  score int, total_questions int, accuracy numeric,
  total_time_seconds int, completed_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select q.id, q.user_id, p.full_name, p.username, q.quiz_type, q.category, q.difficulty,
         q.score, q.total_questions, q.accuracy, q.total_time_seconds, q.completed_at
  from public.quiz_results q
  left join public.profiles p on p.user_id = q.user_id
  where (_user_id is null or q.user_id = _user_id)
    and (_category is null or q.category = _category)
  order by q.completed_at desc
  limit greatest(_limit, 1) offset greatest(_offset, 0);
end; $$;

create or replace function public.admin_quiz_overview()
returns table (quiz_type text, category text, attempts bigint, avg_accuracy numeric, avg_time_sec numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select q.quiz_type, q.category, count(*)::bigint, round(avg(q.accuracy)::numeric, 2),
         round(avg(q.total_time_seconds)::numeric, 1)
  from public.quiz_results q
  group by q.quiz_type, q.category
  order by count(*) desc
  limit 200;
end; $$;

create or replace function public.admin_delete_quiz_attempt(_attempt_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  select user_id into _uid from public.quiz_results where id = _attempt_id;
  if _uid is null then raise exception 'Not found'; end if;
  delete from public.quiz_question_responses where quiz_result_id = _attempt_id;
  delete from public.quiz_results where id = _attempt_id;
  perform _admin_audit('delete_quiz_attempt', 'quiz_result', _attempt_id::text,
    jsonb_build_object('user_id', _uid));
end; $$;

create or replace function public.admin_reset_srs(_user_id uuid, _category text default null)
returns int language plpgsql security definer set search_path = public as $$
declare _n int;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  if _user_id is null then raise exception 'user_id required'; end if;
  with d as (
    delete from public.quiz_spaced_repetition
    where user_id = _user_id and (_category is null or question_category = _category)
    returning 1
  ) select count(*) into _n from d;
  perform _admin_audit('reset_srs', 'user', _user_id::text,
    jsonb_build_object('category', _category, 'rows_deleted', _n));
  return _n;
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 5. RESUMES ADMIN
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_list_resumes(_user_id uuid default null, _limit int default 100, _offset int default 0)
returns table (
  id uuid, user_id uuid, full_name text, file_name text, file_url text,
  overall_score int, ats_score int, created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select r.id, r.user_id, p.full_name, r.file_name, r.file_url,
         r.overall_score, r.ats_score, r.created_at
  from public.resume_analyses r
  left join public.profiles p on p.user_id = r.user_id
  where (_user_id is null or r.user_id = _user_id)
  order by r.created_at desc
  limit greatest(_limit, 1) offset greatest(_offset, 0);
end; $$;

create or replace function public.admin_delete_resume(_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare _user_id uuid; _file_url text;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  select user_id, file_url into _user_id, _file_url from public.resume_analyses where id = _id;
  if _user_id is null then raise exception 'Not found'; end if;
  delete from public.resume_analyses where id = _id;
  perform _admin_audit('delete_resume', 'resume_analysis', _id::text,
    jsonb_build_object('user_id', _user_id, 'file_url', _file_url));
  return _file_url;
end; $$;

create or replace function public.admin_resume_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare _out jsonb;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  select jsonb_build_object(
    'analyses_total', (select count(*) from public.resume_analyses),
    'analyses_30d',  (select count(*) from public.resume_analyses where created_at > now() - interval '30 days'),
    'avg_score',     (select round(avg(overall_score)::numeric, 1) from public.resume_analyses),
    'downloads_total', (select count(*) from public.resume_downloads),
    'top_templates', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select template_name as name, count(*) as downloads
        from public.resume_downloads group by template_name order by count(*) desc limit 10
      ) t
    )
  ) into _out;
  return _out;
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 6. CODING SUBMISSIONS / RUNS ADMIN
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_list_submissions(
  _user_id uuid default null, _problem_slug text default null,
  _verdict text default null, _limit int default 100, _offset int default 0
)
returns table (
  id uuid, user_id uuid, full_name text, problem_slug text, language text,
  verdict text, runtime_ms int, memory_kb int,
  passed_tests int, total_tests int, created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select s.id, s.user_id, p.full_name, s.problem_slug, s.language, s.verdict,
         s.runtime_ms, s.memory_kb, s.passed_tests, s.total_tests, s.created_at
  from public.code_submissions s
  left join public.profiles p on p.user_id = s.user_id
  where (_user_id is null or s.user_id = _user_id)
    and (_problem_slug is null or s.problem_slug = _problem_slug)
    and (_verdict is null or s.verdict = _verdict)
  order by s.created_at desc
  limit greatest(_limit, 1) offset greatest(_offset, 0);
end; $$;

create or replace function public.admin_submission_detail(_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _out jsonb;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  select to_jsonb(s) into _out from public.code_submissions s where id = _id;
  if _out is null then raise exception 'Not found'; end if;
  return _out;
end; $$;

create or replace function public.admin_problem_acceptance(_limit int default 50)
returns table (problem_slug text, total bigint, accepted bigint, acceptance numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select s.problem_slug, count(*)::bigint as total,
         count(*) filter (where s.verdict = 'accepted')::bigint as accepted,
         round(100.0 * count(*) filter (where s.verdict = 'accepted') / nullif(count(*),0), 2) as acceptance
  from public.code_submissions s
  group by s.problem_slug
  order by total desc
  limit greatest(_limit, 1);
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 7. CONVERSATIONS / CHAT ADMIN
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_list_conversations(_user_id uuid default null, _limit int default 100, _offset int default 0)
returns table (id uuid, user_id uuid, full_name text, title text, message_count bigint, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select c.id, c.user_id, p.full_name, c.title,
         (select count(*) from public.chat_messages m where m.conversation_id = c.id),
         c.updated_at
  from public.conversations c
  left join public.profiles p on p.user_id = c.user_id
  where (_user_id is null or c.user_id = _user_id)
  order by c.updated_at desc
  limit greatest(_limit, 1) offset greatest(_offset, 0);
end; $$;

create or replace function public.admin_chat_usage()
returns jsonb language plpgsql security definer set search_path = public as $$
declare _out jsonb;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  select jsonb_build_object(
    'conversations_total', (select count(*) from public.conversations),
    'messages_total',      (select count(*) from public.chat_messages),
    'active_users_30d',    (select count(distinct user_id) from public.conversations where updated_at > now() - interval '30 days'),
    'top_users', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select c.user_id, p.full_name, count(*) as conv_count
        from public.conversations c
        left join public.profiles p on p.user_id = c.user_id
        group by c.user_id, p.full_name
        order by conv_count desc
        limit 10
      ) t
    )
  ) into _out;
  return _out;
end; $$;

create or replace function public.admin_purge_user_conversations(_user_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare _n int;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  if _user_id is null then raise exception 'user_id required'; end if;
  delete from public.chat_messages
    where conversation_id in (select id from public.conversations where user_id = _user_id);
  with d as ( delete from public.conversations where user_id = _user_id returning 1 )
  select count(*) into _n from d;
  perform _admin_audit('purge_conversations', 'user', _user_id::text, jsonb_build_object('rows_deleted', _n));
  return _n;
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 8. OUTREACH ADMIN
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_list_outreach_templates(_q text default null, _limit int default 100, _offset int default 0)
returns table (
  id uuid, user_id uuid, full_name text, title text, platform text, category text,
  copies bigint, hidden boolean, created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select t.id, t.user_id, p.full_name, t.title, t.platform, t.category,
         (select count(*) from public.outreach_usage u where u.template_id = t.id::text)::bigint,
         (h.template_id is not null) as hidden,
         t.created_at
  from public.outreach_custom_templates t
  left join public.profiles p on p.user_id = t.user_id
  left join public.admin_outreach_hidden h on h.template_id = t.id
  where (_q is null or t.title ilike '%'||_q||'%' or t.body ilike '%'||_q||'%')
  order by t.created_at desc
  limit greatest(_limit, 1) offset greatest(_offset, 0);
end; $$;

create or replace function public.admin_set_outreach_hidden(_template_id uuid, _hidden boolean, _reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  if _hidden then
    insert into public.admin_outreach_hidden (template_id, hidden_by, reason)
    values (_template_id, auth.uid(), _reason)
    on conflict (template_id) do update set hidden_by = excluded.hidden_by, reason = excluded.reason, hidden_at = now();
  else
    delete from public.admin_outreach_hidden where template_id = _template_id;
  end if;
  perform _admin_audit(case when _hidden then 'hide_outreach' else 'unhide_outreach' end,
    'outreach_template', _template_id::text, jsonb_build_object('reason', _reason));
end; $$;

create or replace function public.admin_outreach_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare _out jsonb;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  select jsonb_build_object(
    'templates_total', (select count(*) from public.outreach_custom_templates),
    'copies_total',    (select count(*) from public.outreach_usage),
    'copies_30d',      (select count(*) from public.outreach_usage where copied_at > now() - interval '30 days'),
    'hidden_count',    (select count(*) from public.admin_outreach_hidden)
  ) into _out;
  return _out;
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 9. FOLDERS / SHARING ADMIN
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_list_shared_folders(_limit int default 100, _offset int default 0)
returns table (
  id uuid, folder_id uuid, share_code text, is_public boolean, allow_copy boolean,
  expires_at timestamptz, created_at timestamptz, owner_user_id uuid, owner_name text, folder_name text
)
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select s.id, s.folder_id, s.share_code, s.is_public, s.allow_copy, s.expires_at, s.created_at,
         f.user_id, p.full_name, f.name
  from public.shared_folders s
  left join public.user_folders f on f.id = s.folder_id
  left join public.profiles p on p.user_id = f.user_id
  order by s.created_at desc
  limit greatest(_limit, 1) offset greatest(_offset, 0);
end; $$;

create or replace function public.admin_revoke_share(_share_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  delete from public.shared_folders where id = _share_id;
  perform _admin_audit('revoke_share', 'shared_folder', _share_id::text, '{}'::jsonb);
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 10. SCHEDULED BROADCASTS ADMIN
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_schedule_broadcast(
  _title text, _message text, _type text, _target_filter jsonb, _scheduled_for timestamptz
)
returns uuid language plpgsql security definer set search_path = public as $$
declare _id uuid;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  if coalesce(trim(_title),'')='' or coalesce(trim(_message),'')='' then
    raise exception 'title and message required'; end if;
  insert into public.scheduled_broadcasts (title, message, type, target_filter, scheduled_for, created_by)
  values (_title, _message, coalesce(_type,'announcement'), coalesce(_target_filter,'{}'::jsonb), _scheduled_for, auth.uid())
  returning id into _id;
  perform _admin_audit('schedule_broadcast', 'scheduled_broadcast', _id::text,
    jsonb_build_object('scheduled_for', _scheduled_for, 'title', _title));
  return _id;
end; $$;

create or replace function public.admin_cancel_scheduled_broadcast(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  update public.scheduled_broadcasts set cancelled_at = now() where id = _id and sent_at is null;
  perform _admin_audit('cancel_scheduled_broadcast', 'scheduled_broadcast', _id::text, '{}'::jsonb);
end; $$;

create or replace function public.admin_list_scheduled_broadcasts(_only_pending boolean default false)
returns setof public.scheduled_broadcasts
language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  return query
  select * from public.scheduled_broadcasts
  where (not _only_pending) or (sent_at is null and cancelled_at is null)
  order by scheduled_for desc
  limit 500;
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 11. CANNED REPLIES + FEATURE FLAG REGISTRY + AUDIT PURGE
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_canned_reply_upsert(_id uuid, _label text, _body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare _out uuid;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  if _id is null then
    insert into public.support_canned_replies (label, body, created_by) values (_label, _body, auth.uid()) returning id into _out;
  else
    update public.support_canned_replies set label=_label, body=_body, updated_at=now() where id=_id returning id into _out;
  end if;
  perform _admin_audit('canned_reply_upsert', 'canned_reply', _out::text, jsonb_build_object('label', _label));
  return _out;
end; $$;

create or replace function public.admin_canned_reply_delete(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  delete from public.support_canned_replies where id = _id;
  perform _admin_audit('canned_reply_delete', 'canned_reply', _id::text, '{}'::jsonb);
end; $$;

create or replace function public.admin_flag_registry_upsert(_key text, _type text, _schema jsonb, _description text, _rollout_pct int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  if _type not in ('boolean','number','string','json') then raise exception 'invalid type'; end if;
  if _rollout_pct is null or _rollout_pct < 0 or _rollout_pct > 100 then raise exception 'rollout_pct must be 0-100'; end if;
  insert into public.admin_feature_flag_registry (key, type, schema, description, rollout_pct, updated_by, updated_at)
  values (_key, _type, coalesce(_schema,'{}'::jsonb), _description, _rollout_pct, auth.uid(), now())
  on conflict (key) do update set
    type = excluded.type, schema = excluded.schema, description = excluded.description,
    rollout_pct = excluded.rollout_pct, updated_by = excluded.updated_by, updated_at = now();
  perform _admin_audit('flag_registry_upsert', 'feature_flag', _key, jsonb_build_object('type', _type, 'rollout_pct', _rollout_pct));
end; $$;

create or replace function public.admin_purge_audit_older_than(_days int)
returns int language plpgsql security definer set search_path = public as $$
declare _n int;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  if _days is null or _days < 7 then raise exception 'days must be >= 7'; end if;
  with d as (
    delete from public.admin_audit_log where created_at < now() - (_days || ' days')::interval returning 1
  ) select count(*) into _n from d;
  perform _admin_audit('purge_audit_log', 'admin_audit_log', null, jsonb_build_object('days', _days, 'rows_deleted', _n));
  return _n;
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 12. FORCE LOGOUT
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_force_logout(_user_id uuid, _reason text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _id uuid;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then raise exception 'Forbidden'; end if;
  insert into public.admin_session_invalidations (user_id, reason, created_by)
  values (_user_id, _reason, auth.uid()) returning id into _id;
  perform _admin_audit('force_logout', 'user', _user_id::text, jsonb_build_object('reason', _reason));
  return _id;
end; $$;

create or replace function public.user_pending_logout(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_session_invalidations
    where user_id = _user_id and acknowledged_at is null
  );
$$;

create or replace function public.acknowledge_logout()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.admin_session_invalidations
  set acknowledged_at = now()
  where user_id = auth.uid() and acknowledged_at is null;
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 13. ACL HARDENING — every admin_* function: authenticated only
-- ─────────────────────────────────────────────────────────────

do $$
declare r record;
begin
  for r in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'admin\_%' escape '\'
  loop
    execute format('revoke all on function %I.%I(%s) from public, anon', r.nspname, r.proname, r.args);
    execute format('grant execute on function %I.%I(%s) to authenticated', r.nspname, r.proname, r.args);
  end loop;
end $$;

revoke all on function public.user_pending_logout(uuid) from public, anon;
grant execute on function public.user_pending_logout(uuid) to authenticated;
revoke all on function public.acknowledge_logout() from public, anon;
grant execute on function public.acknowledge_logout() to authenticated;
