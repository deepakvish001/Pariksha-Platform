## Goal

Build an Admin Panel that lets admins create, edit, upload (CSV/JSON bulk), and manage coding problems entirely from the UI — replacing the hardcoded `src/data/codingProblemsData.ts` with a database-driven system. Admins can also manage difficulty metadata, hidden tests, SQL specs, and bulk-import from JSON.

## Scope

- New admin role + access guard
- DB-backed coding problems (replaces static file as source of truth, with fallback)
- Admin pages under `/admin/*`
- CRUD UI for problems with tabs (Statement, Examples, Constraints/Hints, Starter Code, Reference Solution, Tests, SQL Spec, Limits)
- Bulk JSON/CSV upload + validation preview
- Audit log of admin actions

## Phase 1 — Roles & Access

1. **Migration**: create `app_role` enum (`admin`, `moderator`, `user`), `user_roles` table, and `has_role(uuid, app_role)` SECURITY DEFINER function (per project's user-roles standard).
2. Seed the current logged-in user as `admin` (one-time via migration insert prompt).
3. New hook `useUserRole()` and `<AdminRoute>` guard component.
4. Sidebar entry "Admin" (visible only when `has_role(admin)` returns true).

## Phase 2 — Database Schema

New tables (all RLS-protected; SELECT public for non-sensitive fields, INSERT/UPDATE/DELETE admin-only via `has_role`):

- `coding_problems` — slug (PK), title, difficulty, topics (text[]), description (md), examples (jsonb), constraints (text[]), hints (text[]), cpu_time_limit_sec, memory_limit_kb, is_published (bool), created_by, created_at, updated_at
- `coding_problem_starter_code` — problem_slug, lang_id, code (allows per-language rows)
- `coding_problem_reference_solutions` — problem_slug, lang_id, code (admin-only SELECT — never expose to clients)
- `coding_problem_tests` — id, problem_slug, kind (`sample` | `hidden`), input, expected, ord (hidden tests admin-only SELECT)
- `coding_problem_sql_specs` — problem_slug (PK), schema_sql, seed_sql, reference_query, order_matters, starter
- `admin_audit_log` — id, actor_id, action, entity_type, entity_slug, diff (jsonb), created_at

Extend `coding_problems_meta` to FK from `coding_problems.slug`.

## Phase 3 — Data Layer

1. `useAdminProblems()` — list/search/paginate with filters (difficulty, topic, published).
2. `useAdminProblem(slug)` — fetch full problem joined with starter/solution/tests/sql.
3. Mutations: `createProblem`, `updateProblem`, `deleteProblem`, `publishToggle`, `upsertStarterCode`, `upsertReferenceSolution`, `replaceTests`, `upsertSqlSpec`.
4. Update existing consumers (`CodingProblems.tsx`, `CodingProblemDetail.tsx`, `useDailyChallenge.ts`, `RecommendationStrip.tsx`, `TopicMasteryChips.tsx`) to load from DB via a new `useCodingProblems()` hook (cached via React Query). Keep `codingProblemsData.ts` only as a typing source.
5. Edge functions `run-code` / `submit-code` updated to fetch hidden tests server-side from DB (never trust client) using service-role.

## Phase 4 — Admin Pages (`/admin`)

```text
/admin                       → Admin dashboard (stats: total problems, drafts, recent edits)
/admin/problems              → Problems table (search, filter, bulk publish/delete)
/admin/problems/new          → Create wizard
/admin/problems/:slug/edit   → Tabbed editor
/admin/problems/import       → Bulk JSON/CSV upload
/admin/audit                 → Audit log viewer
```

### Editor tabs (`ProblemEditor.tsx`)

1. **Basics** — slug, title, difficulty, topics (chip input), is_published toggle
2. **Statement** — Markdown editor with live preview
3. **Examples** — repeatable rows (input, output, explanation)
4. **Constraints & Hints** — list editors
5. **Starter Code** — Monaco tabs per language (reuse existing `MonacoEditor`)
6. **Reference Solution** — Monaco tabs per language (admin-only)
7. **Tests** — two tables (Sample, Hidden) with input/expected, drag-reorder, CSV paste
8. **SQL Spec** (shown when `sql` lang enabled) — schema, seed, reference query, order_matters
9. **Limits** — cpuTimeLimitSec, memoryLimitKb

Save → upserts atomically inside a Postgres function `admin_save_problem(payload jsonb)` for transactional consistency.

### Bulk Import (`/admin/problems/import`)

- Drag-and-drop JSON file (array matching `CodingProblem` shape) or CSV (basics only).
- Zod-validated preview table: rows colored green (valid) / red (errors with field details).
- "Import N valid problems" button — upsert by slug, audit log per row.
- Includes a "Download starter JSON template" link.
- Bonus: "Import from existing static file" one-click button that ingests `CODING_PROBLEMS` array as the initial seed.

## Phase 5 — Security

- All admin mutations gated by `has_role(auth.uid(), 'admin')` in RLS.
- Reference solutions + hidden tests: SELECT policy `has_role(admin)` only; consumed server-side by edge functions via service role.
- Edge functions verify JWT and role server-side before returning sensitive data.
- Zod validation on every mutation hook + edge function body.

## Phase 6 — UX polish

- Unsaved-changes warning on editor (block route change).
- Auto-save drafts to localStorage every 5s.
- Slug auto-generated from title with collision check.
- Markdown preview side-by-side toggle.
- Keyboard shortcut Cmd+S to save.
- Empty states + skeletons.

## Out of scope (separate follow-ups)

- Versioning/rollback of problem edits beyond audit log diff
- Multi-admin review/approval workflow
- Image upload inside markdown statements (can be added with `avatars`-style bucket later)

## Technical notes

- Roles table follows project's strict pattern (`mem://core` user-roles rule).
- Migration must seed initial admin (will prompt for the user's email/uid at apply time).
- All consumers switch to React Query cache with 5-min staleTime to avoid hammering DB.
- `admin_save_problem` RPC accepts a single jsonb payload; runs `INSERT ... ON CONFLICT` for parent + child rows inside a transaction.
- Monaco editor + react-markdown already available in the project.
