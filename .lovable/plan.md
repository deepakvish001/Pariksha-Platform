
# Meaningful Slugs & Breadcrumbs — App-wide

Goal: every URL segment is a readable slug (not a UUID/hash) and every breadcrumb shows a real human label sourced from the entity, not a path-cased guess.

This is a large change. I'll ship it in 5 phases so the app stays working at every step.

## Scope (entities getting slugs)

| Area | Current URL | New URL |
|---|---|---|
| B2B orgs | `/companies/:slug` (already good) | keep |
| Assessments (B2B) | `/companies/acme/assessments/ea972db1-...` | `/companies/acme/assessments/my-test` |
| Attempts | `/.../assessments/<uuid>/attempts/<uuid>` | `/.../assessments/my-test/attempts/john-doe-2` |
| Contests | `/contests/<uuid>` | `/contests/spring-cup-2026` |
| Contest problems | `/contests/<uuid>/problems/<uuid>` | `/contests/spring-cup/problems/two-sum` |
| Blog posts | already slugged | verify |
| Public profiles | `/u/:username` (already good) | keep |
| Library items (DSA / SQL / Interview / Companies) | mixed | normalize to slugs |
| Arena rooms / matches | `<uuid>` | short readable codes (already partly done for join code) |
| Quizzes | `<uuid>` | slug |
| Roadmaps | mostly slugged | verify |
| Admin pages | UUIDs in URL stay (admin-only), but breadcrumbs resolve to real names |

## Phase 1 — Schema: add `slug` columns

One migration adds `slug TEXT` (unique within the right scope) to:
`assessments`, `attempts`, `contests`, `contest_problems`, `quizzes`,
`org_members` (handle), plus any library tables missing slugs.

- Unique indexes scoped correctly (e.g. `(org_id, slug)` for assessments, `(contest_id, slug)` for contest problems, global unique for contests).
- Backfill trigger: on insert/update of `title`/`name`, if `slug` is null, generate from title using a `public.slugify(text)` SQL function + numeric suffix on collision.
- One-time backfill UPDATE for all existing rows.
- RLS unchanged (slug is just another column).

## Phase 2 — Route resolution layer

New helper `src/lib/routing/resolveBySlugOrId.ts`:
- Accepts a param that's either a UUID or a slug.
- Looks up by slug first, falls back to UUID.
- If a UUID is hit, returns a `redirectTo` with the canonical slug URL so the page can `<Navigate replace>` to the pretty URL.

Updated route components (`AssessmentDetail`, `AttemptDetail`, `ContestDetail`, `ContestPlayProblem`, etc.) use this helper. Old UUID URLs keep working but get rewritten in the address bar.

## Phase 3 — Link generation

Centralize URL building in `src/lib/routing/paths.ts`:
```
paths.b2b.assessment(org, assessment)       // /companies/acme/assessments/my-test
paths.b2b.attempt(org, assessment, attempt) // /.../attempts/john-doe-2
paths.contest(contest)
paths.contestProblem(contest, problem)
paths.quiz(quiz)
```
Replace every hand-built `\`/contests/${id}\`` template literal across the codebase with these helpers (ripgrep sweep).

## Phase 4 — Breadcrumb resolver

New hook `useBreadcrumbLabels(segments)` that:
- Walks the path segments
- For known entity segments, queries the corresponding table (cached via react-query) to fetch the display name
- Returns `[{ label, to }]` for the header

Wire it into:
- `OrgShell` (B2B header) — replaces current `humanize()` + `#hash` fallback
- `useAdminBreadcrumb` — same treatment for `/admin/contests/:id/...`
- `ContestKioskLayout`, `ArenaLayout`, any other layout with crumbs

Result: instead of "Assessments › #ea972db" you see "Assessments › My Test › Attempts › John Doe".

## Phase 5 — Redirects, sitemap, tests

- Catch legacy UUID URLs (Phase 2 redirect) and 301-style replace.
- Update `scripts/generate-sitemap.ts` to emit the new slug URLs for public entities (contests, blog, profiles).
- Add Playwright tests:
  - Hitting `/contests/<uuid>` redirects to `/contests/<slug>`
  - Breadcrumb on an assessment manage page shows the assessment title, not a hash
  - Slug collision: creating two assessments named "My Test" produces `my-test` and `my-test-2`

## Technical notes

- **Slug generator (SQL):** lowercase, strip diacritics, replace non-alphanumerics with `-`, trim, max 60 chars, append `-N` on collision via trigger.
- **Stale UUID links:** anything stored in DB (notifications, emails) keeps working because Phase 2 resolver accepts both.
- **No breaking changes** for users currently mid-flow; old bookmarks redirect.
- **Admin pages** keep UUIDs in URL (less churn, internal-only), but their breadcrumbs still get real labels.

## Out of scope

- Renaming top-level routes (`/learn`, `/library`, `/arena`) — they're already meaningful.
- Changing org slugs (already implemented and stable).
- i18n of slugs (English only for now).

## Deliverable order

1. Approve plan
2. Migration (Phase 1) — needs your approval
3. Resolver + paths helper (Phases 2 & 3)
4. Breadcrumb resolver (Phase 4)
5. Redirects + sitemap + tests (Phase 5)

Ready to start with the Phase 1 migration when you approve.
