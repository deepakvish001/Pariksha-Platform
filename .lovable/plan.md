
# Parikshaa B2B Assessments — MVP Plan

A focused MVP layered onto the existing Parikshaa app: organizations (colleges + companies) create assessments, invite students, and review results. Students sign in, take proctored tests (coding, MCQ, SQL, subjective), and get scored automatically (or manually for subjective).

The existing learning/practice features stay intact. The new B2B surface lives under `/b2b` (org-side) and `/assessments` (student-side) so nothing already shipped breaks.

---

## 1. Brand & Design Direction

- **Palette shift for B2B surface only**: deep navy (`#0A1F44` / hsl 218 75% 16%) primary, white background, slate-gray neutrals, single emerald accent for "passed/active". Existing learning app keeps its current orange theme.
- New CSS tokens added in `index.css` under a `.theme-b2b` class scoped to B2B routes — does not disturb global tokens.
- **Typography**: Inter (already in use). Tightened scale, generous whitespace, Stripe/Linear-style cards with 1px borders + subtle shadow.
- **Components**: reuse shadcn primitives (Card, Table, Sheet, Dialog, Tabs, Badge). New shared pieces: `OrgShell`, `StatTile`, `AssessmentCard`, `InviteTable`, `LiveProctorBadge`.
- Mobile-first. Keyboard-navigable. Color contrast AA. ARIA labels on all icon buttons. Skip-to-content link.

## 2. User Roles & Access

Roles stored in a separate `org_members` table (never on profiles). New app role `org_admin` (for TPO/HR) and `student`. Platform `admin` already exists.

```text
auth.users
  ├── profiles (existing)
  ├── user_roles (existing — keeps platform-admin)
  └── organizations
        └── org_members (user_id, org_id, role: owner|admin|recruiter|viewer)
```

- A user can belong to multiple organizations (TPO at one college + recruiter at one company).
- Students are normal `auth.users` rows, no org membership required.
- All access enforced via RLS using a `SECURITY DEFINER` helper `is_org_member(_org, _role[])`.

## 3. Core Flows

### Org onboarding
1. User signs up / logs in (Email + password, Google OAuth — already wired).
2. New `/b2b/onboarding` step: choose **College** or **Company**, enter org name + logo → creates `organizations` row, makes user `owner`.
3. Lands on `/b2b/dashboard`.

### Assessment authoring (`/b2b/assessments/new`)
- Wizard: **Details → Sections → Questions → Settings → Review**.
- Sections can mix question types: coding, MCQ, SQL, subjective.
- Question bank: org-private + reusable across assessments.
- Settings: window (start/end), duration, max attempts, shuffle, per-section cutoff, proctoring toggle (basic — see §5).

### Inviting students (`/b2b/assessments/:id/invites`)
- Bulk paste emails or CSV upload (name, email, roll/employee id).
- For each invite: creates row in `assessment_invites` with unique `invite_token`.
- "Send invites" → calls Edge Function `send-assessment-invite` → uses Lovable transactional email infra (no third-party setup) to send branded email with link `/assessments/join/:token`.

### Student flow
1. Receives email with join link → if not signed in, prompted to sign up / log in.
2. Token claim creates `assessment_attempt` (one per invite).
3. `/assessments/:attemptId/lobby` — system check (camera/mic permission if proctored, fullscreen prompt, browser/network sanity).
4. `/assessments/:attemptId/play` — split-pane player:
   - Left: question navigator + timer.
   - Right: question renderer (Monaco for code/SQL, rich textarea for subjective, radio/checkbox for MCQ).
5. Auto-save every 10s. Submit (or auto-submit on timeout) → grading pipeline.

### Results & analytics (`/b2b/assessments/:id/results`)
- Leaderboard table: candidate, score, percentile, time taken, integrity score.
- Drill-down drawer: per-question answers, run logs, proctoring events.
- Export CSV.

## 4. Question Types & Grading

| Type        | Editor               | Grading                                                     |
|-------------|----------------------|-------------------------------------------------------------|
| Coding      | Monaco + lang select | Edge Function `grade-code` runs hidden test cases (Judge0-compatible API; reuses existing coding execution path) |
| MCQ         | Radio/checkbox       | Auto, instant on submit                                     |
| SQL         | Monaco + schema view | Edge Function `grade-sql` executes against an isolated Postgres schema, diffs result set |
| Subjective  | Markdown textarea    | Manual: recruiter rubric in results drawer                  |

Final score = weighted sum across sections; integrity score is separate.

## 5. Proctoring (basic, MVP)

