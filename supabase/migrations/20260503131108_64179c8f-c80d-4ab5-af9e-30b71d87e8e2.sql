
create or replace function public.battle_finish(_battle_id uuid, _winner uuid, _reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  b record;
  loser uuid;
  delta int;
  win_before int;
  los_before int;
  caller uuid := auth.uid();
begin
  select * into b from public.battles where id = _battle_id for update;
  if not found then raise exception 'battle not found'; end if;
  if b.status = 'ended' then return; end if;
  if caller is null or caller not in (b.player_a, b.player_b) then
    if not has_role(coalesce(caller,'00000000-0000-0000-0000-000000000000'::uuid),'admin'::app_role) then
      raise exception 'not a participant';
    end if;
  end if;
  -- Players can only declare themselves winner, or forfeit themselves (winner = the other), or call with null for draw on expiry
  if _winner is not null and _winner not in (b.player_a, b.player_b) then raise exception 'invalid winner'; end if;
  if caller in (b.player_a, b.player_b) then
    if _reason = 'forfeit' then
      _winner := case when caller = b.player_a then b.player_b else b.player_a end;
    elsif _winner is not null and _winner <> caller and not has_role(caller,'admin'::app_role) then
      raise exception 'players can only declare themselves winner';
    end if;
  end if;

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
    set elo = elo + delta, peak_elo = greatest(peak_elo, elo + delta),
        wins = wins + 1, current_streak = current_streak + 1,
        best_streak = greatest(best_streak, current_streak + 1),
        total_battles = total_battles + 1, updated_at = now()
    where user_id = _winner;
  update public.player_ratings
    set elo = greatest(100, elo - delta), losses = losses + 1, current_streak = 0,
        total_battles = total_battles + 1, updated_at = now()
    where user_id = loser;

  insert into public.notifications(user_id, type, title, message, data)
  values
    (_winner, 'battle_result', 'Victory!', 'You won the battle (+' || delta || ' Elo)', jsonb_build_object('battle_id', _battle_id, 'delta', delta)),
    (loser,   'battle_result', 'Defeat',   'You lost the battle (-' || delta || ' Elo)', jsonb_build_object('battle_id', _battle_id, 'delta', -delta));
end $$;

grant execute on function public.battle_finish(uuid, uuid, text) to authenticated;
