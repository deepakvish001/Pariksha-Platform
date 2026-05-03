# Arena · Engagement Expansion Plan

Today the Arena ships Quick Match, Create-Room codes, Friends, Leaderboard, History, Rematch, and basic Elo. To make it feel like a *destination* students return to daily, this plan layers progression, social pressure, content variety, and live spectacle on top of the existing battle engine.

The features are grouped into five tracks, ordered by impact-vs-effort. Each phase is independently shippable.

---

## Phase 1 · Daily Habit Loop  (highest ROI)

Goal: give every student a reason to open Arena every day.

1. **Daily Challenge Battle** — One curated problem per day, same for every player globally. Solving it inside the daily window awards bonus XP + a streak point. Surface a "Today's Challenge" card on `ArenaHome` and a global completion counter ("4,217 students solved today").
2. **Arena Streaks** — Track consecutive days with at least one battle. Show flame icon in header, milestone rewards at 3 / 7 / 30 / 100 days, optional Streak Freeze (1 per week) reusing the existing streak-recovery primitive.
3. **Daily Quests** — 3 rotating micro-goals (e.g. "Win 1 Easy", "Submit in <5 min", "Beat someone +50 Elo"). Tracked server-side, claimable for XP.
4. **Result-screen XP & loot reveal** — Animated XP bar fill, level-up burst, loot card (avatar frame / banner / title) on `BattleResult`.

## Phase 2 · Progression & Identity

Goal: turn Elo from a number into a story players feel proud of.

1. **Ranked Tiers + Seasons** — Bronze → Silver → Gold → Platinum → Diamond → Master, each split into divisions. Visible tier badge replaces raw Elo on profiles, leaderboards, opponent cards. Seasons reset every 6 weeks; previous season's peak tier is permanently displayed.
2. **Promotion / Demotion Series** — Best-of-3 mini-series at tier boundaries with dedicated "Promo" UI for tension.
3. **Profile Showcase** — A `/u/:username/arena` panel (extends existing public profiles) showing tier, win rate, favorite language, longest streak, recent battles, and equippable cosmetics earned.
4. **Cosmetic Unlocks** — Avatar frames, name colors, victory banners, code-editor themes earned by tier, streaks, achievements. Pure cosmetic — no pay-to-win.

## Phase 3 · Live Social Energy

Goal: make the Arena feel inhabited, not empty.

1. **Spectator Mode** — Read-only `/arena/watch/:battleId` route with redacted code, live test progress, both players' typing indicators. Linkable from leaderboard ("watch live"). Drives FOMO.
2. **Live Lobby Feed** — Ticker on `ArenaHome` showing recent finishes ("@anya beat @raj 3-0 in 4:12"), top-of-leaderboard climbs, daily-challenge solves.
3. **Quick Reactions / Emotes** — During battle, send a curated emote (5-6 options: GG, GLHF, 🔥, 🤯, 👏). Server-rate-limited, shown briefly on opponent card. Toxicity-safe by being closed-set.
4. **Post-match Compliments** — "GG" button on result screen sends a positive-only signal that becomes a public profile counter ("Received 142 GGs").

## Phase 4 · Game Modes & Content Variety

Goal: keep the Arena from feeling like one repeating game.

1. **Game Mode Picker** on Quick Match:
   - **Classic** (current) — full problem, fastest correct submission wins.
   - **Speed** — Easy-only, 5-min timer, first to pass all tests.
   - **Bug Hunt** — Pre-written buggy code, fix to pass tests fastest.
   - **Optimize** — Both pass; lower runtime/memory wins.
   - **Blind** — Description only; no example inputs.
2. **3v3 Squad Battles** — Friends queue together, sum of points across 3 problems decides winner. Powerful viral hook for college groups.
3. **Tournaments** — Scheduled bracket events ("Sunday Sprint, 8 PM"), 16/32/64 players, single-elimination, auto-advance. Reuses existing `contests` table where possible.
4. **Topic-Targeted Match** — Choose Arrays / DP / Graphs / Strings; matchmaker pairs you with someone who picked the same topic. Doubles as practice for upcoming interviews.

## Phase 5 · Coach & Carry

Goal: convert Arena from entertainment into measurable interview prep.

1. **Post-match AI Review** — One-click "Explain my solution" + "Show me opponent's approach (after match)" using existing Lovable AI gateway. Highlights complexity, edge cases missed, and a cleaner refactor.
2. **Weakness Heatmap** — Aggregate battle outcomes by topic/difficulty into a `/arena/insights` page. "You lose 70% of Graph battles — drill it" with deep link to library.
3. **Friend Challenge Notifications** — In-app + email push: "@deepak just beat your high score, can you reclaim it?"
4. **Shareable Replay Cards** — Auto-generated branded image of a victory (problem, time, opponent, tier change) for WhatsApp / LinkedIn. Mirrors existing achievement social cards.

---

## Cross-cutting UX polish

- **Onboarding tour for first-time Arena visit** (3 steps: Quick Match, Daily Challenge, Friends) — boosts D1 retention.
- **Sound + haptic feedback** for queue match-found, test passing, victory — opt-out in settings.
- **Mobile-first revisit** of `BattleRoom` toolbar (tabs for Problem / Editor / Opponent on <md screens) — current grid stacks, tabs are denser.
- **Anti-cheat scaffolding** — paste detection, rapid-submit throttle, foreign-tab focus loss flagged for review (visible only to admins).

---

## Suggested Build Order

Ship Phase 1 first (1–2 weeks of work, immediate DAU lift), then Phase 2 (gives Phase 1 rewards meaning), then alternate Phase 3 and Phase 4 sprints based on which metric is weakest (session length vs. session frequency). Phase 5 is the long-tail "students stay because they're learning" layer.

## Technical Notes (for implementer)

- New tables: `arena_daily_challenges`, `arena_quests`, `arena_quest_progress`, `arena_seasons`, `arena_tier_history`, `arena_emotes_log`, `arena_squads`, `arena_tournaments`, `arena_tournament_matches`, `arena_cosmetics`, `user_arena_cosmetics`. Strict RLS on every table.
- New RPCs: `claim_daily_challenge`, `claim_quest`, `start_promo_series`, `cast_arena_vote_emote`, `compute_season_tier`. Server-side authoritative — never trust client.
- Reuse: existing `battle_*` RPCs, `user_xp` ledger, `user_streaks`, public `profiles`, `contests`, achievement social-card edge function, Lovable AI gateway for post-match review.
- Realtime: extend the existing `battle_events` channel with new event kinds (`emote`, `spectator_join`); add a new global `arena_lobby` channel for ticker.
- Edge functions: `arena-daily-rotation` (cron-scheduled via pg_cron), `arena-tournament-runner`, `arena-replay-card` (renders OG image), `arena-ai-review`.
- Routes to add: `/arena/daily`, `/arena/quests`, `/arena/watch/:id`, `/arena/squads`, `/arena/tournaments`, `/arena/insights`, `/arena/cosmetics`.
