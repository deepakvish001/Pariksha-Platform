
## Goal

Turn Secure Mode into a true contest "kiosk": no sidebar, no escape routes to notes/solutions, an always-on timer, a draggable webcam PiP, recorded screen share, AI-assisted cheating detection, a live trust score, and a realtime leaderboard with full participant detail.

## 1. Contest kiosk shell (no sidebar)

- New layout `ContestKioskLayout` used only when a problem is opened **inside an active secure session**.
  - Detected via `useActiveContestSession(contestId).hasActive` + URL `?contest=<id>`.
  - Renders `<Outlet/>` directly with **no `DashboardLayout`** (no sidebar, no header, no topbar). Just the SecureProblemHUD on top and a slim contest top-bar (title, timer, submit, exit-disabled-with-confirm).
- New route: `/contests/:slug/play/:problemSlug` → `ContestKioskLayout` → `CodingProblemDetail` in "contest mode".
- `CodingProblemDetail` accepts a `contestMode` prop:
  - Hides Notes, My Solution, Hints, Run-history, Bookmarks tabs (locked with a 🔒 + "Unlocks when contest ends").
  - Forces fullscreen on mount; if user exits fullscreen, shows blocking overlay "Return to fullscreen to continue" (already partially done — promote from violation to hard-block).
  - Always-visible **contest timer** (countdown to `ends_at`) in the top bar; auto-submits current solution when it hits 0.
  - **Submit** stays in the top bar at all times, gated on `submissionAllowed`.

## 2. Lock reference content until contest ends

- Add a `useContestLocks(contestId)` helper returning `{ notesLocked, solutionLocked, hintsLocked, historyLocked }` based on `ends_at`.
- In `NotesPanel`, `MySolutionPanel`, `ProgressiveHints`, `ProblemRunHistory`: when `locked`, render a Card with Lock icon + "Available after contest ends at HH:MM" instead of content. No data fetched.
- Same gating server-side via a new RPC `contest_can_view_aux(_contest_id, _problem_id)` that the panels call before rendering — defense in depth.

## 3. Webcam PiP (draggable, min/max, crop)

- New `WebcamPiP` component (replaces the hidden snapshot canvas):
  - Live `<video>` from `videoStreamRef.current`.
  - Default position **bottom-right**, draggable to any corner; remembers position in localStorage.
  - Buttons: minimize (→ small avatar dot), maximize (240×180), close-disabled.
  - Built-in **crop** (square / 4:3 / 16:9) using a CSS clip-path; the snapshot uploader uses the same crop region so saved JPEGs match what the proctor sees.
  - Snapshots continue every 60 s into the existing `contest-proctor` bucket.

## 4. Screen-share capture + recording

- On entering secure session, prompt `getDisplayMedia({ video: true, audio: false })` in addition to webcam. If the user declines, the session cannot start (hard requirement, surfaced as a dedicated checklist item).
- Record the screen stream with `MediaRecorder` (VP9/webm, 1 fps keyframe-heavy, ~500 kbps) into 30-second chunks.
- Each chunk uploads to a new private bucket `contest-screen-recordings` at `userId/contestId/sessionId/<epoch>.webm`.
- A new table `contest_screen_recordings` (session_id, user_id, contest_id, storage_path, started_at, duration_sec) lets admins replay segments from the proctor page.
- If the screen stream ends (user clicks "Stop sharing"), log a `screen_share_stopped` violation (severity `flag`) and require the user to reshare to keep submitting.

## 5. AI-assisted cheating detection

- Tab/visibility, copy, paste, context-menu already logged. Add:
  - `window_blur` (focus lost without `document.hidden`, e.g. devtools).
  - `multi_face` / `no_face` from a lightweight client-side check on each webcam snapshot (use the existing snapshot pipeline; run a tiny FaceDetector via `window.FaceDetector` where available, otherwise skip silently).
