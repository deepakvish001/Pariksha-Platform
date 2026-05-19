create or replace function public.transfer_org_ownership(
  _org_id uuid,
  _new_owner_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_current_owner uuid;
begin
  if v_caller is null then
    raise exception 'not authenticated';
  end if;

  select owner_id into v_current_owner
  from public.organizations
  where id = _org_id
  for update;

  if v_current_owner is null then
    raise exception 'organization not found';
  end if;

  if v_current_owner <> v_caller then
    raise exception 'only the current owner can transfer ownership';
  end if;

  if _new_owner_user_id = v_caller then
    raise exception 'new owner must be a different user';
  end if;

  if not exists (
    select 1 from public.org_members
    where org_id = _org_id and user_id = _new_owner_user_id
  ) then
    raise exception 'new owner must already be a member of this organization';
  end if;

  update public.organizations
  set owner_id = _new_owner_user_id
  where id = _org_id;

  update public.org_members
  set role = 'owner'
  where org_id = _org_id and user_id = _new_owner_user_id;

  update public.org_members
  set role = 'admin'
  where org_id = _org_id and user_id = v_caller;

  insert into public.b2b_org_audit (org_id, actor_id, action, target, metadata)
  values (
    _org_id,
    v_caller,
    'org.ownership_transferred',
    _new_owner_user_id::text,
    jsonb_build_object('previous_owner', v_caller, 'new_owner', _new_owner_user_id)
  );
end;
$$;

revoke all on function public.transfer_org_ownership(uuid, uuid) from public;
grant execute on function public.transfer_org_ownership(uuid, uuid) to authenticated;