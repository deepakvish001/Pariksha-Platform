
# Test Player — Calm Pro Polish + Rich Working Features

The player was just overhauled, so this pass focuses on **non-disruptive UX upgrades** and making every interactive feature **work end to end** (no decorative buttons). Pure presentation + small client-side state — no schema, grading, or backend changes.

## Design principles (do-no-harm to candidates)

- Reduce visual noise during the test: muted ambient surfaces, no animated orbs, no marketing gradients, no celebratory motion mid-attempt.
- Color is reserved for *state* (answered / flagged / timer urgency / verdict), never for decoration.
- Motion ≤ 150ms, no layout shift on save/auto-save, no toasts for routine autosave (icon-only indicator already in bottom bar).
- Fullscreen / proctoring banners are passive (no flashing); warnings only on actual violation.
- All shortcuts are opt-in-discoverable via a `?` help sheet, none hijack typing inside editors/inputs.

## Player shell (`Player.tsx`)

- Replace the gradient page background with a flat `bg-background` + 1px hairline divider under the topbar (calmer).
- Constrain content widths: choice questions `max-w-3xl` centered for readability; coding/SQL stay wide.
- Add a **focus mode** toggle in the top bar (icon only): hides the palette rail and bottom bar chrome to just Prev/Next + timer. State stored in `localStorage` per-attempt. ESC exits.
- Add a **zen timer toggle**: collapses the timer to a thin progress bar (still visible, less anxiety). Persists per-attempt.
- Add a **`?` help sheet** listing shortcuts (←/→, F, 1–9, ⌘/Ctrl+S save now, ⌘/Ctrl+Enter run code, G then number → jump).
- Implement **`G` + number** jump (vim-style) and **⌘/Ctrl+S** = flush pending debounced save + brief "Saved" pulse.
- Replace routine save toasts with the existing bottom-bar indicator (already shows `lastSavedAt`); only toast on **save failure**.

## Top bar (`PlayerTopBar.tsx`)

- Lower contrast: `bg-card/80 backdrop-blur` instead of gradient.
- Timer states: normal (muted) → amber at ≤5 min → red pulse at ≤60s (pulse uses `opacity` only, not scale, to avoid distraction).
- Add a compact **connection indicator** (online/offline via `navigator.onLine` + `online`/`offline` listeners). When offline, queue writes in memory and show "Offline — your answers are safe" chip; flush queue on reconnect.
- Add **Focus**, **Zen timer**, **Help** icon buttons (ghost, 32px). All wired.
- Keep proctoring & preview chips, dedupe spacing.

## Palette (`QuestionPalette.tsx`)

- Tighter 8-col grid, 32px chips, 4-state legend already exists — verify color tokens are semantic (no raw hex).
- Add **section headers** from `paper.sections` (group chips under section names).
- Add a small filter row: `All · Unanswered · Flagged` (client-side filter of chips). Clicking a chip still jumps.
- Hidden when Focus mode is on.

## Bottom bar (`PlayerBottomBar.tsx`)

- Show **"Saved Xs ago"** (live, ticks every 10s) using `lastSavedAt`; "Saving…" while pending; "Unsaved" if `>2s` since last edit with no success.
- Add **Mark for review & next** (single button = flag + next) — common LeetCode pattern.
- Hide entirely in Focus mode; keep a floating minimal Prev/Next pill bottom-right instead.

## Coding question (`CodingQuestion.tsx`) — wire features end-to-end

- Verify **Run** uses `samples` only; **Submit (run all)** uses full cases — both must round-trip via existing edge function/hook. If a hook is missing, use the existing path already wired in the file.
- **Language switcher** persists per-question in `localStorage`; starter code restored when switching back.
- **Editor settings popover** (font size 12/14/16, tab size 2/4, word-wrap, vim/default keymap off by default) — persists globally in `localStorage` (`assess.editor.*`). All values actually applied to Monaco.
- **Reset to starter** with confirm (uses question's starter for current language).
- **Copy code**, **Download `.ext`** buttons — working.
- **Console/Tests/Output** tabs: tests tab shows each sample with input / expected / actual / pass dot.
- Keep `⌘/Ctrl+Enter` (Run) and `⌘/Ctrl+Shift+Enter` (Submit). Show binding hints on the buttons.
- Persist editor scroll/cursor position per-question in memory so navigating away & back resumes exactly.

## SQL question (`SqlQuestion.tsx`)

- Schema cards: confirm click-to-insert table/column names actually dispatches into the Monaco model (not just selection).
- **Run query** → table view of rows + row count + execution time (already supported by hook); error state shown inline, never as toast.
- **Format SQL** button (lightweight regex-based formatter, or `sql-formatter` if already present — check `package.json` before adding).
- **Export CSV** wired to current result set.
- **Reset query** to starter, confirm.
- Diff view stays for expected-vs-actual when available.

## Choice / Short / Subjective / Matching

- Wrap each in a uniform `Card` with: question number chip, points, type label, optional difficulty.
- MCQ/TF: large option rows, circular index badge (`A/B/C…`), `aria-pressed` correctly, keyboard `1–9` already wired — verify focus ring visible.
- Subjective / short answer: live **character & word counter**; honor `max_chars` if present (soft warn at 90%, hard block at 100%).
- Matching: two-column with select dropdowns; show "X of N matched" progress.

## Submit & success

- Confirm dialog already has 3-up stats — add: *time remaining* line and "You can still go back" hint.
- Success screen: keep it quiet (no confetti, no trophy bounce). Single check, score chip, two buttons.

## Accessibility / safety

- Focus rings on every interactive element via shadcn defaults — audit `outline-none` overrides and remove where they suppress focus.
- All icon-only buttons get `aria-label` + tooltip.
- `prefers-reduced-motion`: short-circuit framer-motion transitions.
- Autosave on `visibilitychange` (tab hidden) and `beforeunload` — flushes pending debounce.

## Technical notes

- New state on `Player.tsx`: `focusMode`, `zenTimer`, `online`, `editorPrefs` (read from localStorage on mount, written on change).
- Add `useOnline()` and `useEditorPrefs()` tiny hooks in `src/assessments/hooks/`.
- No new deps unless `sql-formatter` is missing and needed — will fall back to a 30-line in-file formatter if so.
- No DB migration, no edge-function changes, no changes to `usePaper` / `useSaveAnswer` / `useSubmitAttempt` signatures.

## Files

- Edit: `src/assessments/pages/Player.tsx`, `PlayerTopBar.tsx`, `PlayerBottomBar.tsx`, `QuestionPalette.tsx`, `CodingQuestion.tsx`, `SqlQuestion.tsx`.
- Add: `src/assessments/hooks/useOnline.ts`, `src/assessments/hooks/useEditorPrefs.ts`, `src/assessments/components/PlayerHelpSheet.tsx`.

## Out of scope

- Grading logic, new question types, authoring UI, realtime collaboration, server-side proctoring rules, new languages, AI hints.
