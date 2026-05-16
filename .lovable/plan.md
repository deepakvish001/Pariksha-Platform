# Secure Assessments + Advanced Proctoring + Questions Drawer

Three independent workstreams, shipped in one pass. Backwards compatible — existing assessments keep working with current defaults.

## 1. Configurable Anti-Cheat (admin chooses per assessment)

### Schema: `assessments.proctoring_config jsonb`
Stored as JSON for forward-compatibility. Defaults to current behavior so old assessments are unaffected.

```text
{
  strictness: "lenient" | "balanced" | "strict",
  events: {
    tab_switch: { count: true, weight: 5 },
    fullscreen_exit: { count: true, weight: 8, autosubmit_after: 1 },
    paste_blocked: { count: true, weight: 4 },
    no_face_seconds: { threshold: 10, weight: 6 },
    multi_face: { weight: 10, autosubmit_after: 1 },
    second_monitor: { weight: 10, autosubmit_after: 1 },
    screenshare_lost: { weight: 8 },
    webcam_lost: { weight: 10 },
    device_change: { weight: 999, autosubmit_after: 1 },
    side_eye_lost: { weight: 6 }
  },
  max_violations: 15,
  require_screen_share: true,
  require_side_eye: true,
  require_face_detection: true,
  allow_clipboard_in_inputs: false
}
```

Admin UI: new "Proctoring" tab on the assessment editor with three presets + an "Advanced" accordion to tweak weights, thresholds, and required streams.

### Player wiring
`useProctoring` reads `proctoring_config` from the loaded assessment, replaces the current hard-coded `EVENT_WEIGHTS` / `MAX_VIOLATIONS`, and respects per-event `autosubmit_after`.

## 2. Collapsible Left Question Drawer

Replace the current top-bar palette with a left rail in `Player.tsx`.

- Default expanded ~280px, collapsible to ~56px icon strip.
- Persists state in `localStorage("assessment.palette")`.
- Sticky full viewport height; main content shifts via CSS grid (`grid-cols-[auto_1fr]`).
- Shows section groups, numbered tiles, status (answered / marked / current / unattempted), filters, search-by-number, and progress bar.
- On mobile (<768px): renders as an off-canvas Sheet triggered by a FAB.
- Built with shadcn `Sidebar` primitive for consistency with the rest of the app.

## 3. Advanced Proctoring

### 3a. Face detection (in-browser)
- Use `face-api.js` (tiny model, ~190KB) loaded from `/public/models/`.
- Runs every 2s on the existing webcam stream.
- Emits `no_face` (after threshold seconds) and `multi_face` events. Logged to `attempt_events`.

### 3b. Screen-share + second-monitor detection
- During `AssessmentLockdownGate`, after webcam, request `navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" } })`. Reject if `displaySurface !== "monitor"`.
- Poll `window.screen.isExtended` every 5s; if true → `second_monitor` event.
- Stream is sampled (1 frame / 10s) and uploaded same path as webcam snapshots.

### 3c. Paste / typing-pattern detection
- Wrap text inputs (code editor, SQL, text answers) with a `useTypingAnalytics` hook.
- Flags: paste > 50 chars, typing speed > 800 cpm sustained 10s, identical keystroke bursts.
- New event types: `paste_large`, `typing_burst`. Server-side cron job hashes final answers to flag duplicates across attempts.

### 3d. Device / IP lock
- On attempt start, compute a fingerprint (FingerprintJS open-source, no API key) + capture IP via edge function.
- Store in `assessment_attempts.device_fingerprint` / `device_ip`.
- Every resume / heartbeat compares; mismatch → `device_change` event + auto-submit.

### 3e. AI snapshot review (async)
- New edge function `assessment-snapshot-review` runs every 30s on a queue of unreviewed snapshots.
- Calls Lovable AI (`google/gemini-3-flash-preview`) with structured output: `{ phone_in_frame, looking_away, identity_match, person_count, notes }`.
- Persists to `assessment_proctor_findings`; surfaces flags in admin Proctoring view with severity badges.

### 3f. Third Eye (multi-device side camera) — for assessments
We already have the contest version. Generalize it.

