## Practice Hub — End-to-End Revamp

Rename **DSA Practice Journal → Practice Hub** and rebuild it as a complete daily-solve workspace with quick capture, powerful history, a real revision workflow, and gamification that ties into the existing XP system.

### 1. Rename everywhere

- New name: **Practice Hub** (subtitle: "Your daily DSA solve log").
- Route stays `/learn/dsa-studio/journal` (keeps existing bookmarks/links working) but page title, sidebar entry, studio tab, SEO meta, breadcrumbs, and toasts all become "Practice Hub".
- Update memory index entry from "DSA Practice Journal" to "Practice Hub".

### 2. Database additions (single migration)

Extend `practice_journal_entries` only — no breaking changes to existing rows:

- `code_snippet text`, `language text` (Python, C++, Java, JS, Go, Rust, Other)
- `time_complexity text`, `space_complexity text` (e.g. "O(n log n)")
- `companies text[]` default `'{}'`
- `confidence int` (1–5, self-rated after solve)
- `is_favorite boolean` default false
- `snoozed_until date` (null = active; set when user snoozes a due revision)
- `source text` (LeetCode / GFG / Codeforces / AtCoder / HackerRank / Custom — derived from first link)
- `archived_at timestamptz`

Index: `(user_id, next_revision_at) where mastered_at is null and archived_at is null`, plus GIN on `tags` and `companies` for filters.

RLS already restricts by `user_id`; new columns inherit the existing policies.

### 3. Richer entry + quick capture

Upgraded `EntryForm`:

- **Source auto-detect**: when the user pastes a link, derive `source` from hostname and (if the URL matches `leetcode.com/problems/<slug>/`) prefill the title from the slug (`two-sum` → "Two Sum"). No external fetch — pure client parse.
- **Code snippet** field with language selector (renders monospace, ~10 lines).
- **Complexity** row: two compact inputs for time / space with suggested chips (O(1), O(n), O(n log n), O(n²)).
- **Companies** chip input (free-text, comma/enter to add).
- **Confidence** 1–5 stars after solve (separate from "how hard did it feel").
- **Favorite** toggle (⭐).
- Mood + focus-minutes captured on the **day row** via a small "Today's vibe" strip at the top of the Today tab.

Quick capture:

- Global floating **Quick Add** FAB on every Practice Hub tab.
- Keyboard shortcuts inside the page: `N` = new entry, `R` = revise next due, `/` = focus search, `G` then `H/D/U/A` = jump to History/Due/Analytics.
- A "smart" mini-form mode: paste a link → title prefilled → press Enter to save with sensible defaults; expand to full form only if needed.

### 4. Filters, search, import/export

New **History** tab redesign (replaces the current day-collapsible list as default view; day grouping stays as a toggle):

- Sticky filter bar: full-text search (title + tags + notes), multi-select Topic, Pattern, Difficulty, Status, Source, Companies; date-range picker; "Favorites only", "Mastered only", "Has revisions" toggles.
- Sort: newest, oldest, hardest, most attempts, next-due soonest.
- View toggle: **Table** (compact rows with inline edit) vs **Cards** vs **By Day**.
- URL-synced filters so views are shareable/bookmarkable.

Import / Export:

- **Export CSV** of currently filtered entries (columns: date, title, links, topic, pattern, difficulty, attempts, clean, time, status, tags, companies, next_revision_at, mastered).
- **Export JSON** of entries + revisions (full backup).
- **Import CSV** with header mapping UI; upserts by `(user_id, title, log_date)`. Validates and shows a preview before commit. Runs in batches of 50.
- **Copy daily summary** button → clipboard-ready markdown block of today's solves (useful for LinkedIn/Twitter "Day N of 100" posts).

### 5. Revision workflow upgrade

New dedicated **Revisions** tab (alongside Today/History/Analytics):

- Three groups: **Overdue** (red), **Due today** (amber), **Upcoming 7 days** (muted).
- Each card shows title, days overdue, last attempt result, ease, and quick-action buttons: **Revise**, **Snooze 1d / 3d / 1w**, **Mark mastered**, **Skip this cycle** (re-rolls next date without changing ease).
- **Bulk revise** dialog: select multiple → log them with the same outcome (e.g. "Solved clean, 5 min each").
- **Upcoming calendar** view: month grid with dots indicating how many revisions land on each future day, so students can plan ahead.
- Add a small "Due soon" widget on the Today tab.

