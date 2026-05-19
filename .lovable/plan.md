# Rankings Tab — Ranked Student Cards

The Rankings tab already exists as a dense table. This plan refactors it into a **card-based leaderboard** with stronger filters (org-wide / branch / drive) and richer per-student score context, while reusing the existing `placement_rankings` RPC and `ShareDialog`.

## Scope

Frontend-only refactor of `src/b2b/pages/placements/RankingsTab.tsx`. No DB or RPC changes. The existing `placement_rankings(_org_id, _filters, _limit, _offset)` already returns every field we need (score, rank_in_org, rank_in_branch, assessment %, integrity, apps, shortlists, offers, status flags, scores jsonb).

## Filter Bar

A single sticky toolbar at the top of the tab:

- **Search** — name / email / roll (debounced 250ms)
- **Batch year** — `Select`, populated from current dataset
- **Branch** — `Select`, also drives the `rank_in_branch` context shown on cards
- **Section** — `Select` (new; pass `section` through `_filters`)
- **Drive** — `Select` of org drives (fetched from `placement_drives` where `org_id = orgId`, ordered by `opens_at desc`). Passed as `drive_id` in `_filters` so the RPC scopes apps/shortlists/offers to that drive when supported; if the RPC ignores it, we filter client-side on `applications_count > 0` for the drive via a secondary query (see Technical Notes).
- **Status** — All / Placed / Multi-offer / Shortlisted / Unplaced
- **Min score** — chips: Any · ≥40 · ≥60 · ≥80
- **Sort** — Score (default) · Assessment avg · Offers · Recently active
- **View toggle** — Cards (default) · Table (keeps existing dense table as fallback)
- Right side: `Recompute`, `Refresh`, `Export CSV`, `Share selected (n)` (unchanged).

## Ranked Student Cards

Replace the `<table>` with a responsive grid:

```text
grid-cols-1  md:grid-cols-2  xl:grid-cols-3
```

Each card (`GlassCard`) layout:

```text
┌──────────────────────────────────────────────┐
│  #3 🏆       [Multi-offer]            ⋯ share │
│                                              │
│  Avatar  Name (link)                         │
│          roll · branch · batch · section     │
│                                              │
│  ┌────────────┐   Rank context               │
│  │   87       │   #3 of 412 in org           │
│  │   /100     │   #1 of 68 in CSE            │
│  │  ▰▰▰▰▰▰▱▱  │   Top 1% overall             │
│  └────────────┘                              │
│                                              │
│  Assess 92 · Integrity 95 · Apps 7 · Off 2   │
│  [bar: assess][bar: integrity][bar: skills]  │
│                                              │
│  ☐ Select    [View profile]   [Share to HR]  │
└──────────────────────────────────────────────┘
```

Details:

- **Rank chip** (top-left) shows `#rank_in_org`, with a `Trophy` and gold/silver/bronze accent for ranks 1–3.
- **Score donut** — circular SVG using `score`, color-coded via existing `scoreColor` (emerald / amber / orange / muted). Center shows the integer; sub-label `/100`.
- **Rank context block**:
  - `#rank_in_org of <total>` (total from dataset length when no pagination, otherwise from a count column)
  - `#rank_in_branch of <branch total>` when branch is set on the student
  - Percentile pill — `Top {round(rank_in_org/total*100)}%`
- **Mini bars** — three thin `<div>` bars for assessment %, integrity %, and a derived "engagement" % (`min(100, (apps + 2*shortlisted + 4*offers) * 8)`). Pure presentational, no new data.
- **Status badge** — reuse existing `StatusBadge`.
- **Footer actions** — `Checkbox` (multi-select for shortlist), `View profile` link to `/b2b/placements/students/:id`, `Share to HR` opens `ShareDialog` with `kind: "profile"`.
- **Skeleton** — 6 skeleton cards while loading.
- **Empty state** — same copy as today, centered in a single card spanning all columns.

## Header strip (above the grid)

Three small `GlassCard` stats derived from the filtered dataset (no extra query):

- **Avg score** of filtered students
- **Top scorer** (name + score) with a `Trophy`
- **Filtered count** with comparison to org total (e.g. `128 of 412`)

This gives the "rank context across the org" that the user asked for.

## Technical Notes

- Keep `placement_rankings` RPC call signature; just extend `filters` with `section` and `drive_id` keys. If the RPC currently ignores unknown keys it's a no-op and the client still narrows results via `useMemo` filtering for `drive_id` (skip if dataset has no drive context — we will simply omit the drive filter in v1 if the RPC does not honor it, and surface a small `Coming soon` hint on the Drive select tooltip). We will check the RPC body during implementation and either pass through or fall back to client-side narrowing.
- Drives list: `supabase.from("placement_drives").select("id,title,status").eq("org_id", orgId).order("opens_at", { ascending: false })` — small additional `useQuery`.
- View toggle persists in `localStorage` under `placements.rankings.view`.
- Card grid is virtualization-free for v1 (limit 500 already enforced by the RPC).
- All colors via existing semantic tokens (`hsl(var(--primary))`, `--muted`, `--border`); status accent colors reuse the existing `bg-emerald-500/15` style already present in the file.
- No new files. Single refactor of `RankingsTab.tsx`. `ShareDialog`, `StatusBadge`, `scoreColor`, `GlassCard`, CSV export, and Recompute mutation are preserved.

## Out of Scope

- Backend changes (score formula, RPC additions, new tables).
- The internal `StudentPlacementProfile` page and public share page.
- Pagination — RPC limit of 500 is enough for v1.