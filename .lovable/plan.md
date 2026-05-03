## Byteskill Battle Arena — Real-Time 1v1 Coding Battles

A full multiplayer layer on top of the existing problems/exec/auth stack. Built with the project's current tools (React + Vite + TS, Supabase, Tailwind, Framer Motion, Zustand) — not Next.js (project is Vite/React). All UI follows the existing deep-black + glassmorphism aesthetic with added neon battle accents.

### 1. Database (Supabase migrations)

New tables, all with strict RLS:

- `battle_queue` — `user_id`, `topic`, `difficulty`, `elo`, `joined_at`, `status` (waiting/matched/cancelled). RLS: user CRUD own row; admin read.
- `battles` — `id`, `player_a`, `player_b`, `problem_slug`, `topic`, `difficulty`, `status` (pending/live/ended/abandoned), `started_at`, `ends_at`, `duration_sec`, `winner_id`, `end_reason`, `is_private`, `invite_code`, `elo_a_before/after`, `elo_b_before/after`. RLS: participants + admin.
- `battle_events` — append-only realtime feed: `battle_id`, `user_id`, `kind` (typing/test_run/submit/passed_tests/finished/forfeit), `payload jsonb`, `created_at`. RLS: participants insert own; participants read.
- `battle_submissions` — links to existing `code_submissions`, plus `battle_id`, `passed`, `runtime_ms`, `score`. RLS: participants read; owner insert.
- `player_ratings` — `user_id` PK, `elo` (default 1000), `peak_elo`, `wins`, `losses`, `draws`, `current_streak`, `best_streak`, `updated_at`. RLS: public read, system write.
- `battle_achievements` — `user_id`, `achievement_key`, `earned_at`. Public read.
- `friendships` — `requester_id`, `addressee_id`, `status` (pending/accepted/blocked). RLS: both parties.
- `battle_invites` — `from_user`, `to_user`, `battle_id`, `status`, `expires_at`. RLS: sender + recipient.
- `battle_notifications` — reuses existing `notifications` table with new `type` values (`battle_invite`, `battle_result`, `friend_request`, `rank_up`).

SQL functions (SECURITY DEFINER):
- `match_make(_user, _topic, _difficulty)` — atomic queue scan, picks closest-Elo opponent (±100 → ±300 widening), creates `battles` row, deletes both queue rows, returns battle id.
- `start_battle(_battle_id)` — sets status=live, starts timer.
- `finish_battle(_battle_id, _winner, _reason)` — locks battle, computes Elo delta (K=32, classic formula), updates `player_ratings`, awards achievements, inserts notifications.
- `create_private_battle(_problem_slug, _opponent, _duration)` — invite flow.
- `accept_friend(_id)` / `reject_friend(_id)`.

Realtime: enable publication on `battles`, `battle_events`, `battle_queue`, `battle_invites`, `friendships`, `battle_notifications`.

### 2. Edge Functions

- `battle-matchmake` — wraps `match_make` RPC with rate-limit + telemetry.
- `battle-grade` — called on submit: runs hidden tests via existing `submit-code` path, records `battle_submissions`, emits `battle_event`, calls `finish_battle` if win condition met (all tests pass first).
- `battle-tick` — cron (pg_cron, every 30s) ends expired battles, applies forfeit Elo if one player solved more tests.
- `battle-elo-recompute` — admin manual fix tool.

### 3. Frontend routes (React Router)

- `/arena` — landing: rank card, Quick Match CTA, topic picker, recent battles, top players.
- `/arena/queue` — animated searching state, ETA, cancel.
- `/arena/battle/:id` — the battle room (see §4).
- `/arena/result/:id` — post-match recap: diff of submissions, Elo delta animation, share card.
- `/arena/leaderboard` — global + topic filters, time windows, friends-only toggle.
- `/arena/profile/:username` — stats, recent battles, achievement showcase, "Challenge" button.
- `/arena/friends` — requests, list, online status.
- `/arena/private` — create/join private room via code.
- `/admin/arena` — admin analytics: active battles, queue depth, MMR distribution, abuse flags, force-end controls.

All gated by existing `ProtectedRoute`; admin route by `AdminRoute`.

### 4. Battle Room UI (`/arena/battle/:id`)

