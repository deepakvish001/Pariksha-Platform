# DSA Tracker — date control, multi-session logging, deeper tracking

## 1. Schema additions (one migration)

Add to `practice_journal_entries`:
- `started_at timestamptz` — when this attempt began
- `ended_at timestamptz` — when it ended
- `session_label text` — e.g. `Morning`, `Afternoon`, `Evening`, `Night`, or a custom label

All nullable, no backfill. Indexed: `idx_pje_user_started (user_id, started_at)`.

Why: schema already supports many entries per day (each row has its own `created_at`), but it can't represent "I solved these between 9–11am" vs "these between 3–5pm". `started_at`/`ended_at` + `session_label` make that explicit, drive grouping, and let `time_taken_min` auto-fill.

RLS: unchanged — existing user-scoped policies cover the new columns.

## 2. Date control on the Today tab → renamed "Log" tab

Replace the fixed "Today" header with a **Date Navigator**:

```text
[◀]  Thu, May 21 2026  [📅 pick]  [▶]   [Today]
```

- Prev/next day buttons.
- Shadcn `Calendar` popover for arbitrary date (disabled if > today).
- "Today" jump button.
- Selected date is held in component state; we call `ensureDay(date)` lazily — only when the user actually adds an entry for that date.
- Switching date refetches that day's entries via existing `useDayEntries(dayId)`.

New hook in `src/features/dsa-journal/api.ts`:
- `useDayByDate(date)` — fetch the day row for any ISO date (read-only; no auto-insert).
- `useEnsureDay` stays mutation-only and is called from the add-row.

## 3. Multi-session logging

### Session bar (above the sheet on the Log tab)

```text
Sessions today:  [🌅 Morning 9–11]  [☀️ Afternoon 2–4]  [🌙 Night 10–11]  [+ New session]
                  3 solved · 1 partial · 95m            …                  …
```

- Each chip shows `label`, `start–end` (HH:mm), and a mini summary.
- Click a chip → filters the sheet to that session and pre-fills `session_label`, `started_at` on new rows.
- "+ New session" opens a small inline form: label (preset chips Morning/Afternoon/Evening/Night + custom text), start time, optional end time. Saves to a tiny `localStorage` index `dsa-tracker:sessions:<userId>:<date>` so blank sessions persist before any entry is added; once an entry is saved with that session_label/started_at, the row drives the chip.
- Sessions are **derived from entries** for the chosen date: distinct `session_label` (or auto-bucketed by `started_at` hour) → grouped, ordered by `min(started_at)`.

### Sheet grouping on Log tab

Render entries grouped by session with collapsible headers. Within each group: existing `PracticeSheet` table. Empty groups show "Add the first problem to this session".

### Add-row enhancements

The bottom add-row already exists. Extend it so when a session is active, `session_label` and `started_at` are injected into the insert payload. Also add a small **▶ Start / ■ Stop session timer** button next to the add-row that:
1. On Start, stamps `started_at = now()` for the next entry.
2. On Stop, stamps `ended_at = now()`, computes `time_taken_min = round((ended_at - started_at)/60)` and auto-fills it.

No popups — all inline.

## 4. Other "more better" tracking features

### a. Calendar heatmap → click to open that date
On the History tab, clicking a Heatmap cell sets the Log tab's date to that day and switches tabs.

### b. Time-of-day distribution chart (Analytics)
Stacked bar 0–23h showing problems solved per hour, grouped by session label. Reuses Recharts already in the project.

### c. Session insights card (Analytics)
- Avg session length (mins)
- Avg problems per session
- Most productive session label (e.g. "Evening — 42% of solves")
- Longest focus session

### d. Per-day summary strip (Log tab)
Inline strip showing for the selected date:
`5 solved · 1 partial · 0 stuck · 145m total focus · 3 sessions`.

### e. Quick-add improvements (carry-over)
- "+ 3 quick rows" button — adds 3 blank rows pre-filled with the active session.
- Keyboard shortcut `n` focuses the add-row title input when sheet is focused.

### f. Streak unaffected
Streak still counts distinct days with ≥1 entry — already correct; backfilling old days now properly increments it.

### g. Past-date entry pill
When the selected date ≠ today, show an amber pill "Logging for <date>" so the user can't forget they're back-dating. Entries created have `created_at = now()` (audit), but they belong to that date's `day_id`.

## 5. UI surface

| File | Change |
|---|---|
| `supabase/migrations/...` | Add `started_at`, `ended_at`, `session_label` + index |
| `src/features/dsa-journal/types.ts` | Add the 3 fields to `JournalEntry` |
| `src/features/dsa-journal/api.ts` | `useDayByDate`, accept session fields in `EntryInput`, new `useDateEntries` helper |
| `src/features/dsa-journal/components/DateNavigator.tsx` | New: prev/next/today + shadcn date picker |
| `src/features/dsa-journal/components/SessionBar.tsx` | New: chips + "New session" form + active session state |
| `src/features/dsa-journal/components/SessionTimer.tsx` | New: tiny start/stop timer beside add-row |
| `src/features/dsa-journal/components/DaySummaryStrip.tsx` | New: inline counts for selected date |
| `src/features/dsa-journal/components/TimeOfDayChart.tsx` | New: Analytics chart |
| `src/features/dsa-journal/components/SessionInsights.tsx` | New: Analytics card |
| `src/features/dsa-journal/components/PracticeSheet.tsx` | Accept `sessionLabel`/`startedAt` props that the add-row uses on insert; support grouping mode (optional `groupBy="session"`) |
| `src/features/dsa-journal/components/Heatmap.tsx` | Add `onCellClick(date)` callback |
| `src/pages/learn/dsa-studio/JournalPage.tsx` | Rename Today tab → **Log**; mount DateNavigator + SessionBar + grouped PracticeSheet + DaySummaryStrip; wire Heatmap click → switch to Log tab on that date; add new Analytics cards |

## 6. Out of scope

- No changes to SRS scheduling.
- No changes to export formats (CSV still exports the new columns automatically since it reads from entry rows).
- No real-time presence for sessions.
- No changes to the existing "DSA Tracker" rename / route.

## 7. Notes for the migration step

```sql
ALTER TABLE public.practice_journal_entries
  ADD COLUMN IF NOT EXISTS started_at  timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at    timestamptz,
  ADD COLUMN IF NOT EXISTS session_label text;

CREATE INDEX IF NOT EXISTS idx_pje_user_started
  ON public.practice_journal_entries (user_id, started_at);
```

Migration is approved + run *before* code edits so the types regenerate.
