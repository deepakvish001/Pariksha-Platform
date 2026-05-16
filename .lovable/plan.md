
## Goal

Rebuild `src/assessments/pages/Player.tsx` into an industry-level test-taking experience modeled on LeetCode and on your existing Contest play page. Coding and SQL questions get a real Monaco editor with language switcher, sample tests, Run, and Submit — wired to the same Fermion/SQLite edge functions the Contest already uses. Other question types get matching polish (cleaner cards, keyboard nav, question palette, flag-for-review, sticky bars).

## What we reuse (no new infra)

- `@monaco-editor/react` already installed
- `src/components/coding/MonacoEditor.tsx` — theme-aware, auto-relayout
- `src/hooks/useCodeRunner.ts` — wraps `run-code`, `submit-code`, `run-sql`, `submit-sql` edge functions (Judge0-compatible response shape)
- Language-id helpers in `src/lib/coding/executionLimits.ts`
- `src/components/library/coding/SqlResultDiff.tsx` for SQL result vs expected diff
- `PaperQuestion.sample_tests`, `starter_code`, `language` already returned by `get_attempt_paper` RPC

No new edge functions. No Judge0 keys. No DB schema changes — the existing `attempt_answers.answer` jsonb column absorbs the new fields (`code`, `language`, `language_id`, `query`, `last_run_result`).

## New layout

### Shell — every question type

```text
+----------------------------------------------------------------+
|  Title             Timer ⏱  Proctor ●  Fullscreen ⛶  Submit ▸ |  sticky top bar
+------+---------------------------------------------------------+
|  Q   |                                                          |
|  Pal |   Question viewport (varies by type — see below)         |
|  ette|                                                          |
+------+---------------------------------------------------------+
|  ◀ Prev    🚩 Flag for review    Saved ✓             Next ▶   |  sticky bottom bar
+----------------------------------------------------------------+
```

- Left rail: collapsible "question palette" with status dots (unanswered / answered / flagged / current). Keyboard shortcuts: `←/→` nav, `F` flag, `Ctrl+Enter` Run, `Ctrl+Shift+Enter` Submit.
- Top bar: monospace countdown turns amber under 5 min, red under 1 min. Proctor chip and fullscreen request preserved from current player.
- Bottom bar: autosave indicator dot + last-saved timestamp.

### Coding question — LeetCode-style split pane

```text
+--------------------------+------------------------------+
| Problem statement (md)   |  Lang ▾  Reset  Format  Run  |
| Examples / constraints   +------------------------------+
| Sample I/O cards         |                              |
|                          |     Monaco editor            |
|                          |                              |
|                          +------------------------------+
|                          |  Tabs: Testcase | Result     |
|                          |  - per-test pass/fail pills  |
|                          |  - stdout / stderr / compile |
+--------------------------+------------------------------+
                                                   [Submit]
```

- `react-resizable-panels` for the split (verify it's already installed; if not, add it — it's a dep of the contest page).
- Language switcher uses the same Judge0 IDs and labels the contest uses. Persists last-used per question in the answer payload.
- Starter code from `question.starter_code` seeded once; "Reset" restores it.
- "Run" → `useCodeRunner.run` against visible sample tests; renders verdict pills (Accepted / Wrong Answer / TLE / Compile Error) with expandable stdout/stderr.
- "Submit" → `useCodeRunner.submit` AND `useSaveAnswer` stores `{ code, language, language_id, last_run_result }`. Does not auto-advance.

### SQL question — Workbench-style

```text
+----------------------+------------------------------+
| Problem statement    |  Run query   Reset           |
| Expected output card +------------------------------+
| Schema viewer:       |     Monaco (language=sql)    |
|  - table chips with  |                              |
|    columns + types   +------------------------------+
|  - "Preview rows"    |  Tabs: Result | Expected     |
|    top 5 rows        |  - row-level diff (reused)   |
+----------------------+------------------------------+
```

- Schema/preview pulled from `question.meta.schema` when present (already a free-form jsonb on the question). Panel hidden when absent.
- "Run" → `run-sql`; result grid + expected grid using existing `SqlResultDiff`.
- Answer payload: `{ query, language: "sql", last_run_result }`.

### Other question types

Same shell. The existing renderers (MCQ, true-false, short answer, matching, subjective) get a styling pass — larger type, card-style choices with check-icon on select, keyboard 1–9 to pick options, live char counters for text — all using semantic tokens.

### Submission flow

- "Submit Assessment" in top bar opens a confirm dialog showing answered / unanswered / flagged counts before calling `useSubmitAttempt`.
- Auto-submit on timer end stays; shows a "Time's up" overlay then routes to results.

## Files to touch

| File | Change |
|---|---|
| `src/assessments/pages/Player.tsx` | Refactor into shell + per-type renderers; sticky top/bottom bars; palette; confirm-submit dialog |
| `src/assessments/components/PlayerTopBar.tsx` | NEW — timer, proctor chip, fullscreen, submit |
| `src/assessments/components/QuestionPalette.tsx` | NEW — left rail, status dots, keyboard nav |
| `src/assessments/components/CodingQuestion.tsx` | NEW — split pane, Monaco, lang switcher, Run/Submit, test panel |
| `src/assessments/components/SqlQuestion.tsx` | NEW — split pane, Monaco SQL, schema viewer, result diff |
| `src/assessments/components/ChoiceQuestion.tsx` | NEW — polished MCQ / true-false / short answer wrappers |
| `src/assessments/hooks/usePaper.ts` | Extend `PaperQuestion` answer typing for `language_id`, `last_run_result` (no DB change) |

No migrations. No edge function changes. No new secrets.

## Technical notes

- All colors via semantic tokens (`hsl(var(--background))`, `--primary`, `--border`, etc.) — no hard-coded hex. Matches deep-black glassmorphic theme.
- Monaco already honors `next-themes`.
- `useProctoring` stays wrapped around the shell — unchanged.
- Autosave path unchanged: `useSaveAnswer` upserts `attempt_answers`; new fields land in the existing `answer` jsonb column.
- Single keydown listener for shortcuts; disabled while Monaco is focused except for `Ctrl+Enter` / `Ctrl+Shift+Enter` — same UX as contest play.
- The preview-mode path (`?preview=1`) keeps working: Run is enabled, Submit is disabled with a tooltip.

## Out of scope

- Authoring UI (`src/b2b/pages/assessments/*`).
- Adding new languages beyond what `useCodeRunner` already exposes.
- Backend grading changes — code/SQL grading still happens server-side as today.
