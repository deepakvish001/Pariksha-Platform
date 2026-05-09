
# Parikshaa: Rebrand, Route Restructure & Super-Admin

This plan does four things in one focused pass:

1. **Rebrand**: `/` becomes the new Parikshaa landing.
2. **Move learning app**: every `/dashboard/*` route becomes `/learn/*`. No backwards compatibility.
3. **Private org dashboards** at `/companies/:slug` and `/colleges/:slug` (members only).
4. **Super-admin Control Center** at `/admin/parikshaa` covering users, orgs, content moderation and growth.

---

## 1. New `/` — Parikshaa landing

Replace the current Byteskill landing component at `/` with a new Parikshaa hero. Existing landing files are kept but no longer routed (we may delete in cleanup later).

Sections (top to bottom):

- **Hero** — "One platform. Two outcomes."
  - Primary CTA: **Learn (Free)** → `/learn`
  - Secondary CTA: **For Teams** → `/b2b/onboarding`
  - Tertiary text-link: "Already invited? Sign in" → `/login`
- **Two pillars side-by-side**
  - *Learn* (free, students) — links into `/learn` with screenshot of sheets / roadmaps.
  - *Hire & Assess* (companies + colleges) — links into `/b2b`.
- **Logos band** (re-uses existing `Get Placed` logos).
- **How it works** (3 steps for each pillar in tabs).
- **Pricing teaser** → `/pricing`.
- **Footer** — single, unified.

Header is shared with the rest of the public surface: `Parikshaa` lockup left, links (Learn, For Teams, Pricing) center, Sign in / Get started right.

The old `Byteskill` brand assets and orange theme are kept inside `/learn/*` (the learning app keeps its current look). Only the public marketing surface becomes Parikshaa-blue.

## 2. `/dashboard` → `/learn` (full rename)

User chose **rewrite + drop**, so:

- Mount the existing learning app routes under `/learn` instead of `/dashboard`. Same components, same nested children, same layout wrapper.
- Sweep all internal `Link to="/dashboard…"`, `navigate("/dashboard…")`, redirect targets, route-restore localStorage keys, breadcrumbs, hard-coded URLs in emails / share intents, and SEO sitemap.
- Add a single catch-all `<Route path="/dashboard/*" element={<Navigate to="/learn/..." replace />} />` so users currently mid-session don't 404 on next click. (This is the only redirect — no `/dashboard` UI, no link to it.)
- Update `RouteRestorer` so the persisted "last visited" path migrates `/dashboard/x` → `/learn/x` once on load.
- Update the **Learn (Free)** CTA on `/` to point to `/learn`.

Files touched (estimated): `src/App.tsx`, `src/components/RouteRestorer.tsx`, `src/components/DashboardSidebar.tsx`, `src/components/Navbar.tsx`, `src/components/MobileFAB.tsx`, `src/components/FeatureTabs.tsx`, plus ~30 page files that hard-code `/dashboard`. Done with a structured find-and-replace.

## 3. Private org dashboards at `/companies/:slug` & `/colleges/:slug`

These are **not public profiles**. They're the recruiter-side workspace, just under a vanity URL instead of the opaque `/b2b/dashboard` shell.

Routing:

```text
/companies/:slug     → OrgWorkspace (only if org.type = 'company' AND user is a member)
/companies/:slug/assessments
/companies/:slug/assessments/:id
/companies/:slug/assessments/:id/attempts/:attemptId
/companies/:slug/question-bank
/companies/:slug/team
/companies/:slug/settings

/colleges/:slug      → same set, only if org.type = 'college'
```

Behavior:

- `OrgRoute` guard reads `:slug`, looks up the org, checks `is_org_member(org.id)` via the existing helper. On fail → 404 (we deliberately do **not** reveal slug existence to non-members).
- The page tree reuses every existing `/b2b/*` page — they just receive the resolved `org` from a new `OrgContext` provider instead of "first org of current user". This means we can keep `/b2b/dashboard` as a "pick an org" router that 302s into the right slug URL.
- Sending an invite still happens from inside this dashboard → invite email links to `/assessments/join/:token` (unchanged, candidate-side).
- Onboarding (`/b2b/onboarding`) on success now redirects to `/companies/:slug` or `/colleges/:slug` based on chosen type.

No new tables. We do add:
- A unique partial index on `(type, slug)` if not already present.
- A migration to backfill any orgs missing a slug (kebab-case of name + collision suffix).

Old `/b2b/*` URLs are kept as redirects to the new slug URLs for now (zero broken bookmarks for existing recruiters).

## 4. Super-Admin Control Center — `/admin/parikshaa`

A single shell with a left sidebar; gated by `has_role(auth.uid(), 'admin')`. Purely additive — does not touch the existing learning admin at `/admin/*`.

Sections (one route each):

| Route | Purpose | Key actions |
|---|---|---|
| `/admin/parikshaa` | Overview | Users / orgs / assessments / leads counters, 30-day signup chart, recent leads, recent orgs awaiting approval. |
| `/admin/parikshaa/users` | Users | Search by email / name, filter by role, change platform role, suspend (sets `profiles.suspended_at`), impersonate (issues a magic link via edge function). |
| `/admin/parikshaa/orgs` | Companies & Colleges | Approve new orgs (gate so new signups land in `pending` until approved), edit display name, edit slug (with collision check), mark `featured`, suspend. Tabs split by type. |
| `/admin/parikshaa/moderation` | Content moderation | Review reported questions and AI-generated content; approve / hide. Pulls from the existing `content_reports` table if present, otherwise we add one. |
| `/admin/parikshaa/leads` | Growth | Lists `b2b_leads` with status pipeline (`new → contacted → qualified → closed`), notes, signup funnel chart. |

New schema (small):

```text
profiles            + suspended_at TIMESTAMPTZ
organizations       + status TEXT DEFAULT 'pending' (pending|approved|suspended)
                    + featured BOOL DEFAULT false
                    + approved_at TIMESTAMPTZ
                    + approved_by UUID
admin_actions       audit log: actor_id, action, target_type, target_id, payload jsonb, created_at
```

RLS:

- All new admin endpoints gated by `public.has_role(auth.uid(), 'admin')`.
- `b2b_leads`, `admin_actions` already admin-only.
- `organizations` reads stay member-scoped; admins get a separate "all orgs" policy.
- Slug edits allowed only for admins, not org members (prevents recruiter-side confusion).

New edge function: `admin-impersonate` — creates a one-time magic link for the target user and writes an `admin_actions` row.

## 5. Build order

1. **DB migration**: add `status / featured / approved_at / approved_by` to `organizations`, `suspended_at` to `profiles`, create `admin_actions`, partial unique index `(type, slug)`. RLS for each.
2. **Route rename**: mount learning under `/learn`, sweep links, add legacy `/dashboard/*` redirect, update `RouteRestorer`.
3. **Parikshaa landing**: replace `/` page, wire CTAs.
4. **Org slug routes**: `OrgRoute` guard, `OrgContext`, mount `/companies/:slug/*` and `/colleges/:slug/*`, redirect old `/b2b/*` flow.
5. **Super-admin**: new shell + 5 pages + impersonation edge function.
6. **QA pass**: walk every nav surface, every email-generated link, sitemap, route restorer.

## 6. Out of scope (called out so we don't drift)

- Public org profile pages (you explicitly said no).
- Custom domains per org (`acme.parikshaa.app`) — future.
- Stripe billing, seat management, MRR — only proxies in admin chart.
- Migrating the existing `/admin/*` learning admin into the new shell — keeps shipping in parallel.
