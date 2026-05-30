## Goal
Rebuild the entire admin panel's look & feel as a **Dashboard Cockpit** with **Glassmorphism Premium** styling and **spacious** data density. Same amber-on-deep-black palette. **Zero feature loss** — every route, query, mutation, dialog, and permission stays exactly as-is. This is a pure presentation refactor.

## Design language (locked, applied everywhere)

- **Surfaces**: frosted glass cards — `bg-card/40 backdrop-blur-xl` over a deep `#030305` base, hairline borders `border-border/40`, soft amber inner glow on key elements.
- **Ambient backdrop**: AdminBackdrop upgraded — two animated amber orbs (top-left, bottom-right) + faint dot grid + top fade. Lives behind the entire shell.
- **Accent**: amber gradient `from-amber-400 via-orange-500 to-amber-400` reserved for headlines, primary CTAs, active nav rail, and focus rings only.
- **Typography**: tighter tracking on H1/H2, mono for IDs/counts/timestamps, slightly larger body (15px) for "spacious" feel.
- **Motion**: framer-motion fade+rise on page mount (staggered 40ms), hover lift on cards (`-translate-y-0.5`), shimmer on skeletons.
- **Density**: table rows go from `py-2` → `py-3.5`, card padding `p-4` → `p-6`, generous gaps.

## Shell redesign — `AdminShell`, `AdminBackdrop`, `AdminPageHeader`

```text
┌──────────────────────────────────────────────────────────────────┐
│ Glass Topbar: logo · breadcrumb · ⌘K · realtime dot · user menu │
├────────────┬─────────────────────────────────────────────────────┤
│            │ KPI strip (slot, optional per page)                 │
│  Sidebar   ├─────────────────────────────────────────────────────┤
│  (glass,   │                                                     │
│  pinned    │           Page content (glass cards)                │
│  + groups) │                                                     │
│            │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

- **Sidebar**: keep all current groups, pins, badges, collapse, command palette. Repaint only — glass panel, amber active rail, group labels in micro-caps, hover row gets subtle amber wash. Icon-only collapsed mode preserved.
- **Topbar**: new sticky glass bar with breadcrumb (already wired via `useAdminBreadcrumb`), ⌘K palette button, live-realtime pulse dot, theme toggle.
- **`AdminPageHeader`**: keep API (eyebrow / title / description / chips / actions). New look: bigger hero, amber-gradient last word, optional KPI strip slot beneath, decorative corner orb.
- **New shared primitives** (used by every page, no logic):
  - `GlassCard` — replaces ad-hoc `<Card>` styling.
  - `StatTile` — used by Overview/SystemHealth/Arena/Parikshaa overview.
  - `DataTable` wrapper — adds zebra glass rows, spacious padding, sticky header, empty/loading states. Pages keep their own `<table>` markup; wrapper just restyles via class composition.
  - `SectionHeader` — consistent H2 with icon + count chip.
  - `PageTransition` — framer-motion wrapper applied in `AdminShell` so every admin page animates on route change.

## Page-by-page application

All ~25 admin pages get the same treatment via the new shared primitives. No content/behavior changes.

**Overview / dashboards**: `AdminDashboard`, `parikshaa/Overview`, `SystemHealth`, `AdminArena` → use `StatTile` grid + glass section cards.

**Lists & tables**: `AdminUsers`, `AdminProblemsList`, `AdminRoles`, `Reports`, `SubmissionsAdmin`, `QuizzesAdmin`, `LeaderboardsAdmin`, `AchievementsAdmin`, `AuditLog`, `CronJobs`, `SecurityCenter`, `NotificationsAdmin`, `AdminAlerts`, `SupportInbox`, `ArenaModeration`, `SideCamPairings`, `StorageBrowser`, `parikshaa/Users`, `parikshaa/Orgs`, `parikshaa/Leads`, `parikshaa/Moderation`, `parikshaa/Experiences`, `parikshaa/EmailPreview`, `parikshaa/ExperienceAuditLog` → wrap existing table in `DataTable`, swap `<Card>` for `GlassCard`, add `AdminPageHeader`.

**Editors / forms**: `ProblemEditor`, `BulkImport`, `Broadcast`, `SettingsAndFlags`, `blog/*` editors → glass panels, sticky save bar at bottom (glass), unchanged form fields/logic.

**Blog admin** (`src/pages/admin/blog/*`) → same treatment; the new-post editor keeps its current toolbar and markdown logic, only surface restyle.

**Contests admin** (`src/pages/admin/contests/*` + `src/components/admin/contests/*`) → glass panels; tabs restyled to amber-underline; tables go through `DataTable`.

## What stays untouched

- All routes (`src/App.tsx`), guards (`AdminRoute`), `useUserRole`, `AuthContext`.
- Every hook in `src/hooks/admin/*` and every query/mutation.
- All dialogs, drawers, command palette behavior, pinning, badges, audit logging.
- Sidebar groups, items, icons, ordering, permissions.
- Edge functions, migrations, schema. No backend changes.
- shadcn primitives — no edits to `src/components/ui/*` except possibly adding variants if a glass `<Card>` variant helps (additive only).

## Technical details

- New files:
  - `src/components/admin/ui/GlassCard.tsx`
  - `src/components/admin/ui/StatTile.tsx`
  - `src/components/admin/ui/DataTable.tsx`
  - `src/components/admin/ui/SectionHeader.tsx`
  - `src/components/admin/ui/PageTransition.tsx`
  - `src/components/admin/AdminTopbar.tsx`
- Edited:
  - `src/components/admin/AdminShell.tsx` — add topbar slot, wrap content in `PageTransition`, restyle sidebar surface (no nav logic changes).
  - `src/components/admin/AdminBackdrop.tsx` — richer orbs/grid.
  - `src/components/admin/AdminPageHeader.tsx` — new hero look, optional `kpis` slot.
  - Every admin page file: swap `<Card>` → `<GlassCard>`, wrap tables in `<DataTable>`, replace any ad-hoc page header with `<AdminPageHeader>`. Pure JSX restyle; imports & handlers untouched.
- Tailwind: rely on existing CSS variables in `src/index.css` (no token changes since palette is locked). Add a few admin-scoped utility classes (e.g. `.admin-glass`, `.admin-rail-active`) in `src/index.css` under an `@layer components` block.
- Framer-motion already in deps — used for `PageTransition` and card hover.
- Accessibility: keep focus rings (amber), preserve all `aria-*`, keep keyboard nav for sidebar/palette.
- Responsive: shell collapses to icon rail < `lg`; topbar stacks; tables get horizontal scroll container on `sm`.
- No e2e test selectors removed — all `data-testid` attributes preserved.

## Out of scope

- No new admin features, no route changes, no permission changes.
- No changes to user-side UI.
- No copy/wording changes beyond what AdminPageHeader needs.

## Rollout

Single pass: shell + primitives first, then sweep all pages to adopt them. Verified by visiting Dashboard, Users, Problems, Blog, Contests, Reports, System Health, Parikshaa Overview in the preview after build.
