## My Plan — End-to-end Upgrade

Current My Plan ships profile wizard, AI plan generation, daily/weekly views, drag-to-reschedule, adaptive recommendations, charts, streak history, and PDF export. Below is what's missing to make it feel like a real, daily-use product. Each item is independently shippable.

---

### 1. Make tasks actionable (deep-linking + content)

Today, "Start" on a task only scrolls to it. Wire each task to the real practice surface so users can actually do the work.

- Extend AI plan schema with `source_id` (e.g. problem slug, sheet topic id, quiz category) and `source_url`.
- In `generate-study-plan`, give the model a curated catalog (DSA topics, SQL questions, coding problems, quiz categories) so it can reference real items instead of free-text.
- Add a `task_links` resolver on the client that maps `source_type` → route:
  - `coding` → `/library/problems/<slug>`
  - `dsa` / `sql` → `/library/dsa-questions?topic=...`
  - `quiz` → `/library/quiz?category=...`
  - `concept` → roadmap node deep link
- "Start" button opens the resource in a new tab and marks the task `in_progress`.

### 2. Daily check-in & auto-status

- New status `in_progress` plus `partial` (some progress, finish tomorrow).
- A "Daily check-in" prompt appears after 8pm or on next-day open: surfaces unfinished tasks, lets the user mark Done / Skipped / Carry over (auto-moves to tomorrow).
- Cross-link with existing data: when a `coding` task's `source_id` has an Accepted submission in `code_submissions` after the task was created, mark it Done automatically.

### 3. Focus session timer

- Pomodoro-style timer card on Today's tasks: pick a task, run 25/5 cycles, log actual minutes spent.
- New table `user_study_focus_sessions` (task_id, started_at, ended_at, actual_minutes, completed_cycles).
- Feeds back into adaptive engine: tasks consistently exceeding `est_minutes` raise difficulty signal; under-running tasks lower it.

### 4. Smart re-plan & catch-up

- "Catch up" button when user has overdue tasks: redistributes them across the next N days respecting weekday/weekend budget.
- "Re-plan from here" button regenerates only days `>= today + 1`, keeping locked items.
- Per-task "Lock to day" toggle so re-plans skip pinned items.

### 5. Calendar export & subscriptions

- Export current plan as `.ics` so users can drop it into Google/Apple Calendar (28 days max).
- Optional iCal feed via signed edge function URL (`/functions/v1/plan-ical?token=...`) so the calendar stays in sync.
- Per-task `add to calendar` quick action.

### 6. Platform sync scheduler

Today, syncs run only when user clicks Connect/Refresh.

- New table `user_platform_sync_jobs` with `next_run_at`, `interval_hours`.
- pg_cron job (every hour) calls `fetch-coding-profiles-batch` edge function to refresh due handles.
- UI shows "Auto-sync: every 24h" toggle per platform and last-success timestamp.
- After each sync, if `solved_*` counts change meaningfully, queue an "update recommendations" notification.

### 7. AI Coach chat (plan-aware)

- New tab/panel: a streaming chat (reuses Lovable AI Gateway) seeded with the user's profile, current plan, last 14 days of progress, platform stats.
- Common quick actions: "Why this plan?", "I have less time this week", "Skip graphs for now", "Make it harder".
- Coach can call tools: `regenerate_plan`, `move_task`, `mark_done`, `set_time_budget`. All actions confirm before applying.

### 8. Goals beyond a single date

- Support multiple goal types: target date, weekly XP target, problems-per-week target, topic-mastery target.
- Goal progress widget under the gradient header replaces the simple "days left" count when relevant.
- Notifications (reuse `send-velocity-reminder` infra) when user is behind pace.

### 9. Weekly review email

- Sunday email summarising last week: completion rate, streak, top topics, AI's recommended focus for next week.
- Reuses `send-weekly-digest` Edge Function — extend payload with `myplan` block.
- Honors existing notification preferences.

### 10. Polish & accessibility

- Empty states everywhere (no plan, no platforms, no tasks today).
- Keyboard: J/K to move between today's tasks, Enter to toggle done, R to open recommendations, P to print.
- Mobile FAB with quick "Add ad-hoc task" + "Start focus session".
- Loading skeletons matching DashboardSkeleton style across all panels.
- Optimistic concurrency on plan tasks (handle two tabs editing same task).

---

## Technical changes

### Database (single migration)

```sql
-- New columns on user_study_plan_tasks
ALTER TABLE public.user_study_plan_tasks
  ADD COLUMN locked boolean NOT NULL DEFAULT false,
  ADD COLUMN actual_minutes integer,
  ADD COLUMN started_at timestamptz,
  ADD COLUMN source_url text;

ALTER TABLE public.user_study_plan_tasks
  DROP CONSTRAINT IF EXISTS user_study_plan_tasks_status_check;
-- Status enum widened via validation trigger (immutability rules)
CREATE OR REPLACE FUNCTION public.validate_plan_task_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('pending','in_progress','partial','done','skipped') THEN
    RAISE EXCEPTION 'Invalid status %', NEW.status;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_plan_task_status
  BEFORE INSERT OR UPDATE ON public.user_study_plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_plan_task_status();

-- Focus sessions
CREATE TABLE public.user_study_focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid REFERENCES public.user_study_plan_tasks(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  actual_minutes integer,
  completed_cycles integer NOT NULL DEFAULT 0
);
ALTER TABLE public.user_study_focus_sessions ENABLE ROW LEVEL SECURITY;
-- Owner-only RLS for select/insert/update/delete

-- Sync schedule
CREATE TABLE public.user_platform_sync_jobs (
  user_id uuid NOT NULL,
  platform text NOT NULL,
  interval_hours integer NOT NULL DEFAULT 24,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  last_status text,
  PRIMARY KEY (user_id, platform)
);
-- RLS, plus pg_cron entry calling new edge function.
```

### Edge functions

- New `plan-coach` (streaming chat with tools).
- New `plan-ical` (token-authenticated `.ics` feed).
- New `fetch-coding-profiles-batch` (called by pg_cron).
- Extend `generate-study-plan` to accept `partial: { from_day_offset, lock_ids[] }` and return only the requested slice.

### Frontend

- `useFocusSession`, `usePlanCoach`, `useTaskLinks` hooks.
- New components: `FocusTimerCard`, `DailyCheckInDialog`, `PlanCoachPanel`, `CatchUpButton`, `LockTaskToggle`, `CalendarExportMenu`, `SyncSchedulerSettings`, `GoalProgressWidget`.
- Update `useStudyPlan` with `replanFromDay`, `lockTask`, `setActualMinutes`, `addAdhocTask`.

---

## Suggested rollout order

1. Database migration + status widening.
2. Deep-linking + AI catalog (1).
3. Daily check-in + auto-mark from submissions (2).
4. Focus timer (3).
5. Catch-up & smart re-plan (4).
6. Calendar export (5).
7. Sync scheduler (6).
8. AI Coach chat (7).
9. Multi-goal support + weekly review email (8, 9).
10. Polish, keyboard, mobile FAB (10).

Each phase is independently shippable so you can pause/iterate after any step.