```text
┌─ Header: timer (synced) · topic · difficulty · forfeit ─┐
├─────────────┬────────────────────┬──────────────────────┤
│ Problem     │ Monaco Editor      │ Opponent panel       │
│ statement   │ (you)              │ - avatar + Elo       │
│ examples    │ run / submit       │ - live test progress │
│ constraints │ language picker    │ - typing pulse       │
│             │                    │ - last verdict       │
└─────────────┴────────────────────┴──────────────────────┘
         Bottom: console output · test results
```

- Synced timer: server `ends_at` is source of truth; client interpolates.
- Opponent progress: throttled `battle_events` (typing every 2s, test runs on submit only — never code contents).
- Win condition: first to pass all hidden tests; ties broken by submission time; expiry → most tests passed wins.
- Live "first blood", "comeback", "clutch" toast effects.

### 5. State management (Zustand)

- `useBattleStore` — current battle, timer offset, opponent state, event log.
- `useQueueStore` — queue status, elapsed, matched battle id.
- `useFriendsStore` — list + presence (Supabase Presence channel `arena-online`).
- `useArenaProfileStore` — cached rank/stats.

Reusable components: `<GlassPanel>`, `<NeonButton>`, `<EloBadge>`, `<RankProgressBar>`, `<BattleTimer>`, `<OpponentCard>`, `<EventTicker>`, `<AchievementToast>`, `<MatchmakingOrb>` (animated framer-motion orb during search).

### 6. Design system additions

- New CSS vars in `index.css`: `--neon-cyan #22d3ee`, `--neon-magenta #d946ef`, `--neon-lime #84cc16`, gradient utilities `bg-arena-grid`, `shadow-neon`.
- Animated SVG grid background, scanline overlay, particle burst on victory.
- All within existing dark theme — toggleable via `arena-mode` class scoped to `/arena/*`.

### 7. Achievements (seeded)

First Blood, Win Streak 3/5/10, Topic Master (10 wins in topic), Speed Demon (<5min win), Comeback King, Underdog (beat +200 Elo), Centurion (100 battles), Ranked: Bronze/Silver/Gold/Platinum/Diamond/Master tiers.

### 8. Security

- All RPCs `SECURITY DEFINER` with `auth.uid()` checks; no client trusts opponent code.
- RLS denies reading opponent's `source_code` until battle ends.
- Rate limits on queue join (1/5s) and invite send (10/min) via edge function in-memory + DB check.
- Anti-cheat: server validates submission against hidden tests; Monaco paste-detector flags >500 char single paste into `battle_events` (admin review only).
- Forfeit on tab-close detected via `visibilitychange` + heartbeat (3 missed = forfeit).

### 9. Admin analytics

`/admin/arena` cards: live battles count, queue depth by topic, avg match time, Elo histogram (recharts), top abusers (forfeit rate), recent ended battles table with replay link, force-end and Elo-revert actions, all logged to `admin_audit_log`.

### 10. Performance & scalability

- Single Realtime channel per battle (`battle:{id}`) carrying events; presence channel `arena-online` for friends.
- Debounced typing events (max 1/2s); diff-based test progress (only changed counts).
- Queue matching server-side via single RPC — no client polling.
- Indexes: `battle_queue(topic, difficulty, elo)`, `battles(status, started_at)`, `battle_events(battle_id, created_at)`.
- React Query for leaderboards/profile with 30s stale time.

### 11. Tests

- Vitest unit tests for Elo math, match-make widening, win-condition resolver.
- Playwright e2e: queue → match → submit → result flow with two browser contexts.

### 12. Rollout order

1. Migrations + RPCs + RLS.
2. Edge functions + cron.
3. Zustand stores + Supabase realtime hooks.
4. Arena landing, queue, battle room, result.
5. Leaderboard, profile, friends, private rooms.
6. Achievements + notifications wiring.
7. Admin analytics.
8. Polish: animations, sound fx (optional toggle), tests.

### Open decisions

I'll default to: classic Elo K=32, 5/15/30-min duration options (default 15), Quick Match across difficulties within ±1 tier, friends use Supabase Presence (no extra service), sounds off by default. Tell me if you want different defaults before I switch to build mode.