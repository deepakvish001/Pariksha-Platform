# Better Coding Problems experience

Goal: add features that meaningfully change how you discover, plan, and solve problems — not just visual reshuffles. Each item earns its place by saving clicks, surfacing missing info, or unlocking a workflow you can't do today.

## A. Problems list (`/library/problems`)

1. **Smart "Recommended for you" strip** above the table
   - Picks 3–5 problems based on: weakest topic (lowest acceptance), oldest unsolved bookmark, "almost there" (attempted ≥2× but never AC), and a stretch problem (next difficulty). Each card explains *why* it's recommended.
   - Dismissable per session.

2. **Topic chips with mastery bars**
   - Below the search row, render topic chips colored by your mastery (solved / total). Click to filter; long-press / kebab for "Show only weak topics".

3. **Quick row preview on hover (desktop)**
   - Hovering a row shows a small popover: difficulty, top 3 topics, your best runtime/memory, last verdict, and a "Resume draft" link if you have unsubmitted code.

4. **Inline row actions on hover**
   - Bookmark, "Open in new tab", "Copy link", and "Mark for review" appear at the row end. Keyboard accessible.

5. **Saved filter presets**
   - Save the current filter+sort combo with a name ("Weekly grind", "Hard graphs"). Stored in localStorage. One-click apply, rename, delete.

6. **Keyboard navigation**
   - `j/k` move row focus, `Enter` opens, `b` bookmarks, `/` focuses search, `g g` jumps to top, `?` shows a shortcut cheat-sheet sheet.

7. **Density toggle** (compact / comfortable) persisted with table prefs.

8. **Better empty / error states**
   - When a single filter is the only blocker, suggest "Remove [topic: Trees]" as a one-click fix.

## B. Problem detail (`/library/problems/:slug`)

1. **Problem meta strip** under the title
   - Acceptance %, your best runtime/memory percentile (mocked from local stats), companies tag list (from data), estimated solve time, and a "similar problems" peek (3 chips by topic+difficulty).

2. **Editor productivity**
   - Format / beautify button (Prettier for JS/TS, simple indent for others).
   - Font size +/- and Vim-mode toggle (Monaco built-in), persisted per user.
   - Auto-save indicator ("Saved 2s ago") next to the language picker.
   - "Restore from history" — keep last 5 draft snapshots locally; pick one to restore.

3. **Run panel upgrades**
   - Multiple custom test cases (tabs you can add/remove), each with its own stdin and last output cached.
   - Diff view for failed sample cases (expected vs got, character-level highlight).
   - Copy-as-cURL for the failing case (handy for debugging locally).

4. **Submissions tab improvements**
   - Compare any two submissions side-by-side (diff of source).
   - "Best submission" pin with a trophy badge.
   - Filter chips: All / Accepted / Failed / Language.

5. **Notes panel** (new tab "Notes")
   - Personal markdown notes per problem, autosaved locally. Searchable from the list page.

6. **Hints UX**
   - Progressive disclosure with a "Reveal next hint" button instead of N independent toggles. Track how many hints used per problem.

7. **Keyboard shortcuts in editor**
   - `Cmd/Ctrl + Enter` runs, `Cmd/Ctrl + Shift + Enter` submits, `Cmd/Ctrl + K` opens command palette (language switch, reset, format, toggle layout).

8. **Layout presets**
   - Buttons for "Focus" (editor-only), "Split" (current), "Reading" (description-wide). Persisted.

## C. Cross-cutting polish

- Sticky-header offset is now 80px — verify and tune for the detail page toolbar height.
- All toasts use sonner consistently; failure toasts include actionable retry where relevant.
- Add a tiny "What's new on this page" popover that explains the new features once.

## Technical details

**New files**
- `src/components/library/coding/RecommendationStrip.tsx` — picks problems via heuristics over `useCodingAttemptStats`.
- `src/components/library/coding/TopicMasteryChips.tsx` — chip row driven by per-topic solved/total.
- `src/components/library/coding/RowQuickPreview.tsx` — hover popover (Radix HoverCard).
- `src/components/library/coding/SavedFiltersMenu.tsx` — preset save/apply/rename/delete UI.
- `src/components/library/coding/ShortcutsCheatSheet.tsx` — Sheet listing keymap.
- `src/components/library/coding/ProblemMetaStrip.tsx` — under-title metadata.
- `src/components/library/coding/EditorToolbarExtras.tsx` — format / font-size / vim toggle / autosave indicator.
- `src/components/library/coding/CustomTestcasesPanel.tsx` — multi-tab stdin manager.
- `src/components/library/coding/SubmissionDiffView.tsx` — side-by-side diff (use a small line-diff util, no new heavy dep).
- `src/components/library/coding/NotesPanel.tsx` — markdown notes (reuse existing markdown renderer).
- `src/components/library/coding/CommandPalette.tsx` — Cmd-K (cmdk is already in shadcn).
- `src/hooks/useSavedFilterPresets.ts`
- `src/hooks/useProblemNotes.ts`
- `src/hooks/useDraftHistory.ts`
- `src/hooks/useEditorPrefs.ts` (font size, vim, layout preset)
- `src/hooks/useKeyboardShortcuts.ts`

**Edited files**
- `src/pages/library/CodingProblems.tsx` — mount Recommendation strip, mastery chips, hover preview wrapper around rows, density toggle, saved presets menu, shortcuts cheat-sheet trigger.
- `src/pages/library/CodingProblemDetail.tsx` — add Notes tab, meta strip, layout presets, command palette, editor extras, custom testcases, diff view, hints disclosure, shortcut bindings.
- `src/components/coding/MonacoEditor.tsx` — accept `fontSize`, `vim`, `onSave` props.
- `src/hooks/useCodingProblemsTablePrefs.ts` — add `density` field.

**Storage keys (all `byteskill:` prefixed)**
- `coding-saved-filters:v1`, `coding-problem-notes:v1`, `coding-draft-history:<slug>:<lang>:v1`,
  `coding-editor-prefs:v1`, `coding-recs-dismissed:v1`, `coding-layout-preset:v1`.

**No backend changes.** Everything is client-side and works for guests too.

## Out of scope (call out so we agree)
- Real "companies asked" data — we'll use whatever is already in `codingProblemsData.ts` and show nothing if absent.
- Server-synced notes/presets — local-only this round.
- Ranking against other users — not added.
