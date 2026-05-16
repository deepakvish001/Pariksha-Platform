# Test Player — Industry-Grade UI/UX Polish

Goal: take the already-refactored test player (TopBar + Palette + Coding/SQL split panes + choice questions) and bring every surface to a LeetCode/HackerRank-grade level of polish. Pure presentation work — no backend, schema, grading, or business-logic changes.

## Scope

In: `Player.tsx`, `PlayerTopBar.tsx`, `QuestionPalette.tsx`, `CodingQuestion.tsx`, `SqlQuestion.tsx`, the inline `QuestionInput` / `MatchingInput` blocks inside `Player.tsx`, plus a new `PlayerBottomBar.tsx` extracted from `Player.tsx`.

Out: `usePaper`, `useCodeRunner`, `useProctoring`, RPCs, edge functions, MonacoEditor internals, authoring UI, language list, grading.

All colors via semantic Tailwind tokens (`bg-card`, `text-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`, `primary`, `destructive`, `accent`). Status colors (emerald/amber) kept but only for verdict/answered/flag semantics, paired with icons so dark mode reads cleanly.

## 1. Player shell

- Replace `bg-[hsl(var(--background))]` brackets with semantic classes (`bg-background`).
- Add a subtle ambient gradient backdrop behind `main` (`bg-gradient-to-b from-background via-background to-muted/30`) so the editor card floats.
- Tighten responsive grid: palette becomes 240px rail on `lg+`, collapses to a slim horizontal strip above the question on `md`, and to a sheet trigger on mobile (uses existing `Sheet` component).
- Extract sticky footer into `PlayerBottomBar.tsx` for clarity.
- Smooth question transitions with a small `motion.div` fade/slide on `idx` change (framer-motion already in project).

## 2. PlayerTopBar

- Replace the gradient "P" tile with the actual brand B lettermark used elsewhere in the platform.
- Title row: title + subtle muted "assessment" eyebrow; right-side cluster gets visible separators between proctor pill, fullscreen, timer, prefill, submit.
- Timer: monospace, larger (`text-base`), with a leading dot that pulses red < 60s and amber < 5min; tooltip shows the exact deadline.
- Progress bar under header: 2 stacked thin bars — answered (primary) + flagged (amber) overlay — for at-a-glance status.
- Submit becomes a gradient primary button with `Send` icon; disabled state shows `Submitting...` with spinner.
- Add a "Help / shortcuts" `?` icon that opens a popover listing `←/→`, `F`, `Ctrl+Enter`, `Ctrl+Shift+Enter`, `Ctrl+S`.

## 3. QuestionPalette

- Bigger touch targets (h-10), 6-column grid on lg, 5 on md.
- Status now uses 4 states with distinct chips: not-visited (outline), visited-blank (dashed), answered (emerald solid), answered+flagged (emerald + amber corner flag), current (primary ring).
- Mini-stats row at top: 3 pill counters (Answered / Unanswered / Flagged) styled like the Stat block already in `Player.tsx` — reuse and export it.
- Add a slim section header per section (when assessment has multiple sections) — read from `paper.sections` and group the grid.

## 4. Coding question (LeetCode-style)

Layout already uses `react-resizable-panels`. Polish targets:

- **Header bar**: pill with difficulty (read from `question.meta?.difficulty` if present, else hide), points, language. Subtle `border-b` accent line in primary when problem accepted.
- **Problem panel**:
  - Render `body_md` through the existing markdown renderer (project uses `react-markdown` elsewhere — import the shared `MarkdownRenderer` component instead of `whitespace-pre-wrap`).
  - Examples: card with monospace input/output stacked, copy-to-clipboard icon button per block, "Explanation" collapsible when provided.
  - Add a "Constraints" section if `question.meta?.constraints` exists (string list).
  - Tabbed left panel: `Description` / `Hints` / `Submissions` (Submissions tab lists prior `last_submit_result` verdicts from the answer; Hints from `meta.hints` string[]).
- **Editor toolbar**: language `Select` styled as a chip; `Reset`, `Format`, `Settings` (popover: font size 12-18, tab size 2/4, theme toggle that flips Monaco between `vs-dark`/`light` independent of app theme), `Run`, `Submit`. Run is outline, Submit is gradient primary. Both keyboard hinted (`⌘⏎`, `⌘⇧⏎`).
- **Bottom result panel**:
  - Tabs: `Testcase` (sample inputs as horizontal pill tabs you can click to pick which one Run uses) | `Result` (verdict + per-case rows with green/red dot, runtime, memory, expand to see expected vs actual diff).
  - Verdict header gets a colored banner: emerald gradient on Accepted, amber on WA, red on RE/CE/TLE. Shows tests passed `x/y` with a mini progress bar.
  - Failing-case block uses side-by-side `Expected` / `Got` columns with a unified diff highlight on differing lines.