Backend support: snooze writes `snoozed_until`; `useDueRevisions` filters out entries where `snoozed_until > today`.

### 6. Analytics + gamification

Analytics tab additions:

- **Streak calendar** (large monthly view with current streak, longest streak).
- **Time-to-solve trend** line chart (median minutes per week).
- **Accuracy trend** (% clean solves per week).
- **Difficulty mix** stacked bar (Easy/Medium/Hard per week).
- **Topic mastery grid**: each topic colored by mastered/total ratio (red → green).
- **Weakness heatmap** by pattern × difficulty.
- KPI strip: total solved, mastered, current streak, longest streak, this-week minutes, avg attempts.

Gamification (uses existing `award_xp_idempotent` RPC + achievements system):

- **+5 XP** per new entry, **+10 XP** per clean revision, **+50 XP** when an entry becomes mastered. All idempotent via `reference_id = 'practice-hub:<entry_id>:<event>'`.
- New achievements: **First Solve**, **7-Day Streak**, **30-Day Streak**, **100 Problems**, **First Mastered**, **10 Mastered**, **Pattern Slayer** (50 solves in one pattern).
- Show earned XP toast on save; surface achievement unlock modal via the existing achievements provider.

### 7. UI / nav polish

- Sidebar entry renamed to **Practice Hub** with the `NotebookPen` icon (already in place — just relabel).
- Studio tab in `_shared.tsx` renamed to **Practice Hub**.
- New header on the page with the four stat tiles + Quick Add + a small "Today's vibe" inline editor.
- Empty states refreshed with helpful CTAs ("Paste a LeetCode link to log your first solve").

### Out of scope (kept for later)

- AI auto-tagging / similar-problem suggestions
- Public sharing of a solve log
- Mobile-only swipe gestures

### Technical layout

```text
src/features/practice-hub/         (rename of dsa-journal)
  api.ts                           +useSnooze, +useMarkMastered, +useArchive, +useImportCSV, +useExport
  srs.ts                           unchanged
  types.ts                         +new columns
  filters.ts                       URL <-> filter state helpers
  csv.ts                           parse / serialize
  components/
    EntryForm.tsx                  + code, complexity, companies, confidence, favorite, source auto-detect
    EntryQuickAdd.tsx              new (smart paste-and-save)
    EntryCard.tsx                  + favorite star, confidence, companies, source badge
    EntryTableRow.tsx              new (table view row)
    FiltersBar.tsx                 new (URL-synced)
    Heatmap.tsx                    unchanged
    StreakCalendar.tsx             new
    RevisionsBoard.tsx             new (Overdue / Today / Upcoming + bulk)
    UpcomingCalendar.tsx           new (month grid of upcoming revisions)
    Analytics.tsx                  + trend charts, mastery grid, KPI strip
    ImportDialog.tsx               new
    ExportMenu.tsx                 new
    QuickAddFab.tsx                new
    KeyboardShortcuts.tsx          new (registers hotkeys for the page)

src/pages/learn/dsa-studio/
  PracticeHubPage.tsx              renamed JournalPage; tabs: Today / Revisions / History / Analytics
  _shared.tsx                      tab label "Practice Hub"

src/components/DashboardSidebar.tsx  label "Practice Hub"
mem://features/learn/dsa-practice-journal → renamed mem://features/learn/practice-hub
```

### Build order

1. Migration (new columns + indexes).
2. Rename folder/files/route labels; update sidebar + studio tab + memory.
3. Filters bar + table view + URL sync + search.
4. Richer EntryForm + QuickAdd FAB + keyboard shortcuts + source auto-detect.
5. Revisions tab (snooze / bulk / upcoming calendar) and snooze backend.
6. Import/Export (CSV/JSON + copy summary).
7. Analytics upgrades + streak calendar.
8. XP hooks + new achievements registration.
9. Smoke-test full flow signed-in, fix any TS issues, verify build.
