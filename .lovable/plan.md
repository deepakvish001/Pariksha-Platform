
# College Student Enrollment + Dashboards

Today the B2B layer has `organizations`, `org_members` (owner/admin/proctor/recruiter/viewer roles for *staff*), and `b2b_org_invites` for inviting staff. Students only exist transiently via `assessment_invites` per assessment. This plan introduces **persistent student enrollment** at the college level, a **student-facing college home**, and a **detailed admin view** of each enrolled student.

## 1. Data model (new)

New tables in `public`:

- **`org_students`** — one row per enrolled student in a college org.
  - `org_id`, `email` (lowercased, unique with org_id), `user_id` (nullable until they sign up), `full_name`, `roll_number`, `branch`, `batch_year`, `section`, `status` (`invited` | `active` | `suspended` | `alumni`), `enrolled_by`, `enrolled_at`, `activated_at`, `metadata jsonb`.
- **`org_student_invites`** — pending email invites with `token`, `expires_at`, `accepted_at`. Separate from staff `b2b_org_invites` so flows don't collide.
- **`org_student_groups`** + **`org_student_group_members`** — optional cohorts (e.g., "CSE 2026", "Section B") so admins can target assessments to a group.
- Extend `assessment_invites` linkage: add nullable `org_student_id` so attempts tie back to the enrollment record (no breaking change).

RLS:
- College owners/admins/recruiters can CRUD `org_students` for their org.
- The student themself can `SELECT` their own row (`auth.uid() = user_id`).
- Use existing `is_org_member` + a new `is_org_student(org_id)` security-definer helper to avoid recursion.

Triggers:
- On new auth user, match `email` against `org_students` and backfill `user_id` + flip status to `active`.
- On `assessment_invites` insert where email matches an `org_students` row, auto-set `org_student_id`.

## 2. Bulk enrollment UX (admin)

New route: `/colleges/:slug/students` (and legacy `/b2b/students`).

- **Students table**: search, filter by status/branch/batch/group, sort. Columns: name, email, roll, branch, batch, status, last active, # assessments taken, avg score, integrity flags.
- **Add students**:
  - Single add (form).
  - **Bulk CSV upload** with column mapping (email required; name/roll/branch/batch/section/group optional). Preview + dedupe (case-insensitive email). Validation via zod on client *and* server (edge function).
  - **Paste list** (newline/comma-separated emails).
- On submit → edge function `enroll-students` inserts into `org_students` (status `invited`), creates `org_student_invites` tokens, enqueues branded emails through the existing Lovable transactional email system (subject: "You've been enrolled at <College>").
- Row actions: resend invite, edit details, change group, suspend, remove, export CSV.

## 3. Student onboarding & login

- Email contains a magic link `…/join/student?token=…` → page resolves token, ensures the user is signed in (login or signup with the invite email pre-filled), then calls RPC `accept_student_enrollment(token)` which links `user_id` and marks `active`.
- If the student signs up via the normal flow with an email that already has an `org_students` row, the trigger auto-links — no token needed.
- Post-login redirect (`getPostLoginPath`) gets a new branch: if the user has any `org_students` rows with status `active`, default to `/my/college` (their college home).

## 4. Student-facing pages (new)

Route group under `/my/college` (and `/my/college/:slug` if a student belongs to more than one):

- **College Home**: branded header (org logo + brand color), college name, their roll/branch/batch/section, contact info, announcements (optional later).
- **My Dashboard** (`/my/college/dashboard`):
  - KPI strip: assessments assigned, completed, upcoming, avg score, current rank in batch (opt-in), integrity score.
  - **Upcoming assessments** list (from `assessment_invites` joined to assessments where window is open or future) with "Start" CTA → existing player.
  - **Past attempts** table: assessment, date, score, integrity, link to result page.
  - **Skill breakdown** chart (reuse existing analytics) — strengths/weaknesses across attempted assessments.
  - **Activity timeline**: invites received, attempts started/submitted, results released.
- **My Profile (college)**: editable subset (name, phone). Admin-managed fields (roll/branch/batch) read-only.

Reuse existing assessment player & result pages — no changes there.

## 5. College admin "Students" detail dashboard

New route: `/colleges/:slug/students/:studentId`.

- **Header**: avatar, name, email, status pill, roll/branch/batch, groups, enrolled date, last login.
- **KPI tiles**: assessments invited / attempted / completed, avg score, avg integrity, time spent total.
- **Performance chart**: score over time (line) + per-skill radar.
- **Assessments table**: every assignment with status (invited/in-progress/submitted/expired), score, integrity flags, proctoring summary, link to `AttemptDetail`.
- **Integrity panel**: aggregated violation counts, links to flagged attempts (reuses `LiveProctorWall`/`ProctoringTriagePanel` styling).
- **Admin actions**: assign to assessment, add to group, resend pending invites, suspend, remove, export PDF report.

Also extend the existing **college dashboard** (`/b2b/dashboard` / `/colleges/:slug`) with:
- "Enrolled students" KPI tile + "Active this week" sparkline.
- "Students at risk" widget (low scores or integrity flags in last N days).
- Quick action: "Enroll students".

## 6. Sidebar / nav

Add to `DashboardSidebar` (college workspace):
- **Students** → list page
- **Groups** (under Students) → optional
Student sidebar adds:
- **My College** → college home
- **My Dashboard** (already present logic, just routes here when they're a student)

## 7. Permissions

Extend `Capability` enum and `usePermissions` with:
- `students.view`, `students.manage`, `students.invite`, `students.export`.
Default to owner+admin; recruiter gets view+invite; viewer gets view only.

## 8. Edge functions

- `enroll-students` — validates payload (zod), upserts rows, generates tokens, enqueues invite emails (uses existing transactional email infra; no new secrets).
- `accept-student-enrollment` — validates token, links user, marks active, returns redirect target.
- `student-dashboard-stats` — aggregated counts for a student (used both by student self-view and admin detail page; RLS via security-definer).

## 9. Tests

- DB: RLS tests for `org_students` (student sees only self; admin sees org's students; cross-org isolation).
- Hooks: `useEnrollStudents`, `useStudentDashboard` (vitest + msw-like supabase mocks).
- E2E (Playwright):
  - Admin uploads CSV → invite email queued → student accepts → appears as `active`.
  - Student logs in → lands on `/my/college/dashboard` → sees upcoming assessment.
  - Admin opens student detail → KPIs reflect a completed attempt.

## 10. Rollout

1. Migration + RLS + helper functions.
2. `enroll-students` + `accept-student-enrollment` edge functions + email template.
3. Admin Students list + bulk CSV.
4. Student college home + dashboard + post-login routing.
5. Admin student detail page + dashboard widgets.
6. Tests + docs.

---

### Open questions before I build

1. **Scope of the student dashboard now**: just college-assigned assessments, or also surface their general learn/practice activity already in the app?
2. **Email-domain restriction**: should enrollment auto-restrict the student's signup to the college's `allowed_email_domains`? (The org table already has that column.)
3. **Groups/cohorts**: include now, or ship enrollment + dashboards first and add groups in v2?
4. **Multiple colleges per student**: realistic, or should we hard-cap to one active enrollment?
