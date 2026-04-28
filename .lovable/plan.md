Coding Problems — Listing & Detail Page Upgrades

The pages already have a strong foundation (filters, recommendations, mastery chips, My Solution sync, hints, submissions, runs). This plan adds the missing **discovery, focus, and workspace** features that take it from "complete" to "best-in-class".

Nothing here requires schema changes — everything builds on existing tables (`code_submissions`, `code_runs`, `user_problem_solutions`, `coding_problems_meta`, bookmarks, attempt stats).

---

## A. Listing page (`/library/problems`) — Discovery & Focus

### 1. Daily Challenge strip (above filters)

A single highlighted problem per UTC day, deterministically picked from problems the user hasn't solved. Shows:

- Title + difficulty + topics
- Acceptance %, est. time
- "Solve today's challenge" CTA + a small "streak" counter (days in a row a daily was attempted) read from `code_submissions`.

### 2. Compact "Focus Mode" toggle

Hides the stats header, recommendation strip, and topic-mastery chips. Persists in `localStorage`. Useful when users just want the table.

### 3. Smart filter chips row (under the search bar)

One-click presets that update the existing filter URL params:

- **For You** (uses existing recommendation logic)
- **Due for revision** (problems solved >7d ago without a recent re-attempt)
- **Almost there** (attempted but not yet Accepted)
- **Quick wins** (Easy + low est. time, unsolved)
- **By company** dropdown using existing `companies` field

Each chip shows a live count next to the label.

### 4. Inline preview drawer (hover/click row → side peek)

Right-side `Sheet` that previews the problem (statement first 80 lines, examples, hints count, your acceptance) without leaving the list. CTA: "Open full editor".

### 5. Keyboard-first row navigation

- `j` / `k` move row selection
- `Enter` opens detail
- `b` toggles bookmark, `r` marks for revision, `/` focuses search
Add a small "?" floating help that opens the existing `ShortcutsCheatSheet`.

### 6. Density + columns control

A small toolbar button → popover lets users toggle:

- Row density: **Compact / Comfortable**
- Show/hide columns: Acceptance, Companies, Last attempt, Topics
Persists with the existing `useCodingProblemsTablePrefs` hook.

### 7. Progress ring in stats header

Replace one of the numeric tiles with a small SVG ring showing **% problems solved across all difficulties**, with hover tooltip per-difficulty. Visually anchors the page.

---

## B. Detail page (`/library/problems/:slug`) — Workspace Upgrades

### 8. Resizable 3-pane layout

Use `react-resizable-panels` (already common in shadcn stacks; if not installed, add it). Layout:

```text
┌──────────────┬────────────────────────────┐
│ Tabs (left)  │ Editor + Test/Output below │
│ (resizable)  │ (resizable vertically)     │
└──────────────┴────────────────────────────┘
```

Sizes persisted in `localStorage`. Adds a small "Reset layout" button.

### 9. New tab: "Companies & Frequency"

Surface tagged companies (existing `companies` field) as a heat-style list:

- Each company → badge + last-asked tier (if available, else just the company chip)
- "Practice this company's set" button → links to `/library/problems?company=Google`

### 10. New tab: "Discussion (Solo notes)"

A second markdown notepad scoped to the problem, separate from "My Solution" notes. Saves to existing `user_problem_solutions` table (we add a `discussion` JSONB key — see backend note). Use case: brainstorming / questions to revisit. *Optional — drop if scope feels heavy.*

### 11. Smart timer + Pomodoro mode

Top-right of the editor:

- Lightweight stopwatch that starts on first edit, pauses on idle (>60s no input).
- "Pomodoro" toggle → 25-min focus / 5-min break with subtle toast.
- On Accepted submission: shows total time-on-problem in the success toast and stores it locally per-slug.

### 12. Diff viewer between submissions

On the **Submissions** tab: select two rows → "Compare" opens a Monaco diff side-by-side. Helps users see what they changed between WA and AC.

### 13. Test case workbench

Replace the single stdin box with:

- Tabbed view of sample tests (already in data) — click to load into stdin
- "+ Custom" tab for a user's own input, persisted per-slug in `localStorage`
- Per-test "Run only this" button

### 14. Difficulty-aware estimated time + actual time

Show alongside est. time: **"Your avg: Xm"** computed from `code_runs` first-edit → first AC, when available. Builds on the existing `estimatedMinutes` system.

### 15. Solution explorer (after AC)

Once the user has any Accepted submission, the "Reference" tab also shows:

- Their own latest AC code (collapsible)
- Quick stats: runtime/memory percentile vs their other ACs
- "Save as My Solution" button (one click → `MySolutionPanel.onUseCurrentDraft`)

### 16. Floating action bar (mobile + desktop)

Sticky bottom bar with: **Run · Submit · Reset starter · Toggle hints**. Replaces hunting for buttons across panels on smaller screens.

### 17. Keyboard shortcuts in editor

- `Ctrl/Cmd + Enter` → Run
- `Ctrl/Cmd + Shift + Enter` → Submit
- `Ctrl/Cmd + S` → Save draft (already auto, but confirms)
- `Ctrl/Cmd + .` → Toggle hint reveal
Surface them in the existing `ShortcutsCheatSheet`.

### 18. Visual progress on hints

Progressive hints already persist reveal state — add a thin progress bar at the top of that tab: `2 / 4 hints revealed`, with a "Show all" / "Hide all" pair.

### 19. "Mark as revisit" + scheduled review

A button next to bookmark → schedules the problem for revisit using a simple SM-2-lite cadence stored in `localStorage` (3d / 7d / 14d). Surfaces in the **Due for revision** smart chip on the listing page.

### 20. Subtle visual polish

- Breadcrumb: `Library / Problems / Two Sum`
- Difficulty rendered as a color-coded gradient pill (existing tokens, no hex)
- Glass card for the editor wrapper consistent with the deep-black theme
- Animated count-up for acceptance % and attempt counters (framer-motion)
- Empty/loading states for every tab using `Skeleton`

---

## Technical Notes

- **No DB migration required** for items 1–9, 11–20. Item 10 (separate discussion notes) would either reuse `user_problem_solutions.notes` with a section delimiter or add a sibling JSONB column — confirm before building.
- **New deps**: `react-resizable-panels` (item 8). Diff viewer (item 12) reuses the already-loaded Monaco via its `DiffEditor` export — no new dep.
- **All localStorage keys** prefixed `byteskill:coding:*` to match existing convention.
- **All colors** via semantic Tailwind tokens (`primary`, `muted`, `emerald-500/10`, etc.) — no raw hex.
- **All icons** from lucide-react with the existing `MapIcon` aliasing rule respected.
- **Design**: glassmorphism cards, deep-black surfaces, animated orbs preserved.

---

## Suggested Build Order

If you want to ship in waves rather than one big PR, I'd group them as:

1. **Wave 1 (focus)** — items 2, 6, 16, 17, 20
2. **Wave 2 (discovery)** — items 1, 3, 4, 7
3. **Wave 3 (workspace)** — items 8, 11, 13, 18
4. **Wave 4 (mastery loop)** — items 9, 12, 14, 15, 19
5. **Wave 5 (optional)** — item 10

Reply with which wave (or specific item numbers) you want first, and I'll implement it.