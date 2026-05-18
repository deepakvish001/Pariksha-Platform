## Goal

Today's New Question dialog is a single tiny form (title, body, points, language). For coding/SQL especially, authors have no place to capture difficulty, constraints, function signature, examples, multi-language starter code, sample vs hidden test cases with weights, complexity expectations, hints, or reference solution. We'll replace it with a **type-aware multi-step wizard** that walks the author through every field a coding/SQL question actually needs, with inline validation and a live candidate preview.

## Scope

- File: `src/b2b/pages/QuestionBank.tsx` (replace `NewQuestionDialog` + `QuestionEditorDialog` flow)
- New files under `src/b2b/components/question-bank/` for the wizard + per-type step components
- Extend `meta` JSON shape used by `useCreateQuestion` / `useUpdateQuestion` — no DB schema change required (existing `meta jsonb` column absorbs new fields)
- Test cases stay in `question_test_cases`; we add UI for weight, label, explanation, sample/hidden toggle, and bulk paste

## Coding question flow (4 steps)

```text
Step 1  Basics          → title, difficulty (easy/med/hard), tags, points, time limit, est. minutes
Step 2  Problem         → markdown prompt, constraints list, 1-3 worked examples (in/out/explanation)
Step 3  Code setup      → primary language, function signature, per-language starter code
                          (add JS / Python / Java / C++ / TS tabs), allowed languages
Step 4  Tests & solution→ sample test cases (visible), hidden test cases with weight + label,
                          reference solution (private), expected time/space complexity, hints
```

Each step shows a left rail with progress, inline validation, and Next/Back. Final step has "Save draft" and "Publish". Drafts go to `meta.status = "draft"`, only "published" appears in assessment pickers.

## SQL question flow (3 steps)

```text
Step 1  Basics      → title, dialect (postgres/mysql/sqlite), difficulty, tags, points
Step 2  Schema/data → CREATE TABLE DDL, seed INSERTs, 1-2 example rows preview
Step 3  Solution    → reference query, sample expected result table, hidden grading queries with weight,
                      ordering-sensitive toggle, hints
```

## MCQ / True-False / Short answer / Numerical / Matching / Fill-blanks

Keep current editors but route them through the same wizard chrome (1-2 steps) so the UX is consistent. Add: explanation/rationale field on every option (shown to candidate after submit if enabled), tags, difficulty, points.

## Cross-cutting improvements

- **Type picker first screen** with cards (icon + 1-line description + "best for…") instead of a dropdown — makes intent explicit
- **Live preview pane** on every step showing what the candidate will see
- **Validation gate** before "Next": e.g. coding step 4 requires ≥1 sample + ≥1 hidden test, reference solution non-empty
- **Edit flow uses the same wizard** (jump straight to any step from the editor)
- **Status badge** in the list: Draft / Published, plus difficulty pill and tag chips
- **Filter additions**: difficulty, tag, status, language

## Data shape (stored in `questions.meta`)

```ts
// coding
{
  status: "draft" | "published",
  difficulty: "easy" | "medium" | "hard",
  tags: string[],
  time_limit_ms: number,
  est_minutes: number,
  constraints: string[],
  examples: { input: string; output: string; explanation?: string }[],
  function_signature?: string,
  starter_code: Record<Language, string>,
  allowed_languages: Language[],
  reference_solution?: { language: Language; code: string },
  complexity?: { time?: string; space?: string },
  hints: string[],
}

// sql
{
  status, difficulty, tags, points,
  dialect: "postgres" | "mysql" | "sqlite",
  schema_ddl: string,
  seed_sql: string,
  reference_query: string,
  order_sensitive: boolean,
  hints: string[],
}
```

Test cases keep using `question_test_cases`; we add `meta.label` and `meta.explanation` via the existing `meta` column on that row if present (otherwise extend client to store label client-side until a follow-up migration).

## Technical details

- New `src/b2b/components/question-bank/QuestionWizard.tsx` — orchestrates steps, owns form state via `react-hook-form` + `zod` per type
- Per-type step files: `CodingSteps.tsx`, `SqlSteps.tsx`, `McqSteps.tsx`, etc.
- Shared bits: `WizardShell.tsx` (left rail + footer), `StarterCodeTabs.tsx`, `ExamplesEditor.tsx`, `ConstraintsList.tsx`, `TagInput.tsx`, `TestCaseTable.tsx` (replaces inline `TestCaseEditor`)
- `useCreateQuestion` / `useUpdateQuestion` already accept arbitrary `meta` — no hook change needed
- Keep `AIGenerateDialog` and `ImportQuestionsDialog` as-is; AI-generated items land as drafts so author can run them through the wizard to finish missing pieces
- No DB migration required for v1. Optional follow-up: add `meta jsonb` to `question_test_cases` for per-case labels/explanations

## Out of scope (this round)

- Code execution / running the reference solution against tests in-browser
- Schema migration for test-case labels (kept client-side for now)
- AI-assist inside the wizard (e.g. "generate 3 more hidden tests") — easy follow-up
