# Assessment Types for Colleges — Plan

Today every assessment is one generic "exam". We will introduce a typed model so a TPO/faculty can pick the right shape and the platform configures sections, defaults, participation and proctoring accordingly.

## 1. Four assessment types (v1)

Each type is a preset of: default sections, default duration, authoring sources, participation model, proctoring profile, results visibility, and analytics.

| Type | Default shape | Default duration | Authoring | Participation | Proctoring | Result | Analytics focus |
|---|---|---|---|---|---|---|---|
| **Placement Mock** (company-pattern + coding) | Aptitude · CS Core MCQ · Coding (1–4) · optional Verbal | 90–150 min | Bank + Custom + AI from JD/company name | Invite link **or** roster | Standard / Strict | Released after deadline | Company-readiness score, sectional cutoffs, percentile |
| **Academic Test** (unit / mid-sem / end-sem) | One section per chapter, faculty-defined | 30–120 min | Manual + Bank (subject-tagged) + AI from topic | Roster (class list) | Light / Standard | Instant or after deadline | Topic mastery per student, class average |
| **Skill Benchmark / Diagnostic** | Adaptive across DSA, Aptitude, CS Core | 45–60 min | Bank only (curated diagnostic pool) | Open within college | Light | Instant with strengths/weaknesses | Batch heatmap, weak-topic ranking, dept-wise gaps |
| **Coding Contest / Hackathon** | Coding-only, 2–6 problems, partial credit | 60 min – 48 hr | Bank + Custom + AI | Open within college (or invite for inter-college) | Light (contest) / Standard (graded) | Live leaderboard | Live rank, problem-wise solve rate, plagiarism flags |

Each type is just a **template** — TPO can override every default after creating it.

## 2. Authoring: all four sources

Available in every assessment type, surfaced contextually:

- **Manual** — existing question editor (MCQ, multi-select, short answer, coding, subjective).
- **Bank** — pick from Parikshaa's curated question bank with filters: topic, difficulty, company pattern, tags. Multi-select → add to section.
- **Hybrid** — bank items + custom additions live in the same section ordering.
- **AI-generated** — faculty/TPO enters a prompt (topic, JD, company, skill), AI drafts N questions via existing Gemini edge function, faculty reviews/edits/approves before adding. Reuses the existing AI content-gen infrastructure.

A new "Add questions" sheet inside section editor exposes 4 tabs: **Write · Pick from Bank · Generate with AI · Import (CSV)**.

## 3. Participation: per-assessment mode

A new `participation_mode` field on `assessments`:

- **`invite`** — current flow: tokenized links, email invites, 6-digit code.
- **`roster`** — TPO uploads CSV (or selects from saved class rosters); only those emails can claim. Invite auto-created per row.
- **`open_org`** — any verified member of the college org sees it on their dashboard "Open assessments" tab and can self-enroll. Enrollment creates an invite row on the fly.

Switching mode after publish is allowed (with a warning); existing invites are preserved.

## 4. Proctoring: per-assessment level

A new `proctoring_level` field replaces the boolean `proctoring_enabled`:

- **`off`** — no checks.
- **`light`** — tab-switch + fullscreen + copy-paste detection only.
- **`standard`** — webcam snapshots, screen capture, AI flags (existing pipeline).
- **`strict`** — adds side-camera (existing Side Eye), ID photo at start, live monitor mandatory.

The existing `proctoring_config` JSONB stays for fine-grained overrides; level is the easy preset.

## 5. UX flow

### New assessment wizard (replaces single-form `New.tsx`)
```
Step 1 — Pick a type           [Placement | Academic | Benchmark | Contest]
Step 2 — Basics                 title, description, schedule, brand color
Step 3 — Sections & questions   pre-filled by type; add via 4-tab sheet
Step 4 — Participation          mode + invites/roster/open
Step 5 — Proctoring & results   level preset + advanced toggles
Step 6 — Review & publish       sends to existing Landing page
```
Each step is skippable to Landing as a draft.