- Rename / extend `contest_side_camera_*` tables OR add parallel `assessment_side_camera_*` tables with the same shape, keyed by `attempt_id` instead of `contest_submission_id`. (Plan: parallel tables to avoid breaking contests.)
- Reuse the existing pairing edge functions (`sideeye-pair`, `sideeye-signal`, `sideeye-frame-upload`) with an `attempt_id` parameter.
- Candidate flow:
  1. Lockdown gate shows QR + 6-digit code.
  2. Candidate opens link on phone, accepts camera, places phone at side angle.
  3. WebRTC P2P stream (signaling via existing `sideeye-signal` function) — phone → laptop preview tile + every 5s a JPEG chunk uploaded to storage.
  4. Lockdown completes only after side-eye `paired` AND face detected on primary cam.
- During exam:
  - Phone disconnect > 15s → `side_eye_lost` event.
  - Snapshots tied to `attempt_id` reviewed by the same `assessment-snapshot-review` edge function (extra prompt: hands on desk, phone presence, secondary person).
- Admin dashboard: existing `Proctoring.tsx` gets a "Third Eye" tab per attempt that tiles webcam | screen | side-eye live (when active) or last frames (when not).

## Technical Details

### Files added
- `src/assessments/hooks/useFaceDetection.ts`
- `src/assessments/hooks/useDisplayCapture.ts`
- `src/assessments/hooks/useTypingAnalytics.ts`
- `src/assessments/hooks/useDeviceLock.ts`
- `src/assessments/hooks/useSideEyeAssessment.ts` (wraps existing WebRTC client)
- `src/assessments/components/QuestionDrawer.tsx` (replaces top palette in player layout)
- `src/assessments/components/ThirdEyePairing.tsx`
- `src/b2b/components/AssessmentProctoringConfig.tsx` (admin editor tab)
- `supabase/functions/assessment-snapshot-review/index.ts`
- `supabase/functions/assessment-sideeye-pair/index.ts` (thin wrapper or shared)
- `public/models/tiny_face_detector*.json` + weights

### Files edited
- `src/assessments/pages/Player.tsx` — grid layout, mount drawer, wire all new hooks.
- `src/assessments/hooks/useProctoring.ts` — config-driven weights, new event kinds, per-event auto-submit.
- `src/assessments/components/AssessmentLockdownGate.tsx` — add screen-share + Third Eye gates.
- `src/admin/parikshaa/Proctoring.tsx` — Third Eye tile + AI findings column.
- `src/b2b/pages/AssessmentEditor.tsx` — new Proctoring tab.

### Migrations
1. `ALTER TABLE assessments ADD COLUMN proctoring_config jsonb NOT NULL DEFAULT '{}'::jsonb;`
2. `ALTER TABLE assessment_attempts ADD COLUMN device_fingerprint text, ADD COLUMN device_ip inet, ADD COLUMN screen_extended boolean DEFAULT false;`
3. New `assessment_proctor_snapshots` (attempt_id, source: 'webcam'|'screen'|'sideeye', storage_path, captured_at) + RLS.
4. New `assessment_proctor_findings` (snapshot_id, finding jsonb, severity, created_at) + RLS.
5. New `assessment_side_camera_pairings` + `assessment_side_camera_frames` (mirror of contest variants, keyed on attempt_id) + RLS.
6. Storage bucket `assessment-proctor` (private) + read policies for org admins.

### Edge functions
- `assessment-snapshot-review` (cron every 30s via pg_cron + pg_net) → Gemini structured output.
- `assessment-sideeye-pair` (POST: returns pairing code + token bound to attempt_id).
- `assessment-sideeye-signal` (WebSocket-style POST for SDP/ICE exchange).
- `assessment-device-claim` (POST on attempt start: writes fingerprint + IP, returns 409 if mismatch).

### Libraries to add
- `face-api.js` (or `@vladmandic/face-api` fork — better TS support)
- `@fingerprintjs/fingerprintjs` (open source v3)

### Backwards compatibility
- `proctoring_config = {}` falls back to current hard-coded behavior.
- Contests' existing `contest_side_camera_*` flow untouched.
- Admin `Proctoring.tsx` continues to read existing tables; new columns rendered only when present.

## Out of scope
- Audio monitoring (deferred — was not selected).
- Live proctor video chat (the multi-view tile is offline / last-frame; no live human invigilator UI in this pass).
- Mobile-as-primary-device support (laptop required).

