## Goal
Replace the popup-dialog entry flow with an inline, spreadsheet-style table where students can add, edit, and review every solved problem like a Google Sheet — no modals.

## What changes

### 1. New component: `PracticeSheet.tsx` (table view)
A single dense, editable table used in both **Today** and **History** tabs.

Columns (left→right):
```text
# | Date | Title + Link | Platform | Topic | Pattern | Algo | Difficulty | Attempts | Time (min) | Status | Confidence | T.C | S.C | Companies | Tags | Mistakes | Learnings | Next Revision | ★ | ⋯
```

Behavior:
- Each cell is inline-editable (Input / Select / number / textarea-popover for long text).
- Edits autosave on blur via `useUpdateEntry` (debounced 400 ms) with subtle "Saved" indicator.
- Sticky header row, sticky first 2 columns (#, Date), horizontal scroll inside the card, vertical virtualization not needed at MVP scale.
- "★" toggles favorite; "⋯" opens a dropdown (Revise now, Snooze 1d/3d/1w, Mark mastered, Delete).
- Multi-link support: title cell shows primary link; small "+N" chip when extra links exist (click → small popover list, still no full modal).

### 2. Inline "Add row"
- A persistent **last row** rendered as empty inputs (Title required). Typing Title + Enter/Tab creates the entry via `useCreateEntry` against today's day, then focus jumps to next row.
- Top-of-table button "**+ Add row**" does the same (scrolls to/focuses the draft row).
- Removes the "Log a problem" Dialog usage entirely from `JournalPage`.

### 3. EntryCard / EntryForm Dialog usage
- `EntryCard` (popup-style card) is **removed** from Today and History tabs.
- `EntryForm` is no longer mounted in a Dialog. Kept in the codebase only for the "Edit details" route inside Revisions (optional expanded edit) — but its Dialog wrapper is dropped; if a deep edit is needed, we use an inline expandable row (click row → expands underneath with full fields like notes_md, code_snippet, learnings). No modal.

### 4. Tabs after change
- **Today** → `PracticeSheet` filtered to today (with inline add row pre-bound to today).
- **History** → Heatmap on top, `FiltersBar`, then `PracticeSheet` over filtered entries (add row hidden in history; "+ Add row" still routes to today).
- **Revisions** → keep `RevisionsBoard` but swap its internal cards for the same compact table rows (read-only + action buttons; no dialogs — Revise uses inline expand).
- **Analytics** → unchanged.

### 5. Small UX
- Column visibility menu (toggle which columns are shown — persists in localStorage).
- Row density toggle (Compact / Comfortable).
- Keyboard: Enter = save & next row, Esc = cancel cell edit, Tab/Shift-Tab between cells.

## Files

Create
- `src/features/dsa-journal/components/PracticeSheet.tsx`
- `src/features/dsa-journal/components/sheet/EditableCell.tsx`
- `src/features/dsa-journal/components/sheet/RowActions.tsx`
- `src/features/dsa-journal/components/sheet/ColumnsMenu.tsx`
- `src/features/dsa-journal/components/sheet/InlineExpandRow.tsx` (deep edit without modal)

Edit
- `src/pages/learn/dsa-studio/JournalPage.tsx` — drop Dialog + EntryCard usage, render `PracticeSheet`.
- `src/features/dsa-journal/components/RevisionsBoard.tsx` — switch rows to compact table style, remove ReviseDialog popup (use inline expand).
- `mem://index.md` + a new memory `mem://features/learn/practice-hub` — note "Practice Hub uses inline sheet/table UX; no modals for create/edit."

Leave as-is
- `api.ts`, `srs.ts`, `types.ts`, `csv.ts`, `source.ts`, `Analytics.tsx`, `Heatmap.tsx`, `FiltersBar.tsx`, `ExportMenu.tsx`.

## Out of scope
- Bulk paste from Excel/Sheets (can add later).
- Column reordering / resizing.
- Virtualized rows.
