## Coding Contests — End-to-End Plan

Build a complete **Contests** system: admins create timed contests with selected coding problems, users register/join, submit solutions during the window, and a live leaderboard ranks participants. Includes an admin registrations management page.

---

### 1. Database (new tables)

```text
contests
  id, slug, title, description, banner_url,
  starts_at, ends_at, registration_opens_at, registration_closes_at,
  status (draft|published|live|ended|archived — derived view also exposed),
  visibility (public|unlisted|private),
  max_participants (nullable), rules_md,
  scoring_mode (icpc|ioi|points), penalty_minutes (default 10),
  created_by, created_at, updated_at

contest_problems            (which problems belong to a contest)
  contest_id, problem_slug, order_index, points (default 100), PK(contest_id, problem_slug)

contest_registrations
  id, contest_id, user_id, registered_at, status (registered|disqualified|withdrawn),
  display_name, team_name (optional), UNIQUE(contest_id, user_id)

contest_submissions          (mirror of code_submissions filtered to contest window)
  id, contest_id, user_id, problem_slug, submission_id (FK code_submissions),
  verdict, points_awarded, penalty_seconds, submitted_at

contest_leaderboard_cache    (materialized snapshot, refreshed via trigger + cron)
  contest_id, user_id, rank, total_points, total_penalty_seconds,
  problems_solved, last_solve_at, updated_at, PK(contest_id, user_id)
```

**RLS**
- `contests`: public SELECT where `visibility='public' AND status IN ('published','live','ended')`; admins ALL.
- `contest_problems`: public SELECT joined with visible contests; admins ALL.
- `contest_registrations`: user SELECT/INSERT/DELETE own row; admins ALL.
- `contest_submissions`: user SELECT own + public SELECT after `ends_at`; INSERT via SECURITY DEFINER function; admins ALL.
- `contest_leaderboard_cache`: public SELECT for visible contests; writes only via trigger/function.

**Functions / triggers**
- `register_for_contest(contest_id)` — validates window, capacity, visibility.
- `record_contest_submission()` — trigger on `code_submissions` INSERT: if user is registered and submission is inside contest window, mirror into `contest_submissions` and recompute that user's leaderboard row.
- `recompute_contest_leaderboard(contest_id)` — recalculates ranks, called from trigger (single user) and a `pg_cron` job every minute for live contests.
- `has_role(..., 'owner')` already grants admin via existing logic.

**Realtime**: enable `REPLICA IDENTITY FULL` and add `contests`, `contest_registrations`, `contest_leaderboard_cache`, `contest_submissions` to `supabase_realtime` publication.

---

### 2. User-facing pages (under `/contests`)

| Route | Purpose |
|---|---|
| `/contests` | List of upcoming / live / past contests with status pills and countdowns. |
| `/contests/:slug` | Overview: rules, problem count (problems hidden until start), prize, **Register / Joined** button. |
| `/contests/:slug/problems` | Problem list (only after start, only for registered users). Reuses existing `CodingProblemDetail` with a `contestId` query param. |
| `/contests/:slug/leaderboard` | Live leaderboard with realtime updates, your-rank pinned row, filter by registered users. |
| `/contests/:slug/my-submissions` | Your contest submissions and verdicts. |

**Behavior**
- Countdown timers (starts in / ends in) using a single `useContestClock` hook.
- Submissions made on contest problems during the window are auto-attributed (no separate submit button).
- Guests see overview + leaderboard; register prompts login.

---

### 3. Admin pages (under `/admin/contests`)

| Route | Purpose |
|---|---|
| `/admin/contests` | Table of all contests with status, dates, registrations count, quick actions (publish, end, archive, delete). |
| `/admin/contests/new` and `/admin/contests/:id/edit` | Form: metadata, dates, visibility, scoring mode, banner upload, **problem picker** (search published problems, drag-reorder, set points). |
| `/admin/contests/:id/registrations` | Registrations table: user, registered at, status, score, solved count. Bulk disqualify / remove / export CSV. Search + filter. |
| `/admin/contests/:id/leaderboard` | Admin view of leaderboard with recompute button and submission drill-down. |
| `/admin/contests/:id/submissions` | All submissions in the contest window with verdict filters. |

**Sidebar**: add a "Contests" group in `AdminShell` with the four entries above.

**Audit**: every create/update/publish/end/disqualify writes to `admin_audit_log` (existing table).

---

### 4. Realtime + caching strategy (matches existing admin pattern)

- React Query with `keepPreviousData`, `staleTime: 60s` (already configured globally).
- Per-page Supabase channel subscriptions invalidate only the relevant queries:
  - Contests list ⇐ `contests` changes.
  - Registrations page ⇐ `contest_registrations` filtered by `contest_id`.
  - Leaderboard ⇐ `contest_leaderboard_cache` filtered by `contest_id`.
- Optimistic UI for register / withdraw / admin disqualify (same pattern as `useGrantRole`).
- Reuse `useAdminRealtimeSync` broadcast so all admin tabs stay in sync.

---

### 5. Files to create

**Hooks**
- `src/hooks/useContests.ts` — list, detail, register, withdraw, my registration.
- `src/hooks/useContestLeaderboard.ts` — realtime leaderboard.
- `src/hooks/useContestClock.ts` — shared countdown.
- `src/hooks/admin/useAdminContests.ts` — CRUD + publish/end.
- `src/hooks/admin/useAdminContestRegistrations.ts` — list, disqualify, export.

**Pages (user)**
- `src/pages/contests/ContestsList.tsx`
- `src/pages/contests/ContestDetail.tsx`
- `src/pages/contests/ContestProblems.tsx`
- `src/pages/contests/ContestLeaderboard.tsx`
- `src/pages/contests/MyContestSubmissions.tsx`

**Pages (admin)**
- `src/pages/admin/contests/AdminContestsList.tsx`
- `src/pages/admin/contests/ContestEditor.tsx` (new + edit)
- `src/pages/admin/contests/AdminContestRegistrations.tsx`
- `src/pages/admin/contests/AdminContestLeaderboard.tsx`
- `src/pages/admin/contests/AdminContestSubmissions.tsx`

**Components**
- `src/components/contests/ContestCard.tsx`, `CountdownPill.tsx`, `LeaderboardTable.tsx`, `ProblemPicker.tsx` (admin), `RegisterButton.tsx`.

**Routing**
- Update `src/App.tsx` to register all `/contests/*` (PublicDashboardWrapper) and `/admin/contests/*` (AdminRoute) routes.
- Update `src/components/admin/AdminShell.tsx` sidebar with "Contests" group.

**Migrations**
- `supabase/migrations/<ts>_contests_schema.sql` — tables, RLS, functions, triggers, realtime publication, pg_cron job.

---

### 6. Edge cases handled
- Registration closes when capacity reached or `registration_closes_at` passes.
- Submissions outside `[starts_at, ends_at]` are NOT counted toward contest.
- Private contests require an invite code (stored on contest, validated in `register_for_contest`).
- Tie-breaking: total_points DESC, total_penalty ASC, last_solve_at ASC.
- `owner` role inherits admin access automatically (existing `has_role`).

---

### Open questions (defaults assumed; tell me to change)
1. **Scoring**: default ICPC-style (solved + penalty). Want IOI partial scoring or pure points instead?
2. **Teams**: solo only for v1 (team_name kept as cosmetic). Add real teams later?
3. **Problem visibility**: hidden until contest starts. OK, or show titles before start?
4. **Public profile leaderboard freeze**: public leaderboard locks 1 hour before end (common in CP). Include this?
