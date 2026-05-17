# Assessment Management — End to End

Goal: turn the flat assessments list into a real management surface where each test has a clear schedule, a dedicated **Edit** path, and a dedicated **Manage / Live monitor** path showing who joined, who's in progress, who finished, and integrity signals — in real time.

Most of the underlying data already exists (`assessments`, `assessment_invites`, `assessment_attempts`, `attempt_events`, proctoring panel, scoring). This work is mostly UI composition + a new scheduling board + a live monitor view. No schema changes.

---

## 1. New Assessments Hub (`/b2b/assessments`)

Replace the flat list with a tabbed, status-segmented board built on glass cards (matching the new dashboard aesthetic).

Tabs:
- **Live now** — `status=published` and `now ∈ [starts_at, ends_at]` (or no window set).
- **Upcoming / Scheduled** — `published` with `starts_at > now`.
- **Drafts** — `status=draft`.
- **Closed / Archived** — `ended_at < now` or `status=archived`.
- **All**.

Each card shows: title, status pill, schedule window (Opens in 3h / Live · closes in 42m / Closed 2d ago), duration, invited count, started/submitted counts, average integrity, two primary actions:
- **Edit** → `/b2b/assessments/:id/edit` (existing Detail "Sections/Settings" experience)
- **Manage** → `/b2b/assessments/:id/manage` (new live monitor, default landing)

Secondary menu (kebab): Duplicate, Publish/Archive toggle, Copy join link, Delete.

Top controls: search box, status filter chips, sort (start time / created / invites), "New assessment" button.

## 2. Per-Assessment routes

Split today's single `Detail.tsx` into two clearer destinations sharing the same data:

```text
/b2b/assessments/:id           → redirect to /manage
/b2b/assessments/:id/manage    → Live monitor (default)
/b2b/assessments/:id/edit      → Authoring (Sections, Invites, Settings, Proctoring config)
```

Both pages share a sticky header strip:
- Title + status badge + schedule chip ("Live · closes 14:32")
- Counters: Invited · Joined · In progress · Submitted · Avg integrity
- Action buttons: Take preview · Publish/Archive · Copy join link · Switch view (Edit ↔ Manage)

### 2a. Edit view (`/edit`)
Reuses existing panels: **Sections & Questions**, **Invites**, **Settings** (schedule, duration, max attempts, proctoring config). Tabs trimmed of monitoring panels which now live in Manage.

### 2b. Manage view (`/manage`) — new
Realtime cockpit. Four panels:

1. **Live participants table** — one row per invite, joined with their latest attempt.
   Columns: Name / email · Status (Not joined · Joined · In progress · Submitted · Auto-submitted · Abandoned) · Started · Elapsed (ticking) · Progress (answered / total) · Score · Integrity · Last activity · Actions (View attempt, Force submit, Resend invite, Remove).
   Filters: status chips, search.
2. **Activity feed** — last 50 `attempt_events` across the assessment (joined, tab-switch, copy-paste, fullscreen exit, submit). Color-coded by severity.
3. **Integrity alerts** — attempts with integrity < 70 surfaced with reason summary; click → AttemptDetail.
4. **Schedule & capacity strip** — opens-at / closes-at countdown, time remaining, # of concurrent in-progress users, peak concurrency today.

Realtime: subscribe to `assessment_attempts` and `attempt_events` filtered by `assessment_id` so the table and feed update without refresh.

## 3. Schedule helpers

Add `src/b2b/lib/assessmentSchedule.ts` with pure helpers:
- `getScheduleState(a)` → `'draft' | 'scheduled' | 'live' | 'closed' | 'archived'`
- `formatWindow(a, now)` → human string ("Opens in 3h 12m", "Live · 42m left", "Closed 2d ago")
- `bucketAssessments(list, now)` → `{ live, upcoming, drafts, closed }`

Used by the hub board, the per-assessment header strip, and the dashboard "Upcoming assessments" widget.

## 4. Hooks (new, thin wrappers — no schema changes)

`src/b2b/hooks/useAssessmentLive.ts`:
- `useLiveParticipants(assessmentId)` — joins `assessment_invites` + latest `assessment_attempts` row per invite; subscribes to realtime.
- `useAssessmentActivity(assessmentId, limit=50)` — pulls + subscribes to `attempt_events`.
- `useForceSubmitAttempt()` — mutation calling existing submit RPC / status update.
- `useResendInvite()` — re-trigger the existing invite send edge function.

## 5. Wiring

- Update router (wherever `/b2b/assessments/:id` is mounted) to add `/edit` and `/manage` children + the redirect.
- Replace card `onClick navigate(\`/b2b/assessments/${a.id}\`)` in `List.tsx` with the two-button design (Edit + Manage) and the schedule chip.
- Dashboard's "Upcoming assessments" widget already added — link each row to `/manage` for consistency.

## 6. Out of scope (call out explicitly)
- No DB schema changes — `starts_at`, `ends_at`, `status`, `attempt_events`, integrity scoring all already exist.
- No new edge functions — reuse existing invite/submit RPCs.
- No changes to candidate-side player.

---

## Files to add
- `src/b2b/lib/assessmentSchedule.ts`
- `src/b2b/hooks/useAssessmentLive.ts`
- `src/b2b/pages/assessments/Manage.tsx`
- `src/b2b/pages/assessments/Edit.tsx` (thin wrapper that mounts the existing Sections/Invites/Settings panels extracted from `Detail.tsx`)
- `src/b2b/components/assessments/ScheduleChip.tsx`
- `src/b2b/components/assessments/AssessmentCard.tsx`
- `src/b2b/components/assessments/LiveParticipantsTable.tsx`
- `src/b2b/components/assessments/ActivityFeed.tsx`

## Files to change
- `src/b2b/pages/assessments/List.tsx` — new hub layout with tabs + cards.
- `src/b2b/pages/assessments/Detail.tsx` — refactor into shared header + redirect to `/manage`; extract panels into reusable components.
- Router config — add `/edit`, `/manage`, redirect.
- Dashboard "Upcoming assessments" rows link to `/manage`.

Confirm and I'll implement.
