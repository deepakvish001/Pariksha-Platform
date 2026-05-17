# Plan: Close Assessment Platform Feature Gaps

Based on the audit, here's a phased plan to close the gaps. Grouped by priority so you can ship in increments.

## Phase 1 — Quick wins (high impact, low effort)

### 1. Two-Factor Authentication (2FA)
- Enable TOTP MFA in Supabase auth
- New page `src/pages/Settings/Security.tsx`: enroll authenticator (QR + 6-digit verify), list factors, unenroll
- Add MFA challenge step in `Login.tsx` when `aal2` required
- Reuse existing `input-otp` component
- Add "2FA enabled" badge on profile

### 2. Numerical question type
- DB: extend `question_type` enum with `numerical`; add columns on `questions` (or `meta`): `expected_number`, `tolerance`, `unit`
- Builder UI in `src/b2b/components/QuestionEditor` for numerical
- Player renderer with numeric input + unit display
- Auto-evaluator: compare with tolerance

### 3. Fill-in-the-blanks (multi-blank)
- New type `fill_blanks` with `meta.blanks: [{id, answer, case_sensitive}]`
- Body parser detects `{{1}}`, `{{2}}` placeholders → renders inline inputs
- Auto-evaluator: per-blank scoring

### 4. Geolocation in proctoring
- `useProctoring.ts`: request `navigator.geolocation.getCurrentPosition` at session start (consent-gated)
- Store in new column `attempts.start_geo jsonb` ({lat, lng, accuracy, ts})
- Show on admin recording playback (`AdminContestProctor`)

## Phase 2 — Comprehension & speech

### 5. Reading comprehension
- New type `comprehension` with `meta.passage` + `meta.sub_questions[]` (each can be mcq/short_answer)
- Renderer shows passage left, sub-questions right (responsive stack on mobile)

### 6. Listening comprehension
- Same as above, but `meta.audio_url` (Supabase Storage); play count limit + waveform
- Auto-pause when navigating away

### 7. Spoken English
- New type `spoken_english`; record candidate audio via `MediaRecorder`
- Upload to `assessment_audio_responses` bucket
- Manual grading queue + optional Gemini transcription via edge function

## Phase 3 — Partial → Complete

### 8. RBAC admin UI
- `src/b2b/pages/OrgRoles.tsx`: assign/revoke `institution_admin`, `proctor_*` roles per member
- Permission matrix display using existing `usePermissions`

### 9. Proctoring "200 knobs"
- Expand `AssessmentProctoringConfig.tsx` into tabbed editor (Camera, Browser, Network, AI, Violations, Auto-actions)
- Document each knob in `proctoringConfig.ts` schema

### 10. Question bank as plug-in
- New `org_question_bank_subscriptions` table linking orgs to public banks
- Search/import flow in question editor

### 11. Accreditation-grade exports
- `src/b2b/pages/Reports/Accreditation.tsx`: generate consolidated PDF (per-attempt evidence pack: video links, events, score breakdown, integrity factors)

## Technical details

**DB migrations** (one per phase):
- Phase 1: add `numerical`, `fill_blanks` to question_type enum; `attempts.start_geo`; MFA factors handled by Supabase auth
- Phase 2: add `comprehension`, `listening`, `spoken_english`; create `assessment_audio_responses` storage bucket
- Phase 3: `org_question_bank_subscriptions` table + RLS

**Files to create**: ~15 (settings/security page, 5 question renderers, 5 question editors, roles page, accreditation report)

**Files to modify**: ~10 (Login, Player, useProctoring, AssessmentProctoringConfig, AdminContestProctor, auto-eval logic)

## Suggested start

Phase 1 only — ships 2FA + 2 question types + geolocation in ~1 working session. Confirm and I'll start there, or pick a different starting point.
