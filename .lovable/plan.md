## Goal
Make `/library/problems` more informative, faster to navigate, and more visually polished — while keeping the existing table flow intact.

## What changes for the user

### 1. Better discovery & filtering
- **URL-persisted filters**: search, difficulty, topic, status, sort, view, page all sync to query params (survive refresh & shareable links).
- **Multi-select topics** via a popover with checkboxes + chips (currently single topic only).
- **New "Companies" filter** derived from problem `topics`/tags so users can drill into FAANG-style sets.
- **Sort control**: Default, Title A→Z, Difficulty (Easy→Hard / Hard→Easy), Most Solved by you, Recently Attempted.
- **Active filters bar** with removable chips and a single "Clear all" button (with toast confirmation, matching submissions history pattern).
- **Search upgrade**: matches title + topics + slug with 200ms debounce.

### 2. New views
- **View switcher (Grid / Table)** stored in URL.
  - **Grid view**: card per problem with difficulty stripe, topic chips, status icon, attempts count, and a quick "Solve" CTA.
  - **Table view**: existing layout, plus columns for Acceptance (your pass rate) and Last Attempt date.
- **Compact density toggle** for the table.

### 3. Richer stats header
- Keep the 4 summary cards but add:
  - **Streak / momentum mini-strip**: solved this week vs last week.
  - **Progress ring** for total completion %.
  - **"Continue solving" card**: surfaces the most recent unsolved attempted problem with a one-click resume.
- **Random** button gets a dropdown: Random, Random Easy, Random from current filters, Daily Challenge (deterministic by date).

### 4. Pagination & performance
- Client-side pagination (24/page grid, 50/page table) since `CODING_PROBLEMS` is static — no backend cost.
- Skeleton rows while `useUserSolvedSlugs` resolves to avoid flash of empty status icons.

### 5. Per-problem polish
- Hover preview popover on title showing first 2 lines of description + example count.
- Status icon tooltips ("Solved on …", "Attempted N times", "Not started").
- Right-click / kebab menu per row: Open, Open in new tab, Copy link, Mark for later (local-storage bookmark).

### 6. Bookmarks / "For later"
- Local-storage backed bookmark star on each row/card. New filter chip "Bookmarked".
- (No DB migration — keeps scope tight; can be promoted to Supabase later.)

### 7. Empty & loading states
- Friendly empty state illustration + "Reset filters" button.
- Skeleton grid/table while attempts data loads.

### 8. Design refresh (matches global aesthetic)
- Glassmorphism cards with subtle gradient on the header block.
- Difficulty pill colors unchanged (keeps existing semantic palette).
- Framer-motion staggered entrance for grid items, spring physics consistent with site standards.
- Sticky filter bar on scroll for fast re-filtering on long lists.
- Mobile: filters collapse into a sheet triggered by a "Filters" button with active count badge.

## Technical implementation

### Files to edit
- `src/pages/library/CodingProblems.tsx` — main rewrite of state, filters, views, layout.

### New files
- `src/components/library/coding/ProblemCard.tsx` — grid card.
- `src/components/library/coding/ProblemFiltersBar.tsx` — search + multi-topic popover + sort + view toggle + active chips.
- `src/components/library/coding/ProblemStatsHeader.tsx` — stats + progress ring + continue card.
- `src/components/library/coding/RandomMenu.tsx` — dropdown for random/daily.
- `src/hooks/useCodingProblemBookmarks.ts` — localStorage bookmark set with subscribe API.
- `src/hooks/useCodingAttemptStats.ts` — derives per-slug attempts, last attempt date, pass rate from existing `code_submissions` (extends `useUserSolvedSlugs` with one extra query, single round-trip).

### State model
- All filters in `useSearchParams`: `q`, `diff`, `topics` (csv), `status`, `sort`, `view`, `page`, `bookmarked`.
- Derived `filteredProblems` via `useMemo`; pagination slice via `useMemo`.

### Data
- No schema changes. `useCodingAttemptStats` runs one `select problem_slug, verdict, created_at` query (already done by `useUserSolvedSlugs` — merge into a single hook to avoid duplicate fetches).

### Accessibility
- All interactive controls keyboard-reachable; tooltips via existing `Tooltip` primitive; aria-labels on icon-only buttons.

## Out of scope
- No backend migrations.
- No changes to `CodingProblemDetail` page or submissions history.
- Bookmarks stay local-only this round.
