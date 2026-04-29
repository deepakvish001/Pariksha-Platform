## Goal

Add a dedicated admin page that lists every `publish` and `unpublish` event for coding problems, with filters (action, problem slug search, date range, actor) and proper pagination. Distinct from the existing general Audit Log (which shows all admin actions).

## New files

**`src/hooks/usePublishHistory.ts`** — React Query hook fetching paginated publish/unpublish events.
- Query key: `["publish-history", filters, page]`.
- Uses Supabase ranged `.range(from, to)` with `count: "exact"` for total rows.
- Filters applied server-side:
  - `entity_type = 'coding_problem'`
  - `action in ('publish','unpublish')` (or single action when filter set)
  - `entity_slug ilike %search%` when slug search provided
  - `created_at >= from` / `<= to` when date range set
  - `actor_id = ?` when actor filter set
- Returns `{ rows, total, pageSize }`.
- Joins actor display via a second query: fetch `profiles` (`user_id, full_name, avatar_url`) for the unique `actor_id`s in the page and merge client-side (no FK exists, so no nested select).

**`src/pages/admin/PublishHistory.tsx`** — The page UI inside `AdminShell`.
- Header: title "Publish History" + subtitle.
- Filter bar (responsive grid):
  - Action select: All / Published / Unpublished.
  - Slug search input (debounced 300ms).
  - Date range: two date pickers (From / To) using existing `Calendar` + `Popover`.
  - Actor select: dropdown of distinct actors that appear in current results (with "All admins" default).
  - "Reset filters" ghost button.
- Results table (semantic tokens only):
  - Columns: Action badge (green=Published, amber=Unpublished), Problem (slug, links to `/admin/problems/:slug/edit`), Actor (avatar + name or short id), Time (relative + absolute tooltip).
  - Empty state when no rows.
  - Loading skeletons.
- Pagination footer:
  - "Showing X–Y of Z events".
  - Prev / Next buttons + page-size select (25 / 50 / 100, default 25).
  - Disable buttons at boundaries.
- "View as learner" quick link per row when problem is currently published (optional, only if cheap).

## Wiring

- **`src/App.tsx`** — add `<Route path="publish-history" element={<PublishHistory />} />` under the existing `/admin` parent route, plus the import.
- **`src/components/admin/AdminShell.tsx`** — add nav item: `{ to: "/admin/publish-history", label: "Publish History", icon: History }` (lucide `History`), placed between Problems and Audit Log.

## Technical details

- All filters live in component state and feed a single hook input. Page resets to 1 whenever filters change (via `useEffect` on a stable filter key).
- Use `keepPreviousData: true` so pagination feels instant.
- Use the existing `formatRelative` style helper pattern from `ProblemEditor.tsx` (extract a tiny shared util `src/lib/formatRelative.ts` so both files import it instead of duplicating).
- Styling uses semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`, `bg-emerald-500/10` for published badge, `bg-amber-500/10` for unpublished — matching existing banner colors in `ProblemEditor.tsx`).
- RLS: `admin_audit_log` already permits SELECT for admins, so no migration needed.

## Out of scope

- No CSV export (can add later if asked).
- No edits to the existing generic `AuditLog.tsx` page — it stays as-is for cross-cutting admin actions.
