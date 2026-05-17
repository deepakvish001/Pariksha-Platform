## Goal

On the Manage Assessment page, let proctors watch each in-progress candidate live across three feeds:

1. **First eye** — laptop webcam
2. **Second eye** — shared screen
3. **Third eye** — paired mobile side camera

Today only the side camera streams live (WebRTC). Webcam and screen exist on the candidate side only as periodic snapshots uploaded to storage. We need to add live WebRTC publishing for those two and a viewer wall on Manage.

## What gets built

### 1. Generic WebRTC stream hook
Refactor `src/hooks/useSideEyeSignalling.ts` into a reusable `useWebrtcStream` (keep `useSideEyeSignalling` as a thin wrapper to avoid touching contest code).

- Accepts a `channelId` (any string) and `role: "publisher" | "viewer"` plus optional `localStream`.
- Same Supabase Realtime broadcast signalling, ICE fetch, reconnect/backoff, and quality stats.
- Channel naming convention: `proctor:{attemptId}:{kind}` where kind ∈ `webcam | screen | sideeye`.

### 2. Candidate side — publish webcam + screen
In `src/assessments/pages/Player.tsx` (and/or `useProctoring` / `useDisplayCapture`):

- When an attempt is in progress and the candidate already has webcam/display streams (these are already acquired today for snapshots), instantiate two `useWebrtcStream` publishers using those existing `MediaStream` objects.
- No new permission prompts (re-use streams already in memory).
- Gate behind the assessment's existing proctoring config flags (webcam_required / screen_required) so we don't publish when disabled.
- Add lightweight `attempt_events` markers (`webcam_live_start`, `screen_live_start`) for the activity feed.

### 3. Admin viewer — `LiveProctorWall` component
New file `src/b2b/components/LiveProctorWall.tsx`:

- Props: `attempts: { attempt_id, candidate_name, side_session_id? }[]`.
- For each attempt renders a row of three tiles using a small `LiveStreamTile` (mirrors `SideEyeTile` UX: aspect-video, LIVE/WAITING badge, source icon, candidate label).
- Tiles: webcam, screen, side-camera. Side tile keeps current `SideEyeTile` behaviour (uses `contest_side_camera_sessions.id`); for assessments we'll pass the attempt's paired session id resolved from the existing pairing flow, or fall back to `proctor:{attemptId}:sideeye` once the player publishes side-eye through the new generic channel.
- Empty state ("Waiting for stream…") when no offer received within N seconds.
- Pause/mute toggle per tile to save bandwidth; only mount RTCPeerConnection when tile is visible (IntersectionObserver) so 20+ candidates don't melt the browser.

### 4. Integrate into Manage page
In `src/b2b/pages/assessments/Manage.tsx`:

- New collapsible section "Live view (three-eye)" above the participants table, visible only when `useCanProctor` is true.
- Source list = participants where `status === "in_progress"` from `useLiveParticipants`.
- Default collapsed; show count badge of currently-live candidates.
- Inside `ParticipantDetailDrawer`, add a single-candidate version of the three tiles at the top for focused review (keeps existing `AttemptProctoringPanel` snapshot history below).

### 5. Permissions & safety
- Viewer mount gated by `useCanProctor` (owner / admin / proctor roles) — same gate as snapshots panel.
- Publisher gated by the assessment proctoring config; if a candidate disables a stream mid-attempt, viewer tile reverts to WAITING and we log a `*_lost` event (already covered by existing handlers).
- No new DB tables or storage — pure peer-to-peer signalling via existing Realtime broadcast.

## Files touched

- **New:** `src/hooks/useWebrtcStream.ts`, `src/b2b/components/LiveProctorWall.tsx`, `src/b2b/components/LiveStreamTile.tsx`
- **Edited:** `src/hooks/useSideEyeSignalling.ts` (becomes wrapper), `src/assessments/pages/Player.tsx` (publish webcam + screen), `src/b2b/pages/assessments/Manage.tsx` (wall section), `src/b2b/components/ParticipantDetailDrawer.tsx` (per-candidate tiles)

## Out of scope

- Recording the live streams (snapshots already provide forensic record).
- Two-way audio / proctor-to-candidate intervention.
- Changes to the contest side-eye console (left untouched via the wrapper).

## Open question

The side-eye third eye today is wired through `contest_side_camera_sessions` (contest flow). For assessments, the existing player pairing already establishes a session id — confirm we pass that same session id through to the new wall, or migrate assessments to the new generic `proctor:{attemptId}:sideeye` channel. I'll default to **reusing the existing session id** (no migration) unless you want the unified naming.
