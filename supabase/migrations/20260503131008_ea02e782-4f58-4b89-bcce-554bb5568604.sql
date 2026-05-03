
revoke execute on function public.battle_matchmake(text, public.battle_difficulty) from public, anon;
revoke execute on function public.battle_finish(uuid, uuid, text) from public, anon;
revoke execute on function public.battle_create_private(uuid, text, public.battle_difficulty, int) from public, anon;
revoke execute on function public.battle_accept_invite(uuid) from public, anon;
revoke execute on function public.ensure_player_rating(uuid) from public, anon;
grant execute on function public.battle_matchmake(text, public.battle_difficulty) to authenticated;
grant execute on function public.battle_create_private(uuid, text, public.battle_difficulty, int) to authenticated;
grant execute on function public.battle_accept_invite(uuid) to authenticated;
-- battle_finish stays restricted (server only via edge function with service role)
