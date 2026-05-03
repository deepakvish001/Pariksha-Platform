## Goal

Round out the Arena into a complete end-to-end multiplayer flow with two clear ways to play with a specific person:

1. **Find Match by Code** — host generates a room code, opponent joins with that code (no friendship required).
2. **Join Through Code** — single input box on the Arena home to instantly enter a room code.

Plus polish the existing Quick Match queue, Private Invites, and Battle Result flows so the loop feels finished.

---

## What gets built

### 1. Database — room codes (migration)

Add a public-room-code mechanism on top of the existing `battle_invites` table (already has `invite_code` column on `battles`, but invites use IDs only).

- Add column `battle_invites.code text unique` (6-char uppercase alphanumeric).
- New RPC `battle_create_code(_problem_slug text, _difficulty, _duration int)` — creates a "code invite" with `to_user = NULL` allowed (relax NOT NULL → make `to_user` nullable on `battle_invites`), returns `{ invite_id, code }`. Code expires in 10 minutes.
- New RPC `battle_join_code(_code text)` — looks up pending invite by code, sets `to_user = auth.uid()`, then performs the same logic as `battle_accept_invite` (creates `battles` row, marks invite accepted), returns the new `battle_id`.
- RLS update on `battle_invites`: allow SELECT of pending code-invites by code lookup (we'll do this via the RPC `security definer`, so policies stay strict — no public reads).
- Index on `battle_invites(code) where status='pending'`.

### 2. Arena Home — three CTAs

Restructure `ArenaHome.tsx` into three side-by-side action cards under the hero:

```text
┌──────────────┬──────────────┬──────────────┐
│ Quick Match  │ Create Room  │ Join by Code │
│ (Elo queue)  │ (get a code) │ (enter code) │
└──────────────┴──────────────┴──────────────┘
```

- **Quick Match**: existing topic + difficulty selector → `joinQueue` → `/arena/queue`.
- **Create Room**: pick problem (searchable select) + difficulty + duration (5/10/15 min) → calls `battle_create_code` → opens a "Waiting Room" modal showing the big code, copy button, share link `/arena/join/:code`, and live status. When opponent joins, auto-navigates both to `/arena/battle/:id`.
- **Join by Code**: 6-char input (auto-uppercase, monospace) + Join button → `battle_join_code` → navigates to battle. Errors (expired/invalid/self-join) shown inline.

### 3. New routes

- `/arena/room/:code` — Host waiting room (subscribes to `battle_invites` by id; on `status='accepted'` redirects to `/arena/battle/:battle_id`). Cancel button deletes invite.
- `/arena/join/:code` — Auto-fills code field and triggers join (for shared links). Shows confirm screen with problem title + difficulty before joining.

### 4. Quick Match queue polish (`ArenaQueue.tsx`)

- Show selected topic/difficulty chips at top.
- Auto-retry matchmake every 5s while waiting (calls `battle_matchmake` again so two players who arrive seconds apart get paired).
- "Cancel" deletes from `battle_queue` and returns to `/arena`.
- Estimated wait text based on `elapsed`.

### 5. Private Invites tab cleanup (`ArenaPrivate.tsx`)

- Keep friend-based invite flow but add a second tab inside the page: **Friend Invite** | **Room Code** (mirrors home Create Room).
- Show outgoing invites with status (pending/accepted/expired) and a Cancel action.
- Incoming invites already render — add problem title (join `coding_problems` by slug) and difficulty badge.

### 6. Battle Result page touch-up (`BattleResult.tsx`)

- "Rematch" button → creates a new code-room with same problem/difficulty pre-selected, navigates to `/arena/room/:code`.
- "Back to Arena" + "View Leaderboard" buttons.

### 7. Hooks (`src/arena/hooks.ts`)

Add:
- `createCodeRoom({ problemSlug, difficulty, duration })` → calls `battle_create_code`.
- `joinByCode(code)` → calls `battle_join_code`, throws on error.
- `useInviteWatcher(inviteId)` — realtime subscription on `battle_invites` row; fires `onAccepted(battleId)`.

---

## Technical details

**Migration sketch**
```sql
alter table public.battle_invites
  alter column to_user drop not null,
  add column code text;

create unique index battle_invites_code_pending_idx
  on public.battle_invites(code) where status = 'pending';

create or replace function public.battle_create_code(
  _problem_slug text, _difficulty public.battle_difficulty, _duration int default 900
) returns table(invite_id uuid, code text)
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c text; new_id uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  -- 6-char code, retry on collision
  for i in 1..5 loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into public.battle_invites(from_user, to_user, problem_slug, difficulty, duration_sec, code, expires_at)
      values (me, null, _problem_slug, _difficulty, _duration, c, now() + interval '10 minutes')
      returning id into new_id;
      return query select new_id, c;
      return;
    exception when unique_violation then continue;
    end;
  end loop;
  raise exception 'could not allocate code';
end $$;

create or replace function public.battle_join_code(_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare i record; new_battle uuid; ea int; eb int;
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  select * into i from public.battle_invites
    where code = upper(_code) and status='pending' for update;
  if not found then raise exception 'invalid code'; end if;
  if i.expires_at < now() then raise exception 'code expired'; end if;
  if i.from_user = auth.uid() then raise exception 'cannot join your own room'; end if;

  perform public.ensure_player_rating(i.from_user);
  perform public.ensure_player_rating(auth.uid());
  select elo into ea from public.player_ratings where user_id = i.from_user;
  select elo into eb from public.player_ratings where user_id = auth.uid();

  insert into public.battles(player_a, player_b, problem_slug, difficulty, status, duration_sec,
    started_at, ends_at, is_private, elo_a_before, elo_b_before)
  values (i.from_user, auth.uid(), i.problem_slug, i.difficulty, 'live', i.duration_sec,
    now(), now() + (i.duration_sec || ' seconds')::interval, true, ea, eb)
  returning id into new_battle;

  update public.battle_invites
    set status='accepted', battle_id=new_battle, to_user=auth.uid()
    where id = i.id;
  return new_battle;
end $$;

revoke execute on function public.battle_create_code(text, public.battle_difficulty, int) from public, anon;
revoke execute on function public.battle_join_code(text) from public, anon;
grant execute on function public.battle_create_code(text, public.battle_difficulty, int) to authenticated;
grant execute on function public.battle_join_code(text) to authenticated;
```

**Files**
- New migration `supabase/migrations/<ts>_arena_room_codes.sql`
- Edit `src/arena/hooks.ts` — add `createCodeRoom`, `joinByCode`, `useInviteWatcher`
- Edit `src/arena/pages/ArenaHome.tsx` — three CTAs layout
- New `src/arena/pages/ArenaRoom.tsx` — host waiting room
- New `src/arena/pages/ArenaJoinCode.tsx` — auto-join via shared link
- Edit `src/arena/pages/ArenaQueue.tsx` — auto-retry, chips
- Edit `src/arena/pages/ArenaPrivate.tsx` — tabs + outgoing invite list
- Edit `src/arena/pages/BattleResult.tsx` — rematch CTA
- Edit `src/App.tsx` — register `/arena/room/:code` and `/arena/join/:code`

**Realtime**
Existing `battle_invites` table is already in `supabase_realtime` publication, so the host's waiting room will receive `UPDATE` events when the invite flips to `accepted`.

---

## Out of scope
- Spectator mode, chat in battle room, ranked seasons (existing memory shows these are not requested now).
- No changes to existing matchmaking/Elo math — only additive RPCs.