- Tab-switch + window-blur counter (`useContestTabLock` already exists — reuse).
- Fullscreen lock prompt + exit warning.
- Optional webcam snapshot every 30s stored in `attempt_proctor_snapshots` bucket (private). Reuses existing Side Eye infra patterns; no AI room sweep in MVP.
- Per-attempt **integrity_score** = 100 − weighted penalties.

## 6. Database Schema (new tables, all RLS-protected)

```text
organizations            id, name, type(college|company), slug, logo_url, owner_id
org_members              org_id, user_id, role
assessments              id, org_id, title, description, type, duration_min,
                         starts_at, ends_at, max_attempts, proctoring_enabled,
                         status(draft|published|archived), created_by
assessment_sections      id, assessment_id, title, weight, order_index
questions                id, org_id, type(coding|mcq|sql|subjective),
                         title, body_md, language, starter_code, points, meta jsonb
question_test_cases      id, question_id, input, expected_output, is_hidden, weight
mcq_options              id, question_id, body, is_correct, order_index
section_questions        section_id, question_id, order_index
assessment_invites       id, assessment_id, email, name, external_id,
                         token (unique), status(pending|claimed|submitted|expired)
assessment_attempts      id, invite_id, user_id, started_at, submitted_at,
                         score, integrity_score, status
attempt_answers          id, attempt_id, question_id, answer jsonb,
                         auto_score, manual_score, run_log jsonb
attempt_events           id, attempt_id, kind(tab_blur|fullscreen_exit|paste|...), payload jsonb, created_at
```

RLS pattern: members of an org see/manage their org's data; students see only their own attempts/answers; recruiters see attempts under assessments they own.

## 7. Routing

```text
Org-side (org_admin gate):
  /b2b                     → marketing/landing for B2B (public)
  /b2b/onboarding
  /b2b/dashboard
  /b2b/assessments
  /b2b/assessments/new
  /b2b/assessments/:id     (overview / edit / invites / results sub-tabs)
  /b2b/question-bank
  /b2b/settings/team

Student-side (auth required):
  /assessments/join/:token
  /assessments                → list of invites + past attempts
  /assessments/:attemptId/lobby
  /assessments/:attemptId/play
  /assessments/:attemptId/result   (only if results released)

Public:
  /pricing                   → "Contact sales" form (writes to leads table + email notification)
```

## 8. Edge Functions

- `send-assessment-invite` — generates tokens, calls transactional email infra.
- `claim-invite` — converts token → attempt (atomic, one per invite).
- `grade-code` — runs hidden test cases for code submissions.
- `grade-sql` — runs SQL against sandboxed schema and grades.
- `finalize-attempt` — aggregates per-question scores, computes integrity score, marks invite submitted.

All deploy automatically. CORS + zod validation on every function.

## 9. File Structure (new)

```text
src/
  b2b/
    layouts/OrgShell.tsx
    components/{StatTile,AssessmentCard,InviteTable,QuestionEditor,...}
    pages/
      Landing.tsx, Onboarding.tsx, Dashboard.tsx,
      assessments/{List,New,Detail,Invites,Results}.tsx,
      QuestionBank.tsx, Team.tsx, Pricing.tsx
    hooks/{useOrg,useAssessments,useInvites,useAttempts}.ts
  assessments/                        // student player
    pages/{Join,Lobby,Player,Result,MyAssessments}.tsx
    components/{QuestionNav,Timer,CodeRunner,SqlRunner,McqQuestion,SubjectiveQuestion,ProctorOverlay}.tsx
supabase/functions/
  send-assessment-invite/, claim-invite/, grade-code/, grade-sql/, finalize-attempt/
```

## 10. Build Order (suggested)

1. Migration: orgs, org_members, helper functions, RLS. B2B onboarding flow + `/b2b/dashboard` shell.
2. Assessment CRUD + question bank + section builder.
3. Invite flow (manual list, no email yet) → claim-invite function.
4. Student player (MCQ + subjective first — no execution sandbox).
5. Coding + SQL question types with grading edge functions.
6. Basic proctoring (tab/fullscreen/snapshots) + integrity score.
7. Results dashboard + CSV export + transactional invite emails.
8. Pricing/contact-sales page + leads table.

Each step ships independently; you can use the platform after step 4.

## 11. Out of Scope for MVP (called out so we don't scope-creep)

- Stripe billing, plans, seat management.
- Plagiarism / AI cheating detection beyond tab/fullscreen events.
- Live human proctoring, phone-as-side-camera (Side Eye AI sweep).
- Public candidate profiles / employer search.
- Question difficulty calibration & adaptive testing.
- Multi-language UI.

These are natural follow-ups once MVP is validated.
