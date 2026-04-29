
## Goal

Make the admin panel feel "complete end-to-end": when an admin publishes/edits/unpublishes a coding problem, learners on `/library/problems` immediately see the change. Also add a visible **Admin** button so the owner (vishwakarmadeepak310@gmail.com) can jump into `/admin` from the dashboard, and tighten remaining UX gaps in the admin panel.

## What's already built (no rework)

- DB tables: `coding_problems`, `coding_problem_starter_code`, `coding_problem_reference_solutions`, `coding_problem_tests`, `coding_problem_sql_specs`, `admin_audit_log`, `user_roles`, `app_role` enum, `has_role()` security definer, RLS.
- RPCs: `admin_get_full_problem`, `admin_save_problem`.
- Edge function `submit-code` already pulls hidden tests server-side.
- Admin pages: Overview, Problems List (search, difficulty/topic/status filters, duplicate dialog, delete dialog, publish toggle, audit logging), Problem Editor (read-only slug for existing, draft autosave, publish/unpublish AlertDialog with confirmation, status banner, Cmd/S, slug-collision check for new), Bulk Import (Zod validation, corrected-JSON download with re-validation summary, CSV error export, seed loader), Audit Log page.
- Hook `useDbCodingProblems` exists but is **not wired** into the learner-facing pages.

## Phase 1 — Connect admin → learner (the missing link)

Right now `/library/problems` and `/library/problems/:slug` still read from the static `CODING_PROBLEMS` array, so publishing a new problem in admin doesn't show up for users. Fix:

1. **Merge DB problems with static data** in `src/pages/library/CodingProblems.tsx`:
   - Call `useDbCodingProblems()`.
   - Build the working list as `[...staticProblems, ...dbProblemsNotInStatic]` (de-dupe by slug; DB row wins on conflict so admin edits override). Memoize.
   - Replace the 6 direct `CODING_PROBLEMS` references (lines 381, 564, 645–650, 683) with the merged list.
   - Ensure topic/difficulty stat cards count merged list.

2. **Problem detail** in `src/pages/library/CodingProblemDetail.tsx`:
   - Try DB lookup first via a new lightweight hook `useDbCodingProblem(slug)` (single problem + starter/ref/sample/sql joins, mirrors `useDbCodingProblems` for one slug).
   - Fall back to `getCodingProblemBySlug(slug)` (static) if not found in DB.
   - Loading skeleton while DB query resolves.

3. **React Query invalidation hand-off**: when admin publishes/unpublishes/saves/deletes, also invalidate `["coding-problems-db"]` so learner pages already loaded refresh on next focus. Add the invalidation to `useTogglePublish`, `useSaveProblem`, `useDeleteProblem`, `useDuplicateProblem` in `src/hooks/useAdminProblems.ts`.

## Phase 2 — Admin entry button on the dashboard

Add a visible **Admin** entry for users with the `admin` role:

1. In `src/components/DashboardSidebar.tsx`:
   - Import `useUserRole`.
   - In the `homeNavItems` render path, conditionally append `{ title: "Admin Panel", url: "/admin", icon: Shield }` when `isAdmin === true`.
   - Add `/admin` to `ACTIVE_ROUTES` so it isn't shown as locked.
   - Use a distinct accent color (e.g. `text-primary`) for the icon.

2. **Top-right shortcut** in `src/pages/DashboardMatrix.tsx`: small "Admin" button (Shield icon) shown only when `isAdmin`, linking to `/admin`. Subtle, lives next to other quick actions.

3. Confirmation: the user `vishwakarmadeepak310@gmail.com` already has the admin role inserted in earlier phases. We will run a quick read query to verify; if missing, insert into `user_roles`.

## Phase 3 — Admin panel polish

Small high-leverage improvements based on the current code:

1. **Overview KPIs** (`AdminOverview.tsx`): add two more cards — "Total submissions (7d)" and "Active learners (7d)" — using simple counts from `code_submissions` (group by date). Read-only; admin-gated by route.

2. **Problems list quick filters**: add count chips above the table ("All N", "Drafts X", "Published Y") that act as one-click status filters. Add a "Last updated" sortable column header.

3. **Editor "View as learner" button**: in `ProblemEditor.tsx`, add a button next to Save that opens `/library/problems/<slug>` in a new tab when the problem exists. Disabled for new/unsaved drafts.

4. **Validation pre-publish gate**: extend the publish AlertDialog to show a checklist (description present, ≥1 sample test, ≥1 hidden test, ≥1 starter language, reference solution for at least one language). Block confirm if any required check fails; warn (not block) on optional ones.

5. **Audit log filters**: in `AuditLog.tsx`, add filter by action type (publish / unpublish / save / delete) and date range; show the actor's email by joining `profiles` (best-effort, fall back to short user id).

## Phase 4 — Verification

- Manual: create a new problem in `/admin/problems/new`, fill required fields, publish → confirm it appears in `/library/problems` table, opens cleanly at `/library/problems/<slug>`, sample tests visible, submit runs (hidden tests stay server-side).
- Unpublish → confirm it disappears for learners but remains in admin list as Draft.
- Duplicate → confirm draft copy appears with `-copy` slug suffix.
- Sidebar shows "Admin Panel" only when logged in as admin; hidden for guests/regular users.

## Technical notes

- New file: `src/hooks/useDbCodingProblem.ts` (single-problem variant of existing `useDbCodingProblems`).
- No DB schema changes needed.
- No new edge functions.
- Keep static `CODING_PROBLEMS` as a baseline fallback so existing 50+ problems remain available even if DB is empty.

## Out of scope

- Migrating the static array into the DB (that's the existing "Load static seed" flow in Bulk Import — admin can run it manually).
- Public admin invite flow (admin role assigned via DB only).
- Rich tag/topic taxonomy management UI.
