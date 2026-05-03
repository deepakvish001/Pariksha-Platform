# Private problem library + "Add to contest" workflow

## Current state

- `coding_problems.is_published` defaults to `false`, and RLS already blocks non-admins from seeing draft problems. So new problems are *already* private to the admin panel — but the admin UI calls them "Drafts" and the contest editor only lets admins attach **published** problems, which makes the workflow feel incomplete.
- `contest_problems` RLS only exposes problems to the public after `contests.status` becomes `live`/`ended`, but it still relies on `coding_problems` SELECT, which blocks drafts for non-admins. So a draft problem attached to a contest is invisible even to registered contestants once the contest goes live.

## Goal

1. Make it explicit that any new problem is **Private (admin-only)** until published.
2. From the admin problems list, give two one-click actions per row:
   - **Publish** → makes it visible in the user library.
   - **Add to contest** → opens a picker of admin contests (draft / upcoming / live) and attaches the problem (even if it's still private).
3. Make sure draft problems attached to a live contest are visible to **registered contestants** (and only them), so admins can run "contest-only" problems that never appear in the public library.

## UX changes

### `/admin/problems` list

- Replace the "Published" toggle column with a **Visibility** badge column:
  - `Private` (amber) — `is_published = false`
  - `Public` (emerald) — `is_published = true`
  - Tooltip on `Private`: "Visible only in the admin panel and to contestants if attached to an active contest."
- Add per-row actions next to Edit / Duplicate:
  - **Publish to library** (only for `Private`) → toggles `is_published = true` after a confirm dialog.
  - **Add to contest** → opens a `Dialog` listing all admin contests in `draft`, `published`, or `live` status with a search box. Selecting one inserts a `contest_problems` row at the end of the contest's order with default `points = 100`. Toast: "Added to <Contest title>". If the problem is already attached, show "Already in this contest" inline and disable the row.
- Keep the existing filter chips, but rename **Drafts** → **Private** and **Published** → **Public**.

### `/admin/contests/:id/edit` — Problems section

- Drop the `is_published = true` filter on the picker. Show all problems and tag each with a small `Private` or `Public` badge so the admin knows what they're attaching.
- Inline helper text under the picker: "Private problems remain hidden from the library but become visible to registered contestants while this contest is live."

### `/admin/problems/new` and editor

- New problems already start as `is_published = false`. Add a one-line banner at the top of the editor for new/unsaved problems: "This problem will be saved as Private. You can publish it or attach it to a contest from the problems list."

## Backend changes

### Migration: relax draft visibility for active-contest problems

Add a SELECT policy on `coding_problems` (and the supporting `coding_problem_tests`, `coding_problem_starter_code`, `coding_problem_sql_specs`) that allows reads when:

```text
EXISTS (
  SELECT 1
  FROM contest_problems cp
  JOIN contests c ON c.id = cp.contest_id
  JOIN contest_registrations r
    ON r.contest_id = c.id AND r.user_id = auth.uid() AND r.status = 'registered'
  WHERE cp.problem_slug = coding_problems.slug
    AND c.status = 'live'
    AND now() BETWEEN c.starts_at AND c.ends_at
)
```

This keeps the library "private by default" rule intact while letting registered contestants run/submit a draft attached to their live contest. Admins keep their existing `has_role` policy.

Same predicate is added to `coding_problem_tests` (sample tests only), `coding_problem_starter_code`, and `coding_problem_sql_specs` so editor + run/submit work end-to-end during the contest.

### Migration: helper RPC `attach_problem_to_contest(_problem_slug text, _contest_id uuid)`

- `SECURITY DEFINER`, admin-only.
- Validates the slug exists and the contest is owned by the platform (any admin can attach).
- Inserts into `contest_problems` with `order_index = COALESCE(max(order_index)+1, 0)` and `points = 100`. Idempotent: returns existing row if already attached.
- Returns `{ok, contest_id, problem_slug, order_index, already_attached}`.

The new "Add to contest" dialog calls this RPC instead of doing the math client-side.

## Files to add / edit

- **migrations**
  - `add_contest_visibility_for_drafts.sql` — new SELECT policies on the four problem tables.
  - `attach_problem_to_contest_rpc.sql` — RPC + grant to `authenticated`.
- **src/pages/admin/AdminProblemsList.tsx** — visibility badge column, Publish + Add-to-contest actions, rename filter chips.
- **src/components/admin/AddProblemToContestDialog.tsx** *(new)* — searchable list of admin contests, calls the RPC, invalidates `["admin", "contests", id, "problems"]`.
- **src/pages/admin/contests/ContestEditor.tsx** — drop `is_published = true` filter, render Private/Public badges in the picker, add helper copy.
- **src/pages/admin/ProblemEditor.tsx** — banner for new problems explaining the Private default.
- **src/hooks/admin/useAdminContests.ts** — add `useAttachProblemToContest()` mutation that wraps the RPC.

## Out of scope

- No changes to `/library/problems` user UI — RLS keeps drafts hidden there.
- No changes to contest scoring, leaderboard, or registration flow.
- No bulk "Add to contest" or multi-select on the problems list (can be a follow-up).
