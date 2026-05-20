## Goal

Make the Third Eye phone session terminate cleanly in every end-of-test path, and make re-pairing from a fresh QR rock-solid. Three things must always be true:

1. When the candidate submits (manual, auto-submit, or timer expiry) → phone screen flips to "Test ended", camera + recorder stop, no more uploads.
2. When the test tab closes/crashes/navigates away → same thing happens within ~15 s.
3. From the desktop preflight, the candidate can always generate a brand-new QR if their phone got disconnected, expired, or the previous attempt ended.

Today, only #3 partially works (Generate new pairing button exists), and the phone happily keeps recording 165 s chunks even after the desktop has submitted.

## Files to change

```text
supabase/functions/assessment-sidecam/index.ts   (edit – new action + richer status)
src/assessments/pages/SideCamera.tsx              (edit – react to "closed" + poll attempt)
src/assessments/pages/Player.tsx                  (edit – close pairing on submit + unload)
src/assessments/components/SideCameraPairing.tsx  (edit – treat "closed" as terminal)
supabase/migrations/<new>.sql                     (add 'closed' to pairing status check)
```

## Behaviour

### Phone (`/assessments/sidecam/:token`)
- After `start()`, every 8 s call `action=status`. Server now also returns `attemptStatus` (from `assessment_attempts.status`) and pairing `status`.
- If pairing status is `closed`/`disconnected`/`expired` OR attempt status is anything other than `in_progress` → stop video tracks, stop MediaRecorder, clear upload interval, show a green "Test ended — you can close this tab" screen.
- The `upload` and `chunk-upload` 410 responses already exist; phone treats them the same way (defensive — covers the case where the poll hasn't fired yet).
- Replace `pagehide` `sendBeacon` with a `pagehide` **and** `visibilitychange→hidden` beacon, so backgrounded tabs also disconnect.

### Edge function
- New action `close-attempt` (POST, requires bearer JWT). Validates `auth.uid()` owns the attempt (or is org staff), then:
  - `update assessment_side_camera_pairings set status='closed', closed_at=now() where attempt_id=$1 and status in ('pending','paired')`
  - inserts an `attempt_events` row `kind='side_eye_closed'`.
- `status` action: also return `attemptStatus` (look up the attempt). No token-owner check needed beyond the pairing match we already do.
- `upload`/`chunk-upload`: keep current 410 behaviour but extend `pairingFresh` to reject `'closed'` too.

### Desktop player
- `doSubmit()` success path → `supabase.functions.invoke('assessment-sidecam?action=close-attempt', { body: { attemptId } })` (fire-and-forget, no await blocking the UI).
- Add a window `pagehide` / `beforeunload` listener that fires `navigator.sendBeacon` to the same close-attempt URL with the attempt id, so abnormal exits also tear down the phone.
- Also call it once when the existing "attempt status moved out of in_progress" effect fires (covers admin-cancel, timeout-on-server, etc.).

### Preflight pairing widget
- `SideCameraPairing` already shows "Generate new pairing" when `disconnected`/`expired`/stale. Add `'closed'` to the same bucket so a freshly-arrived candidate whose previous attempt was submitted from another tab can immediately scan a new QR.

### Migration
- `alter table public.assessment_side_camera_pairings drop constraint … add constraint check (status in ('pending','paired','disconnected','expired','closed'))`.
- Add `closed_at timestamptz` column.

## Out of scope
- Contest `SideEye*` flow (separate code path, separate plan).
- Replaying side-cam chunks; we only stop new ones.
- Background cron sweep of stale pairings — phone-side poll + `pagehide` beacon are enough for the end-of-test guarantee.
