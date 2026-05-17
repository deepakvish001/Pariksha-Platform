## Goal

Continuously record every candidate's three eyes — webcam, screen, and side-camera — from attempt start to submit, upload in resilient ~165 s chunks, and review them later on the candidate detail page in a **synced 3-track timeline player** with event markers.

This replaces the current manual "Record" button (which only works while a proctor is watching the live wall) with always-on, candidate/phone-side recording.

---

## Architecture

```text
Candidate browser (Player.tsx)        Phone (SideCamera.tsx)
  ├─ webcam MediaStream  ──┐            └─ rear/front cam MediaStream
  └─ screen MediaStream  ──┤                       │
                           ▼                       ▼
            useChunkedRecorder (new shared hook, 165 s chunks, 720p / ~800 kbps)
                           │
                           ▼
   PUT → supabase.storage('assessment-proctor')
        path: {attempt_id}/sessions/{kind}/{session_id}/{seq}.webm
                           │
                           ▼
   INSERT row → assessment_proctor_session_chunks
        (attempt_id, kind, session_id, seq, started_at, ended_at,
         duration_ms, size_bytes, storage_path)

Proctor (AttemptDetail → new "Session replay" tab)
  └─ useSessionTimeline()  ─► loads all chunks for attempt
       ├─ builds per-eye timeline (offset-from-attempt-start)
       └─ <SessionTimelinePlayer />  3 stacked <video> tags + shared scrubber
                                     + event-marker rail (attempt_events,
                                       proctor_findings)
```

---

## Data model

New table (migration):

- `assessment_proctor_session_chunks`
  - `id uuid pk`
  - `attempt_id uuid` (fk → assessment_attempts)
  - `session_id uuid` — one per (attempt, kind, page-load), used to stitch resumed sessions cleanly
  - `kind text check (kind in ('webcam','screen','sideeye'))`
  - `seq int` — monotonic chunk index within session
  - `started_at timestamptz`, `ended_at timestamptz`, `duration_ms int`
  - `size_bytes bigint`, `mime text`, `storage_path text`
  - `uploaded_by uuid`, `created_at timestamptz default now()`
  - unique (`attempt_id`, `kind`, `session_id`, `seq`)
  - RLS: candidate can insert rows for their own `attempt_id`; org owners / admins / proctors can select.
- Auto-purge: extend the existing `purge-proctoring-data` edge function to honor the same retention setting for the new table + its storage paths.

The existing `assessment_proctor_recordings` table stays in place for proctor-side manual clips; the new table is the authoritative continuous session source.

---

## Capture (candidate side)

New shared hook `src/hooks/useChunkedRecorder.ts`:

- Inputs: `stream`, `attemptId`, `kind`, `enabled`, `chunkMs = 165_000`, `bitsPerSecond = 800_000`, `width = 1280`.
- Picks supported MIME via existing helper (`video/webm;codecs=vp9,opus` → vp8 → mp4 fallback).
- Each chunk = a fresh `MediaRecorder` instance; on `stop`, uploads to storage and inserts the row, then immediately starts the next recorder. This guarantees each chunk is independently playable (whole-segment webm), not a fragment.
- Retry queue in `IndexedDB` for offline / failed uploads; flushes on `online` event and on page show.
- Auto-stops on `stream` end, `enabled=false`, page unload (with `navigator.sendBeacon` fallback for the trailing row).

Wire-up in `src/assessments/pages/Player.tsx`:

- `useChunkedRecorder({ stream: camStream, attemptId, kind: 'webcam', enabled: proctoringEnabled && lockdownReady })`
- Same for `screenStream` with `kind: 'screen'`.

Wire-up in `src/assessments/pages/SideCamera.tsx`:

- Add same hook against the phone's `streamRef.current` with `kind: 'sideeye'`, gated on `status === 'streaming'`.
- Keep the existing periodic still-frame upload for AI review (cheap thumbnails); they complement the video.

Proctoring config (`AssessmentProctoringConfig.tsx`): add a single toggle **"Record full session (all eyes)"** defaulting on for new assessments; persisted in the existing `proctoring_config` JSON. Hook reads this flag.

---

## Review (proctor side)

New tab on `src/b2b/pages/assessments/AttemptDetail.tsx` called **"Session replay"** (sits next to the current proctoring evidence section).

New components:

- `src/b2b/hooks/useSessionChunks.ts` — loads all `session_chunks` for the attempt, groups by kind, sorts by `started_at`, computes per-eye `offset_ms` from the attempt's `started_at`, signs URLs in batches of 80.
- `src/b2b/components/SessionTimelinePlayer.tsx`:
  - Three stacked `<video>` elements (webcam · screen · sideeye), each with its own playlist of signed chunk URLs.
  - Shared transport bar: play/pause, ±10 s, 1× / 1.5× / 2×, time display (`HH:MM:SS` of attempt + wall-clock).
  - One canonical "playhead time" in ms-from-attempt-start. On scrub, each video seeks to the correct chunk and offset within it (chunk lookup table). When a chunk ends, advances to the next; gaps (e.g. side-cam reconnect) are rendered as a dimmed "no signal" overlay on that eye while playback continues for the others.
  - Auto-syncs the other two videos when one buffers (pauses all until ready) so the three tracks never drift.
  - Marker rail under the scrubber merges `attempt_events` (tab_switch, focus_loss, screenshare_lost, device_change, typing_burst) and `assessment_proctor_findings` (severity-colored dots). Click a marker → seek + flash the affected eye.
- "Download session" button reuses the existing ZIP export, extended to include the new chunks under `sessions/{kind}/`.

The existing inline gallery + lightbox is unchanged and stays as the "snapshots & clips" view.

---

## Technical notes

- **Chunk = full WebM**, not fMP4 fragment — each file is independently playable, so a crashed upload only loses ~165 s and review still works.
- Storage path convention `{attempt_id}/sessions/{kind}/{session_id}/{seq.padStart(5,'0')}.webm` keeps lexicographic order = playback order.
- The candidate-side hook holds **at most one** in-flight upload per kind to keep bandwidth bounded; the rest queue in IndexedDB.
- Session player only fetches signed URLs for chunks whose timestamp is within the current ±60 s window (lazy) to keep the page responsive for long attempts.
- All new UI follows the existing semantic-token aesthetic (no raw colors).

---

## Files

New
- `supabase/migrations/<ts>_create_session_chunks.sql`
- `src/hooks/useChunkedRecorder.ts`
- `src/b2b/hooks/useSessionChunks.ts`
- `src/b2b/components/SessionTimelinePlayer.tsx`

Edited
- `src/assessments/pages/Player.tsx` — invoke recorder for webcam + screen
- `src/assessments/pages/SideCamera.tsx` — invoke recorder for sideeye
- `src/b2b/components/AssessmentProctoringConfig.tsx` — add "Record full session" toggle
- `src/b2b/pages/assessments/AttemptDetail.tsx` — add "Session replay" tab
- `src/b2b/components/AttemptProctoringPanel.tsx` — extend ZIP export to include session chunks
- `supabase/functions/purge-proctoring-data/index.ts` — honor retention for the new table

---

## Out of scope (call out, don't build)

- Audio capture from screen-share (browser support is inconsistent; webcam audio already lives on the webcam track when enabled).
- Server-side transcoding to mp4 — playback is webm-native in all supported browsers.
- AI review of session video (the existing snapshot-review flow remains the AI surface; can be extended later to sample frames from chunks).
