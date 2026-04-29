# Better Problem Editor (/admin/problems/new)

Make each tab in the Problem Editor feel complete and trustworthy: clear validation, completion indicators on every tab, in-place previews, and quick-fill helpers — without changing the data model.

## What you'll see

- **Tab badges** — every tab title shows a status dot:
  - green ✓ when the section is valid/complete
  - red ! when it has errors (blocks publish)
  - gray • when empty/optional
- **Pre-publish checklist** — clicking Publish opens a checklist (title, slug, description, ≥1 example, starter for ≥1 language, reference solution for that language, ≥1 sample test, ≥1 hidden test, SQL spec valid if enabled). Publish is blocked until required items pass; warnings are shown but allowed.
- **Quick action bar** under the header: Save · Save & Publish · Duplicate to draft · Open as learner · Copy slug · Reset draft.
- **Per-tab improvements** below.

### Basics
- Live URL preview (`/library/problems/<slug>`) with copy button.
- Topic suggestions chip row from existing distinct topics in DB (click to add).
- Difficulty shown with the same color badge users will see.
- Inline validation: title length 3–120, slug regex hint, duplicate-slug check (already present, surfaced inline with icon).

### Statement
- Split view kept; add toolbar above textarea: Bold / Italic / Code / Link / H2 / List / Insert example block.
- Word + character counter, reading-time estimate.
- "Insert from examples" button appends a Markdown table of examples into the description.

### Examples
- Drag-to-reorder handles.
- "Run reference" button per example: runs the active-language reference solution against the example input via existing `run-code` edge function and fills Output.
- Mark example as "primary" (used in OG cards / first preview).

### Constraints & Hints
- Hint reveal-order is the list order; show "Hint 1, Hint 2…" labels.
- Constraints: quick-insert chips for common patterns (`1 <= n <= 10^5`, `-10^9 <= a[i] <= 10^9`, etc.).

### Starter Code
- Language tabs show a check when filled.
- "Generate from reference" button: strips the function body of the reference solution to scaffold a starter (best-effort per language).
- "Copy from another language" dropdown.
- Format button uses Monaco's formatter (already exposed via the editor handle).

### Reference Solution
- Same language tabs + format button.
- "Validate against sample tests" button: runs reference on every sample test and reports pass/fail inline. Required-green for publish.

### Tests
- Two clearly separated tables (Sample / Hidden) with counts in headers.
- Per-row "Run reference → fill expected" to auto-populate `expected` from the reference solution output.
- Bulk paste: textarea modal accepting `input ||| expected` lines, one test per line.
- Import/Export tests as JSON.
- Warning chip when sample and hidden share identical inputs.

### SQL Spec
- "Run reference query" button against schema+seed via existing `run-sql` edge function; shows result rows in a small table.
- Syntax-highlighted SQL via Monaco instead of plain Textarea.
- Validation: schema/seed/reference all required when enabled; surface in tab badge.

### Limits
- Presets: Fast (1s/128MB), Default (2s/256MB), Heavy (5s/512MB).
- Show a friendly "≈ MB" next to memory KB.

## Technical details

- New file `src/lib/admin/problemValidation.ts` exporting `validateProblem(form): { sections: Record<TabId,{status,errors,warnings}>, canPublish, requiredFailures }`. Used by tab badges and the publish checklist.
- New `src/components/admin/editor/`:
  - `TabBadge.tsx` — small dot beside `TabsTrigger` children.
  - `PublishChecklistDialog.tsx` — replaces the current Publish AlertDialog; shows pass/fail list, blocks on required failures.
  - `MarkdownToolbar.tsx` — buttons that wrap selection in the textarea (uses `selectionStart/End`).
  - `BulkTestsDialog.tsx` — paste / import / export.
  - `RunReferenceButton.tsx` — calls `supabase.functions.invoke("run-code", …)` for code, `"run-sql"` for SQL spec.
- `useDistinctTopics` hook: `select topics from coding_problems` then flatten + uniq, cached 5 min.
- Examples reorder uses `@dnd-kit/sortable` (already used in folders).
- Language "copy from another" and "generate from reference": pure utilities in `src/lib/admin/codeScaffold.ts` with regex-based body stripping per language; falls back to copying the whole reference if it can't detect the body.
- Persist active tab in `localStorage` so reopening the editor returns to the last tab.
- Keep the existing sticky status banner, dirty-tracking, autosave, Cmd/Ctrl+S, and audit-log behavior unchanged.
- No DB migrations required. No new edge functions. Uses existing `run-code`, `run-sql`, `coding_problems`.

## Files to add
- `src/lib/admin/problemValidation.ts`
- `src/lib/admin/codeScaffold.ts`
- `src/components/admin/editor/TabBadge.tsx`
- `src/components/admin/editor/PublishChecklistDialog.tsx`
- `src/components/admin/editor/MarkdownToolbar.tsx`
- `src/components/admin/editor/BulkTestsDialog.tsx`
- `src/components/admin/editor/RunReferenceButton.tsx`
- `src/hooks/useDistinctTopics.ts`

## Files to edit
- `src/pages/admin/ProblemEditor.tsx` — wire validation into tab triggers, swap Publish dialog, add quick-action bar, per-tab enhancements, persist active tab.

## Out of scope
- No schema changes, no new admin pages, no changes to learner-facing problem rendering.
- No AI generation of full problems (kept lightweight; can be a follow-up).
