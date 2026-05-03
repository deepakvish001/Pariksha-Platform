# Plan: Solo Gaming Arena

A single-player, time-pressured practice mode under `/arena/solo` that mimics the stress of real interviews, online assessments (OAs), and coding contests. Built on top of the existing Arena infrastructure (problems, XP engine, daily loop, leaderboard) — no new code editor; reuse what battle rooms already have.

## Goals

- Train students under realistic time pressure (no opponent required, available 24/7).
- Three flavors mapped to real-world formats: Interview, Assessment, Contest.
- Strong gamification: streaks, XP, ranks, badges, daily quests, leaderboard.
- Anti-cheat-aware (focus loss, paste tracking, server-validated scoring).

## Three Solo Modes

1. **Interview Sim (1 problem, 30–45 min)**
   - Picks 1 problem at chosen difficulty/topic.
   - Phases: 5 min "understand & clarify" (hints locked) → coding → final 5 min "explain" prompt.
   - Scoring: correctness + time bonus + first-try bonus.

2. **Assessment Mode (3–5 problems, 60–90 min, fixed budget)**
   - Mixed difficulty (Easy + Medium + Hard) like Hackerrank/Codility OAs.
   - One global timer; partial credit per problem; no going back unless time remains.
   - Final report card: per-problem time, attempts, score, percentile vs cohort.

3. **Contest Mode (5 problems, 90 min, scheduled or on-demand)**
   - ICPC-style scoring: points + penalty per wrong submit + penalty time.
   - Live solo leaderboard for that contest instance (compared to all who took it).
   - "Virtual contest" replays of past contests.

## Gamification Layer

- **Solo Rating (Elo-like)**: separate `solo_rating` per mode; visible on profile.
- **Tiers**: Bronze → Silver → Gold → Platinum → Diamond → Grandmaster.
- **Daily Solo Quests** (rotating): "Finish 1 Interview Sim under 25 min", "Score 80%+ on an Assessment", "Solve 1 Hard with 0 wrong submits". Hooks into existing daily quest table.
- **Streaks**: separate `solo_streak` (days with ≥1 completed solo session). Streak freeze reuses existing recovery system.
- **XP rewards**: scaled by mode, difficulty, score, and time bonus. Server-side via existing XP transaction RPC.
- **Badges**: "First Blood" (sub-10-min solve), "Iron Nerves" (Hard with 0 paste events), "Marathoner" (3 contests in a week), "Comeback" (+200 rating in 7 days).
- **Power-ups (earned, not bought)**: 1 hint, 1 testcase reveal, 1 timer pause (interview only) — limited per week.

## Pressure & Realism Mechanics

- Visible countdown with color escalation (green → amber → red at <5 min).
- Auto-submit on timeout; no late saves.
- "Focus mode": hides sidebar/notifications; warns on tab switch (count tracked, shown in report).
- Paste counter and large-paste detection logged per submission.
- Post-session report: timeline (read → first compile → first AC), wrong-submit graph, percentile.

## Data Model (new tables)

```text
solo_sessions
  id, user_id, mode (interview|assessment|contest), status, started_at,
  ends_at, completed_at, score, max_score, rating_delta, focus_lost_count,
  paste_count, config jsonb (problem_slugs[], difficulty, duration_s)

solo_session_problems
  session_id, problem_slug, ord, awarded_score, attempts, wrong_submits,
  first_ac_at, time_to_ac_s

solo_ratings
  user_id, mode, rating, peak_rating, games_played, tier

solo_contests        -- for scheduled/virtual contests
  id, slug, title, problem_slugs[], duration_s, starts_at, ends_at,
  is_virtual, created_by

solo_contest_entries
  contest_id, user_id, started_at, finished_at, score, penalty_s, rank
```

All tables RLS-locked: users read/write only their own rows; admins read all. Contest definitions readable by all authenticated users.

## Server-Side Logic (Edge Functions / RPCs)

- `solo_start_session(mode, config)` → picks problems server-side (anti-cheat), creates session row, returns sanitized payload (no test answers).
- `solo_submit(session_id, problem_slug, code)` → reuses existing judge pipeline; updates `solo_session_problems`; returns verdict only.
- `solo_finalize(session_id)` → computes score, applies Elo-like rating delta, awards XP via existing transaction, updates streak, evaluates badge unlocks, writes audit log.
- `solo_leaderboard(mode, range)` → top-N by rating; cached.
- `solo_contest_register / solo_contest_start / solo_contest_finalize`.

Rate-limited; all scoring server-validated. No client-trusted timers — server stores `ends_at` and rejects submissions after it.

## UI / Routes

- `/arena/solo` — landing: 3 mode cards, current rating per mode, streak, today's quests, "Resume session" if active.
- `/arena/solo/interview/new`, `/assessment/new`, `/contest` (list) → config sheet (topic, difficulty, duration) → confirm.
- `/arena/solo/session/:id` — runner: timer header, problem panel, reused code editor from battle room, submit panel, focus-mode toggle.
- `/arena/solo/session/:id/report` — post-session report card with shareable image (reuse achievement social card generator).
- `/arena/solo/leaderboard` — switch tabs Interview / Assessment / Contest; week/month/all-time.
- `/arena/solo/contests` — upcoming, live, past (virtual replay).
- Sidebar/Arena nav: add **Solo** entry next to Daily.

## Integration Points (reuse)

- Code editor + judge: `ArenaRoom` runner.
- XP + streak engine: existing transaction RPC + recovery system.
- Daily quests table: add `solo_*` quest keys.
- Leaderboard component: parameterize by source (`battles` | `solo`).
- Achievements: extend tier system with solo-specific badges.
- Admin: extend Admin Control Center with a "Solo Contests" manager (create/edit, pick problems, schedule).

## Rollout Phases

1. **MVP**: tables + RLS, `solo_start/submit/finalize`, Interview Sim only, runner page, basic report, sidebar entry.
2. **Assessment mode** + multi-problem runner + percentile in report.
3. **Solo rating + leaderboard + tiers + badges**.
4. **Contest mode** (on-demand + scheduled + virtual replay) + admin manager.
5. **Daily Solo Quests** + power-ups + focus/paste analytics surfaced in report.

## Out of Scope

- Real-time multiplayer (already covered by Arena battles).
- Voice/AI mock-interviewer (separate future track).
- Paid power-ups (earned only).
