## Goal
Make `/b2b/question-bank` feel structured and scannable. Same features, cleaner layout. Frontend-only changes in `src/b2b/pages/QuestionBank.tsx`.

## Current pain points
- 4 actions crammed in the header (Export, AI, Import, New).
- 10 type-filter pills wrap into 2 lines on 1000px width.
- Status tabs + search sit on a second row, fighting the type pills for attention.
- Bulk-action bar appears as a third stacked strip.
- Every question is a tall card — low density, lots of scrolling.
- No quick sense of totals (drafts vs published vs archived, by type).

## Proposed layout

```text
┌─ Question Bank ─────────────────── [Export ▾] [Import] [AI ✨] [+ New] ┐
│                                                                       │
│ ┌ KPIs ───────────────────────────────────────────────────────────┐   │
│ │  Total 124   Published 98   Drafts 21   Archived 5             │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│ ┌ Toolbar ───────────────────────────────────────────────────────┐   │
│ │ [All|Drafts|Published|Archived]   [Type ▾]   [🔍 Search…]      │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│ ── Bulk bar (only when selection > 0) ───────────────────────────    │
│                                                                       │
│ ┌ List ──────────────────────────────────────────────────────────┐   │
│ │ ☐  type  title …………………………………  diff  pts  lang  …  ⋯ actions │   │
│ │ ☐  type  title …………………………………  diff  pts  lang  …  ⋯ actions │   │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Sections
1. **Header actions** — keep 4 buttons, group destructive/secondary into an "⋯ More" dropdown only if needed. Otherwise unchanged.
2. **KPI strip** — 4 small tiles using existing `KpiTile` / `StatTile` pattern: Total, Published, Drafts, Archived. Derived from `questions` in memory.
3. **Toolbar (single row)**:
   - Status segmented control (All / Drafts / Published / Archived) with counts — primary filter.
   - Type filter collapsed into a `Select` dropdown labeled "Type: All" (replaces the 10-pill row that wraps). Counts shown inside the menu items.
   - Search input right-aligned, grows to fill.
   - On `sm:` and below, stacks: status row, then Type + Search row.
4. **Bulk bar** — unchanged behavior, but uses a subtler inline style and only appears when `selected.size > 0` (already true).
5. **List → compact rows**:
   - Trade tall cards for a dense row: checkbox · type badge · title (truncate) · status/archived badges inline · difficulty · pts · language · tag chips (max 3) · action buttons.
   - Hover background instead of card padding; dividers between rows.
   - Group container is a single `SectionCard` with internal divider list.
6. **Empty / no-match states** — keep, restyle to match new card.

## Technical notes
- Single-file edit: `src/b2b/pages/QuestionBank.tsx`.
- No schema, no hook, no business-logic changes. `filtered`, `counts`, `statusCounts`, `selected`, duplicate/archive/export/bulk-delete logic all preserved.
- Replace the type-pill `<button>` group (lines ~446-464) with a `Select` populated from `FILTERS` showing `label (count)`.
- Add a `KpiStrip` subcomponent at top of the rendered tree (inside `OrgShell`, above toolbar) reading from `counts` + `statusCounts`.
- Convert each row card (`b2b-card` block ~555-630) to a `div` row inside a wrapping `b2b-card` list; reduce vertical padding from `p-4` to `px-3 py-2.5`; keep all current buttons and badges.
- Use existing semantic tokens; no new colors.
- No new dependencies.

## Out of scope
- No new features (sorting, pagination, column toggles, saved views).
- No backend or RLS changes.
- No changes to wizard/editor dialogs, Import, AI Generate, or Export logic.