- New edge function `proctor-analyze` (verify_jwt = true):
  - Triggered every 2 minutes per active session via pg_cron + pg_net OR client-side throttled call.
  - Pulls the last N snapshots' storage URLs + the violation log for the session.
  - Asks Lovable AI Gateway (`google/gemini-2.5-flash`, vision) to score:
    `{ trust_score: 0–100, reasons: string[], risk: "low"|"medium"|"high" }`.
  - Writes into a new table `contest_trust_scores (session_id, user_id, contest_id, score, risk, reasons jsonb, computed_at)`.
- Score blends:
  - Heuristic: `100 − 8 × violation_count − 15 × fullscreen_exits − 25 × screen_share_stops`.
  - AI vision multiplier on top.
  - Final = `clamp(0, 100, heuristic × ai_multiplier)`.

## 6. Trust-score UI

- **Participant HUD**: badge in `SecureProblemHUD` shows current trust score + risk color (green ≥ 80, amber 50–79, red < 50). Clicking it opens a dialog listing the most recent reasons.
- **Admin proctor page**: trust score column with sparkline; sortable; click a row to see snapshots, screen recording chunks, full violation log, and AI reasons.

## 7. Realtime leaderboard with participant detail

- Extend `ContestLeaderboard.tsx`:
  - Subscribe to `contest_leaderboard_rows` and `contest_trust_scores` via Supabase Realtime; update rows in place without page reload.
  - Add columns: avatar, display name (already present), college (from `profiles`), trust score badge, last-submission time, language used.
  - "Live" badge already exists; add row-flash animation on update.
- Server-side: a `contest_leaderboard_full` view joins `profiles`, `contest_leaderboard_rows`, latest `contest_trust_scores`, and latest accepted submission.

## 8. Server enforcement (defense in depth)

- Update `validate_contest_submission` RPC to also reject when:
  - No screen-recording chunk uploaded in the last 60 s.
  - Trust score < `contest.min_trust_score` (default 30, configurable per contest).
- New RLS on the two new tables: only the owner and admins can read; only edge functions (service role) can insert trust scores; clients insert recording chunks via signed URLs only.

## Files to create

- `src/layouts/ContestKioskLayout.tsx`
- `src/components/contests/ContestTopBar.tsx` (timer + submit + exit confirm)
- `src/components/contests/WebcamPiP.tsx`
- `src/components/contests/TrustScoreBadge.tsx`
- `src/hooks/useContestLocks.ts`
- `src/hooks/useScreenRecorder.ts`
- `src/hooks/useContestTrustScore.ts`
- `supabase/functions/proctor-analyze/index.ts` (+ config block, verify_jwt = true)
- Migration: `contest_screen_recordings`, `contest_trust_scores`, view `contest_leaderboard_full`, bucket `contest-screen-recordings` (private) + RLS, updated `validate_contest_submission`, new RPC `contest_can_view_aux`.

## Files to edit

- `src/App.tsx` — add `/contests/:slug/play/:problemSlug` route under `ContestKioskLayout`.
- `src/pages/library/CodingProblemDetail.tsx` — `contestMode` prop, lock panels, mount `WebcamPiP`, render `ContestTopBar` instead of default header, hide tabs.
- `src/components/contests/SecureContestGate.tsx` — require screen-share in checklist; on start, navigate to `/contests/:slug/play/<first-problem>`.
- `src/components/contests/SecureProblemHUD.tsx` — add `TrustScoreBadge`.
- `src/hooks/useContestSecureMode.ts` — wire `useScreenRecorder`, new violation types (`window_blur`, `screen_share_stopped`, `multi_face`, `no_face`).
- `src/pages/contests/ContestLeaderboard.tsx` — realtime subscription + new columns.
- `src/pages/admin/contests/AdminContestProctor.tsx` — trust score column, screen-recording playback, AI reasons.

## Notes / risks

- `getDisplayMedia` and fullscreen require a fresh user gesture; we already have the "Start secure session" button — both prompts happen there.
- 30-second webm chunks at low bitrate keep storage manageable (~2 MB / minute / user). For a 2-hour contest with 100 users that's ~24 GB; configurable via `chunk_seconds` and `bitrate` on the contest record.
- Face detection is best-effort: only Chrome-based browsers ship `FaceDetector`. Where missing we skip — the AI vision pass still inspects snapshots server-side.
