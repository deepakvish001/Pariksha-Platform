create extension if not exists pg_net with schema extensions;

create or replace function public.auto_seal_contest_session()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_key text;
begin
  -- Only fire on the transition into a terminal state.
  if (tg_op = 'UPDATE'
      and ((old.submitted_at is null and new.submitted_at is not null)
        or (old.terminated_at is null and new.terminated_at is not null))) then

    select decrypted_secret into v_url
      from vault.decrypted_secrets where name = 'project_url';
    select decrypted_secret into v_key
      from vault.decrypted_secrets where name = 'service_role_key';

    if v_url is null then
      v_url := 'https://lvnpvfxlmzbnylwkvgnq.supabase.co';
    end if;

    perform extensions.http_post(
      url := v_url || '/functions/v1/contest-session-seal',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(v_key, '')
      ),
      body := jsonb_build_object('mode', 'seal', 'sessionId', new.id)
    );
  end if;
  return new;
exception when others then
  -- Sealer issues must never block the session update.
  return new;
end;
$$;

drop trigger if exists trg_auto_seal_contest_session on public.contest_sessions;
create trigger trg_auto_seal_contest_session
after update on public.contest_sessions
for each row execute function public.auto_seal_contest_session();