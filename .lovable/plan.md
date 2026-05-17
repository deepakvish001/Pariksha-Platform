# Merge Proctoring into Assessment Manage

Goal: kill the separate **Proctoring monitor** and surface every proctoring capability *inside* each assessment's **Manage** page. Clicking any participant opens a side drawer with the full "what is this student doing right now" view.

## 1. Retire the standalone Proctoring page

- Delete `src/b2b/pages/Proctoring.tsx`.
- Remove the `B2BProctoring` import + both route registrations in `src/App.tsx` (`/b2b/proctoring` and the nested `proctoring` route).
- Add a redirect: `/b2b/proctoring` → `/b2b/assessments` (preserve old bookmarks).
- Remove the **Proctoring** sidebar entry from `src/b2b/layouts/OrgShell.tsx` (both nav arrays).
- Update `Dashboard.tsx` / any "Open proctoring" CTAs to point at the assessments hub instead.

## 2. Promote Manage into the per-assessment command center

In `src/b2b/pages/assessments/Manage.tsx`:

- Apply the same role gate the Proctoring page used (`useCanProctor`) so sensitive evidence stays restricted; non-proctors still see the participants table but evidence/snapshot UI is hidden.
- Extend the existing `useAssessmentLive` hook (or wrap it in this page) to additionally fetch for this assessment's attempts:
  - `assessment_proctor_findings` (severity, finding, created_at)
  - `assessment_proctor_snapshots` (webcam vs screen counts)
  - `assessment_side_camera_frames` (side-cam counts)
  - subscribe to `INSERT` on findings + snapshots for the live feel the Proctoring page had.
- Add three new participant-row columns / chips: **Webcam / Screen / Side-cam counts** (Camera/Monitor/Smartphone icons + numbers) and **Findings** (`high`/`med`/`clean` badges) — exact styling reused from `Proctoring.tsx` so we don't lose the visual language.
- Add `findings`, `snapshots`, `sideCam` to the sort/filter set (e.g. "Flagged only", "High severity", existing status filter stays).
- Bring `RetentionCard` over and mount it at the bottom of Manage (collapsed by default) so admins can still tune retention from here.

## 3. Student-in-test drawer

Replace the current "row click does nothing" behaviour with a `Sheet` (side drawer) — using shadcn `Sheet`, opens on row click.

Drawer contents (tabbed, all scoped to the selected `attempt_id`):

1. **Overview** — candidate name/email, status, started/ended, elapsed, score, integrity score, force-submit button (existing), copy attempt link.
2. **Live evidence** — embeds the existing `AttemptInspector` (`src/components/proctoring/AttemptInspector.tsx`) which already renders webcam/screen/side-cam playback.
3. **Proctoring findings** — list from `assessment_proctor_findings` with severity badges; reuse `AttemptProctoringPanel`.
4. **Activity timeline** — `attempt_events` already streamed by `useAssessmentLive`, filtered to this attempt, newest first, with icons for tab_blur/copy/paste/fullscreen_exit/etc.
5. **SOS history** — reuse `AttemptSosHistoryPanel`.
6. **Answers / progress** — pull from `assessment_attempt_answers` (question, answer, correct, time spent) so the proctor can see what the student is actually doing question-by-question.

Footer of the drawer: **"Open full attempt page"** → existing `/b2b/assessments/:id/attempts/:attemptId` for deep forensics.

Drawer is `w-full sm:max-w-2xl lg:max-w-4xl`, glass card aesthetic to match the rest of B2B.

## 4. Cross-assessment safety net

Because the org-wide list is gone, add a **"Flagged across all assessments"** ribbon at the top of the **Assessments Hub** (`List.tsx`) — a thin horizontal strip showing the 5 highest-severity live attempts org-wide, each chip deep-linking to `/b2b/assessments/:id/manage?attempt=<id>` (auto-opens the drawer). This keeps the cross-assessment triage that was the Proctoring page's main job, without a separate route.

Manage page reads `?attempt=` on mount and opens the drawer for that id.

## 5. Tests / cleanup

- Update `src/b2b/pages/__tests__/Dashboard.test.tsx` if it referenced the proctoring link.
- Delete any tests for `Proctoring.tsx`.
- Add a smoke test for Manage: drawer opens on row click, force-submit confirmation still works, `?attempt=` auto-opens.

## Technical notes

- Reused components: `AttemptInspector`, `AttemptProctoringPanel`, `AttemptSosHistoryPanel`, `RetentionCard` — no rewrites.
- New data wiring lives in `useAssessmentLive` (extended) — no new hook file.
- All evidence queries already filter by attempt ids that belong to the current assessment, so existing RLS keeps tenants isolated.
- No DB migrations required.

## Files touched

- delete: `src/b2b/pages/Proctoring.tsx`
- edit: `src/App.tsx` (remove routes, add redirect)
- edit: `src/b2b/layouts/OrgShell.tsx` (drop Proctoring nav entries)
- edit: `src/b2b/hooks/useAssessmentLive.ts` (add findings/snapshots/side-cam queries + realtime)
- edit: `src/b2b/pages/assessments/Manage.tsx` (new columns, drawer, role gate, retention card, `?attempt=` handler)
- edit: `src/b2b/pages/assessments/List.tsx` (flagged ribbon)
- edit: `src/b2b/pages/Dashboard.tsx` (retarget any proctoring CTA)
- edit/remove: related tests
