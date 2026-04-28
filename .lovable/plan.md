# Coding Problems — Next-Level Upgrades

Both pages already have a strong base (filters, daily challenge, smart chips, focus mode, recommendations, topic mastery, resizable panels, hints, runs, submissions, notes, My Solution). This plan adds the gaps that most affect day‑to‑day practice: better at‑a‑glance signal on the list, a cleaner workspace, and a real feedback loop after submission. No DB migrations required.

---

## A. Listing page (`/library/problems`)

### A1. Streak & momentum strip (top-of-page)
A slim band above the stats header showing:
- Current solve streak (days in a row with ≥1 AC)
- Longest streak this month
- Today's solved count vs daily goal (configurable, stored in `localStorage`)
- A 14-day mini sparkline of daily solves
Encourages return visits and complements the existing Daily Challenge card.

### A2. Calendar heatmap popover
A small "Activity" button in the stats header opens a 90‑day GitHub‑style heatmap of submissions (reuses the existing `CalendarHeatmap` component). Click a day → filters the list to problems attempted that day.

### A3. Difficulty distribution mini‑chart
In the "By Difficulty" tile, add a stacked horizontal bar showing solved vs attempted vs unattempted per difficulty. Hover reveals exact counts. Replaces today's pure number list with a glanceable visual.

### A4. Saved views (named filter sets)
Extend the existing `useSavedFilterPresets` UI to support:
- Pinning up to 3 presets as one‑click chips next to Smart Filters
- Inline rename / reorder
- Visual "active preset" indicator when current URL params match a saved view

### A5. Row inline status quick‑actions
Hovering a row reveals a tiny action cluster at the right edge:
- Toggle bookmark
- Mark for revisit (SM‑2‑lite)
- Copy problem link
- "Mark solved without code" (for off‑platform solves)
Keeps power features one click away without re‑introducing the removed preview drawer.

### A6. Companies & tags multi‑facet filter
Add a faceted filter popover to the filter bar with:
- Companies (multi‑select, search inside)
- Topic tags (multi‑select, search inside)
- "Has hints", "Has editorial", "Has video" toggles
URL‑synced like other filters. Counts shown next to each option.

### A7. Compare‑with‑peers row badge (opt‑in)
For each problem, a tiny badge showing global acceptance percentile vs the user's attempts (e.g. "you: 2 tries · avg: 3.1"). Only renders when the user has at least one attempt. Pure read from existing `code_submissions` aggregates.

### A8. Empty / loading polish
- Skeleton rows that match column visibility prefs (today they're generic)
- A friendly empty state when filters return nothing, with a "Clear filters" CTA and 3 suggested problems

---

## B. Detail page (`/library/problems/:slug`)

### B1. Session timer + Pomodoro (top‑right of editor)
- Auto‑starts on first edit, pauses after 60s idle
- Optional 25/5 Pomodoro toggle with a subtle toast
- Stores time‑on‑problem per slug in `localStorage`
- On AC, success toast shows "Solved in Xm Ys"

### B2. Test case workbench
Replace the single stdin textarea with a tabbed workbench:
- One tab per sample test (auto‑loaded from problem data)
- "+ Custom" tabs persisted per slug in `localStorage`
- Per‑tab "Run only this" button
- Results panel highlights pass/fail per tab

### B3. Submissions diff viewer
On the Submissions tab, allow selecting two rows → "Compare". Opens a Monaco `DiffEditor` (already loaded) side‑by‑side. Helps users see what changed between WA and AC.

### B4. Solution explorer after AC
Once any AC exists for the problem, the Reference tab adds:
- A collapsible "My latest AC" section
- Quick stats: runtime/memory percentile vs the user's other ACs
- One‑click "Save as My Solution" → calls existing `MySolutionPanel.onUseCurrentDraft`

### B5. Companies & frequency tab
A new tab listing tagged companies as chips with "Practice this company's set" → links to `/library/problems?company=...`. Uses existing `companies` field; no new data.

### B6. Hints progress bar + "Reveal all / Hide all"
Above the hints list show `2 / 4 hints revealed` with a thin progress bar and a paired toggle, building on existing `ProgressiveHints` reveal state.

### B7. Editor enhancements
- `Ctrl/Cmd+Enter` → Run, `Ctrl/Cmd+Shift+Enter` → Submit, `Ctrl/Cmd+.` → toggle hint reveal (added to existing `ShortcutsCheatSheet`)
- Editor toolbar: format (Prettier where possible), reset to starter, copy code, toggle word‑wrap
- Persist language + font size across problems (already partial via `useEditorPrefs`; ensure font size + wrap are sticky)

### B8. Mark for revisit + scheduled review
Button next to bookmark → schedules problem with simple SM‑2‑lite cadence (3d / 7d / 14d) in `localStorage`. Drives the "Due for revision" smart chip already on the list.

### B9. Visual polish
- Breadcrumb: `Library / Problems / Two Sum`
- Animated count‑up for acceptance % and attempt counters (framer‑motion)
- Skeletons for every tab while data loads
- Glass card consistent with deep‑black aesthetic on editor and side panels

---

## Suggested build order (waves)

1. **Wave 1 — workspace polish:** B1, B2, B6, B7 (immediate daily‑use wins)
2. **Wave 2 — feedback loop:** B3, B4, B8
3. **Wave 3 — discovery:** A1, A2, A3, A8
4. **Wave 4 — power filtering:** A4, A5, A6, B5, A7

Reply with the wave (or specific item numbers) you want first and I'll implement it. Default if you just say "go": **Wave 1**.

---

## Technical notes

- No DB migrations needed. All new state is either localStorage (`byteskill:coding:*`) or derived from existing tables (`code_submissions`, `code_runs`, `user_problem_solutions`, bookmarks).
- Diff viewer reuses already‑loaded Monaco via `DiffEditor` export — no new dep.
- All colors via semantic Tailwind tokens; lucide `Map` aliased as `MapIcon` per project rule.
- Reuses existing components: `CalendarHeatmap`, `ShortcutsCheatSheet`, `ProgressiveHints`, `MySolutionPanel`, `SavedFiltersMenu`, `SmartFilterChips`, `TopicProgressRing`.