### Landing page (already built)
Show a **type badge** in the hero (color-coded), plus type-specific hints (e.g. Placement → "company pattern", Contest → "live leaderboard").

### Colleges dashboard
On `/colleges/:slug/assessments`, add a top filter chip row: **All · Placement Mocks · Academic · Benchmarks · Contests · Drafts**. Each card shows the type badge and a type-appropriate KPI (e.g. Academic → class average; Contest → top rank; Benchmark → batch coverage %).

### Student side
`MyAssessments` groups by type so students see "Upcoming placement mocks", "Class tests", "Open contests" separately.

## 6. Out of scope (defer)

- Adaptive engine for Benchmark type (v1 uses fixed diagnostic pool; adaptive comes later).
- Hackathon team formation, submission uploads, judge panel (v1 contest is individual coding only).
- Soft-skill / video / psychometric types (not in user's selected priorities).
- Inter-college multi-org leaderboards.
- Roster CSV → SSO auto-provisioning (v1: invite per email row).

---

## Technical section

### Schema migration
```sql
-- New enums
CREATE TYPE assessment_type AS ENUM ('placement_mock','academic','benchmark','contest');
CREATE TYPE participation_mode AS ENUM ('invite','roster','open_org');
CREATE TYPE proctoring_level AS ENUM ('off','light','standard','strict');

ALTER TABLE assessments
  ADD COLUMN type assessment_type NOT NULL DEFAULT 'placement_mock',
  ADD COLUMN participation_mode participation_mode NOT NULL DEFAULT 'invite',
  ADD COLUMN proctoring_level proctoring_level NOT NULL DEFAULT 'off';

-- Backfill: existing rows → placement_mock + invite + (proctoring_enabled ? standard : off)
UPDATE assessments
   SET proctoring_level = CASE WHEN proctoring_enabled THEN 'standard' ELSE 'off' END;

-- Keep proctoring_enabled as a generated/derived column for back-compat (read-only)
-- (or leave it and dual-write in app for one release, then drop)
CREATE INDEX idx_assessments_org_type ON assessments(org_id, type);
```

Plus a small helper RPC `claim_open_org_assessment(_assessment_id uuid)` for the `open_org` mode — creates an invite row for the caller after verifying org membership, then returns the token so the existing claim flow runs unchanged.

### Code touchpoints
- **`src/b2b/pages/assessments/New.tsx`** → split into a 6-step wizard (`NewWizard.tsx` + step components), first step is type picker.
- **`src/b2b/lib/assessmentTemplates.ts`** (new) → per-type defaults (sections, duration, proctoring level, participation).
- **`src/b2b/components/assessment/AssessmentLanding.tsx`** → render type badge + type-specific subtitle.
- **`src/b2b/pages/assessments/List.tsx`** → type filter chips, type badge on cards, type-aware KPI.
- **`src/b2b/pages/assessments/Detail.tsx` (editor)** → new "Add questions" sheet with Write / Bank / AI / Import tabs; reuses existing question editor for "Write".
- **`src/b2b/components/assessment/ParticipationPanel.tsx`** (new) → invite vs roster vs open_org UI; roster tab adds CSV upload.
- **`src/b2b/components/assessment/ProctoringPanel.tsx`** → swap boolean toggle for level radio + advanced collapse.
- **`src/assessments/pages/MyAssessments.tsx`** → group by type; add "Open assessments in your college" section feeding from `open_org` type.
- **`src/assessments/pages/InviteLanding.tsx`** → show type badge, type-specific copy.
- **Edge function** `ai-generate-questions` (new, optional) → wraps existing Gemini gateway to draft N questions from a prompt; returns JSON the editor can preview/edit.
- **`paths.ts`** → no new routes; wizard lives at `/b2b/assessments/new`, type picked as first step.

### Rollout
1. Migration + backfill (non-breaking; defaults preserve current behavior).
2. Type picker + templates + wizard.
3. Participation modes (roster CSV + open_org RPC).
4. Proctoring level UI.
5. AI question generation tab.
6. Dashboard filters + student-side grouping.

Steps 1–2 land first and unlock everything else.
