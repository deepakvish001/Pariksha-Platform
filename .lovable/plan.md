## Goal

1. Tag every question as **Free** or **Premium** (chosen at create / upload / AI-generate time).
2. Show the tier as a badge in the Question Bank list + filter; the tabular list emphasizes Premium vs Normal.
3. Gate candidate access — Premium questions are only attemptable by candidates whose org/account has `premium` access.
4. Make `/b2b/question-bank` double as a **Super-Admin curated global bank**: super-admins see and edit a shared pool that every org can pull from.

## Data model (one migration)

`questions` table — add:
- `tier text not null default 'free' check (tier in ('free','premium'))`
- `is_global boolean not null default false` — true rows belong to the curated global bank (no org gate)
- `global_curated_by uuid null` (super-admin user id, for audit)
- index on `(tier)` and partial index on `(is_global) where is_global = true`

RLS additions on `questions`:
- Existing org policies stay for `is_global = false`.
- New SELECT policy: anyone authenticated may read rows where `is_global = true`.
- New INSERT/UPDATE/DELETE policy for `is_global = true`: only `has_role(auth.uid(),'admin')` (existing `user_roles` table + `has_role` function).
- Mirror policies on `mcq_options` and `question_test_cases` keyed off parent `questions.is_global`.

Candidate gating:
- Add `profiles.is_premium boolean default false` (or reuse if already present — will check before migration).
- Add SQL helper `public.user_is_premium(uid uuid) returns boolean security definer`.
- On the assessment attempt path (server-side check in the existing attempts/serve-paper edge function): if question.tier = 'premium' and `!user_is_premium(candidate)`, omit/replace with a "Premium locked" placeholder.

## Frontend changes (all in `src/b2b`)

**Types**
- Extend `Question` in `useQuestions.ts` with `tier: 'free'|'premium'` and `is_global: boolean`.
- New hook flag: `useQuestions(orgId, type, { scope: 'org' | 'global' | 'all' })`. Super-admin in admin mode uses `'global'`; non-admin uses `'org'`.

**Create / Upload / AI Generate — ask tier**
- `SimpleNewForm` and `CodingWizard`/`SqlWizard`: add a small **Tier** segmented control (Free / Premium) in the meta panel, default Free.
- CSV/JSON import on Question Bank: parse optional `tier` column; if missing show a one-time dialog "Set tier for imported questions" with Free / Premium / Per-row.
- AI Generate flow: add Tier toggle in the prompt panel, persisted into the generated rows.

**Hub + List UI**
- Hub cards already show counts per type — add a small "Premium / Free" mini-split below counts.
- List view (`ListView` in `QuestionBank.tsx`):
  - New filter dropdown **Tier**: All / Premium only / Free only (default All, sorted Premium-first).
  - Default sort: Premium rows pinned to top, then by `created_at desc` (user phrased this as "in tabular list show premium not free one normal questions and premium questions" — interpreted as Premium grouped/highlighted above normal).
  - New column **Tier** with a gold `Premium` pill and a muted `Free` pill (semantic tokens, not hardcoded colors — extend `--accent-premium` in `index.css`).
  - Row action + bulk action: **Set tier → Free / Premium**.

**Admin mode (super-admin only)**
- Detect via existing `useUserRole().isAdmin`.
- Add a top-of-page switch on `/b2b/question-bank`: **Org bank ↔ Global bank**. Hidden for non-admins.
- Global mode: `useQuestions` scope `'global'`, writes set `is_global = true` and skip `org_id` (column made nullable for global rows OR uses a sentinel global org — will use nullable `org_id` with policy `org_id is null and is_global`).
- Org users get a read-only "Browse global bank" tab inside the hub that lets them **Clone to org** (server function `clone_global_question(qid, target_org)` copies row + options + tests into their org, tier preserved).

**Editor**
- `EditView`: show Tier control. In global mode it edits the global row; in org mode it edits the org row.

## Out of scope
- Billing / actually granting `profiles.is_premium`. The toggle exists; payment flow is separate.
- Changing existing assessment authoring UI beyond what's needed to keep paper generation honest.
- Bulk migration of existing questions — they all default to `tier='free'`, `is_global=false`.

## Files touched

- migration (new) — schema + RLS + `clone_global_question` RPC + `user_is_premium` helper
- `src/b2b/hooks/useQuestions.ts` — types, scope param, clone mutation
- `src/b2b/pages/QuestionBank.tsx` — Tier filter, column, admin scope switch, bulk action, hub split
- `src/b2b/components/question-bank/QuestionWizardDialog.tsx` (+ Coding/Sql wizards + SimpleNewForm + AI Generate panel) — Tier control
- Import CSV/JSON parser inside `QuestionBank.tsx` — tier handling
- `src/b2b/hooks/usePermissions.ts` — no change; reuse `useUserRole`
- Assessment paper serve edge function — premium gate (will read and patch in the build step)

## Approve to proceed and I'll run the migration first, then ship the UI.