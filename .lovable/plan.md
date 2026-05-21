# Rename to DSA Tracker + Upgraded Tracking

## 1. Route + naming

- Add new route `/learn/dsa-tracker` in `src/App.tsx`, pointing at the existing `JournalPage`.
- Keep `/learn/dsa-studio/journal` as a permanent redirect (`<Navigate replace to="/learn/dsa-tracker" />`) so existing bookmarks / sidebar history don't break.
- Update sidebar entry in `src/components/DashboardSidebar.tsx`: title → "DSA Tracker", url → `/learn/dsa-tracker`, keep `NotebookPen` icon.
- Update DSA Studio shared nav (`_shared.tsx`) "Practice Hub" tab → "DSA Tracker", `to: /learn/dsa-tracker`.
- Rename in-page text + SEO in `JournalPage.tsx`:
  - Page `<StudioPageShell title>` → "DSA Tracker"
  - Section header title/subtitle → "DSA Tracker" / "Track every problem you solve — clean, fast, spreadsheet-style."
  - `canonicalPath` → `/learn/dsa-tracker`
- Update guest CTA copy, "Free for students" badge stays.
- No file renames in `src/features/dsa-journal/*` (folder name kept internal — purely cosmetic rename).

## 2. New tracking features (added inside the same page)

All additions live in `JournalPage.tsx` + small new components under `src/features/dsa-journal/components/`. No DB schema changes — we use existing columns (`status`, `solved_clean`, `attempts`, `time_taken_min`, `confidence`, `next_revision_at`, `mastered_at`, `is_favorite`, `tags`, `topic`, `pattern`, `difficulty`).

### a. Smarter stat strip (replaces current 4 tiles)
Adds 4 more tiles in a responsive 2 × 4 grid:
- **Clean-solve rate** — `% of entries with solved_clean = true` (last 30d)
- **Avg time / problem** — mean of `time_taken_min` (last 30d)
- **Mastered** — count where `mastered_at not null`
- **Confidence avg** — mean `confidence` (1–5) with colored bar

### b. Goals & pace ring
New `GoalsRing.tsx` component:
- Daily goal (default 3, editable, persisted in `localStorage`)
- Weekly goal (default 15)
- Two SVG progress rings showing today vs goal and this-week vs goal
- "On pace / Behind / Done" pill

### c. Topic mastery board
New `TopicMastery.tsx` shown in History tab above the heatmap:
- Per-topic row: total solved · clean % · mastered count · weakness score
- Sorted by weakness; click a row to apply that topic as a filter

### d. Difficulty mix bar
Thin stacked bar (Easy/Med/Hard) under stat strip with counts + percentages, color-coded.

### e. Revisions tab upgrades
In `RevisionsBoard.tsx`:
- Summary header: `X overdue · Y due today · Z this week`
- "Revise next" button — opens the top overdue entry directly in `ReviseInline`
- Bulk "Snooze all overdue by 1 day" action
- Sort toggle: by due date / by difficulty / by confidence

### f. Quick-add improvements (Today tab)
- Paste a LeetCode/Codeforces/GFG URL → auto-detect title + source + difficulty hint (uses existing `source.ts`, extended)
- Inline keyboard hints row: `Enter` save · `Tab` next field · `⌘K` focus add row
- Show today's mini-summary chip: "3 solved · 1 partial · 0 stuck · 42 min"

### g. Activity insights card (Analytics tab)
New panel:
- Best day of week (highest avg problems)
- Best time window (morning/afternoon/evening from `created_at`)
- Current vs longest streak
- Hardest topic (lowest clean-rate with ≥ 3 reps)

### h. Saved filter views (History tab)
- "Favorites", "Stuck only", "Due this week", "Mastered" preset chips above `FiltersBar` that apply to existing filter state.

## 3. Tests / sanity

- Update `DsaStudio.coverage.test.tsx` only if it asserts on the journal link (it doesn't currently, but verify).
- Manual smoke: visit `/learn/dsa-studio/journal` → redirects; visit `/learn/dsa-tracker` → loads; sidebar link works; stats compute without errors on empty data.

## Technical notes

- All new metrics are pure `useMemo` reductions over the same `useAllEntries()` data already loaded — no new queries.
- Goals stored under `localStorage` key `dsa-tracker:goals:v1` (`{daily, weekly}`).
- New components are presentation-only; no business logic outside derived stats.
- Keep folder path `src/features/dsa-journal/` to avoid a noisy rename diff; only user-facing strings + route change.

## Out of scope

- No DB migrations.
- No changes to SRS algorithm.
- No backend logic edits.
