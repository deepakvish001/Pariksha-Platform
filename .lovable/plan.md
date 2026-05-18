
## Goal
Turn `/b2b/question-bank` into a clean **hub of cards (one per question type)**, and move every question action (list, create, edit) into its **own full page** instead of popup dialogs.

## New layout

### 1. Hub page — `/b2b/question-bank`
A grid of 9 cards, one per type from `TYPE_CARDS` (Coding, MCQ, SQL, True/False, Short answer, Numerical, Matching, Fill in the blanks, Subjective).

Each card shows:
- Type icon + label + short description
- Counts: Total · Published · Drafts · Archived (computed from `useQuestions(org.id)` filtered by type)
- Two actions: **Open** (→ list page) and **+ New** (→ new page for that type)

Top of the hub also keeps:
- KPI strip (Total / Published / Drafts / Archived across all types)
- Header actions: Import, AI Generate, Export ▾ (unchanged behavior)

```text
┌ Question Bank ───── [Export▾] [Import] [AI ✨] ┐
│ Total 124  Published 98  Drafts 21  Archived 5 │
│                                                │
│ ┌── Coding ──┐ ┌── MCQ ─────┐ ┌── SQL ─────┐  │
│ │ 42 total   │ │ 31 total   │ │ 18 total   │  │
│ │ 30 pub …   │ │ 25 pub …   │ │ 12 pub …   │  │
│ │ [Open] [+] │ │ [Open] [+] │ │ [Open] [+] │  │
│ └────────────┘ └────────────┘ └────────────┘  │
│ … 6 more type cards …                          │
└───────────────────────────────────────────────┘
```

### 2. Type list page — `/b2b/question-bank/:type`
Reuses the current dense table layout (filters, search, status tabs, bulk bar, row actions), but **scoped to one type** (no type selector). Adds a back link to the hub.

- All current features preserved: search, status tabs, bulk select/delete, duplicate, archive/unarchive, row delete.
- Row click → `/b2b/question-bank/:type/:id/edit` (full page, not dialog).
- "+ New" button → `/b2b/question-bank/:type/new`.

### 3. New question page — `/b2b/question-bank/:type/new`
Hosts the existing wizard content as a full-page form (reuses `QuestionWizardDialog` internals rendered without the `Dialog` shell). On save → redirect to the edit page or back to the type list.

### 4. Edit question page — `/b2b/question-bank/:type/:id/edit`
Hosts the existing `QuestionEditorDialog` body as a full-page editor with the same sections (basics, options/test cases, etc.). Back link returns to the type list. Removes the modal entirely.

## Technical notes

- **Routes** in `src/App.tsx` (both `/b2b/...` and tenant `:slug/...` blocks):
  - `question-bank` → `QuestionBankHub`
  - `question-bank/:type` → `QuestionBankList`
  - `question-bank/:type/new` → `QuestionEditorPage` (create mode)
  - `question-bank/:type/:id/edit` → `QuestionEditorPage` (edit mode)
- **File split** under `src/b2b/pages/question-bank/`:
  - `Hub.tsx` — new card grid + KPI + header actions (Import/AI/Export reused as-is).
  - `List.tsx` — extracted list/table from current `QuestionBank.tsx`, scoped by `useParams().type`.
  - `Editor.tsx` — full-page wrapper around the wizard / legacy editor body.
- Refactor `QuestionWizardDialog` into a `<QuestionWizard />` body + a thin dialog wrapper, so the page version can render the same body without `Dialog`. Same for `QuestionEditorDialog`.
- Keep `useQuestions`, duplicate/archive/export logic untouched — moved into the list page.
- `OrgShell` sidebar entry `Question Bank` keeps the same `/b2b/question-bank` href.
- Empty/loading states preserved per page.

## Out of scope
- No schema, RLS, or hook changes.
- No new features (sorting, pagination, saved views).
- Import / AI Generate / Export logic unchanged — they stay on the hub header.
- No design-system color changes; uses existing semantic tokens.