- **Empty states**: friendly illustration-less prompt blocks with kbd hints.
- Add `⌘⏎` and `⌘⇧⏎` listeners scoped to the editor pane.

## 5. SQL question (Workbench-style)

- **Schema viewer**: each table becomes a collapsible card with header showing name + row count (from sample length). Columns rendered as a 2-col table (name · type) with PK badge when type contains `primary key`. Click a column name to insert it into the editor at cursor (via `editorRef.current.insertAtCursor`).
- **Seed preview**: small tabbed grid of first 5 rows per table, monospace.
- **Editor toolbar**: same look as coding (Reset / Format / Settings / Run). Add a `Saved` indicator chip near Run.
- **Result panel**: keep the existing `ResultGrid` but add row count chip, execution time, and a `Download CSV` button. Diff tab: re-skin `SqlResultDiff` with green/red line highlights matching the coding diff style.
- **Reference query**: if `meta.reference_query` exists and `isPreview`, show a "Peek reference" popover (preview-only).

## 6. Choice / short-answer / matching questions

- Wrap each question type in a single polished `Card` with:
  - Header: gradient-tinted strip (`bg-gradient-to-r from-muted/40 to-transparent`), type badge, "Q n of N · X pts", flag toggle inline.
  - Body: larger type (`text-base` for stem, `text-sm` for options), generous spacing.
- **MCQ / true-false**: option cards with circular index badge (A/B/C/D), hover lift, checked = primary ring + soft fill + check icon. Multi-select shows checkboxes; single-select shows radios.
- **Short answer**: large `Input` with live char counter (right-aligned) and an optional `maxLength` from `question.meta?.max_length`.
- **Subjective**: `Textarea` with min-height 220, word + char counter, autosize.
- **Matching**: 2-column grid; left items as static chips, right side as `Select` per item; visual line/arrow indicator when matched. Reset-all button.
- Keyboard: `1..9` selects option n for MCQ/true-false (already partially scoped — finish wiring).

## 7. Bottom bar

- Extract to `PlayerBottomBar.tsx`.
- Left: Prev with question number ("← Q4").
- Center: Flag toggle (amber when on), Save status (`Saved 12:04` / `Saving…` / `Saved just now` with `Loader2` when in-flight).
- Right: Next with question number, or `Review & Submit` button on last question (opens existing AlertDialog).

## 8. Submit confirmation dialog

- Keep current AlertDialog. Add:
  - A 3-up Stat grid (already present) but with icons.
  - A scrollable list of unanswered + flagged question numbers as small clickable chips that jump to the question (closes dialog).
  - Primary action becomes "Submit assessment" gradient button.

## 9. Submitted/finished screen

- Replace single Card with a centered hero: large check, headline, score chip (large), CTA cluster. Confetti is optional and skipped (no new deps).

## Technical notes

- Reuse existing primitives only: `Card`, `Button`, `Badge`, `Tabs`, `Tooltip`, `Popover`, `Sheet`, `AlertDialog`, `Progress`, `Input`, `Textarea`, `Select`, `RadioGroup`, `Checkbox`, `ScrollArea`, `Separator`, `react-resizable-panels`, `framer-motion`, `lucide-react`. No new packages.
- Read shared `MarkdownRenderer` from `src/components/...` (search for existing usage, e.g. interview answers) — fallback to `whitespace-pre-wrap` if not found.
- Add `editorRef.current.insertAtCursor(text)` to `MonacoEditor` handle if not present (small, isolated additive change to that component's imperative handle). If owners prefer no MonacoEditor change, fall back to appending text — flag and ask before touching.
- All status colors continue using emerald/amber/destructive utility classes (allowed for semantic verdicts), but borders/backgrounds use `border-border` / `bg-card` / `bg-muted` tokens.
- File watch: avoid changing `Player.tsx` answer state shape; only its presentation.

## Files

Created
- `src/assessments/components/PlayerBottomBar.tsx`

Edited
- `src/assessments/pages/Player.tsx`
- `src/assessments/components/PlayerTopBar.tsx`
- `src/assessments/components/QuestionPalette.tsx`
- `src/assessments/components/CodingQuestion.tsx`
- `src/assessments/components/SqlQuestion.tsx`

## Out of scope

- New languages or runtimes
- Backend grading rubric, RLS, or RPC changes
- New assessment authoring UI
- Persisting editor settings (font size, theme) across sessions
- Realtime collaboration / cursor presence
