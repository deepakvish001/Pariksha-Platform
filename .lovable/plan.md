## Second Eye — Production Hardening Plan

The current Second Eye flow works end-to-end on a happy path. Below are the **six concrete gaps** that block real-world, daily production use, and what to build for each.

---

### 1. Reliable connectivity on real networks (TURN relay)

**Problem.** Today we only configure public STUN servers. ~15-20% of candidates (corporate Wi-Fi, mobile carrier NATs, hotel networks) cannot establish a peer connection without a TURN relay, so their phone never appears in the admin grid.

**What to build:**
- Add a `contest-sideeye-ice` edge function that returns short-lived (1 hour) TURN credentials. Use the connector for a managed TURN provider (Cloudflare Calls, Twilio, or Metered) — the existing `secrets--add_secret` flow handles the API key.
- Update `useSideEyeSignalling.ts` to fetch ICE servers from this function on connect, with the existing STUN servers as fallback.
- Audit-log which transport was used (`host` / `srflx` / `relay`) per connection so we can see at a glance how many candidates needed the relay.

---

### 2. Enforcement: candidate cannot start the contest without Second Eye

**Problem.** `side_camera_required` and `side_camera_status` columns exist on `contest_sessions` but are never read. A candidate can skip pairing and still submit answers.

**What to build:**
- Server-side guard in `submit-code`, `submit-sql`, and any answer-submission edge function: if the contest's `side_camera_required = true` and the session's `side_camera_status != 'connected'` for more than the configured grace window, reject submissions with `412 Precondition Failed`.
- Heartbeat-driven status: `contest-sideeye-heartbeat` already pings; add a small DB function `sideeye_sweep_stale_status()` (cron every minute) that flips sessions to `disconnected` after 30s of silence and emits an admin notification.
- In `SecureContestGate`, block the "Start contest" button until pairing reports `connected` at least once. After that, brief drops show a banner but don't stop the test.

---

### 3. Mobile resilience: keep the phone alive for a 2-3 hour contest

**Problem.** iOS Safari and Android Chrome aggressively throttle a backgrounded tab — the camera stops, recording stops, WebRTC dies. The candidate doesn't notice until the admin pings them.

**What to build:**
- `SideEyeMobile.tsx`: enable Wake Lock API (`navigator.wakeLock.request('screen')`) and re-acquire on `visibilitychange`.
- Switch recording chunks from `MediaRecorder` keep-alive timer to `setInterval` that explicitly calls `requestData()` every 10s, so chunks still flush if the timer drifts.
- Background-detect: if `document.hidden` for >5s, pause uploads, surface a big "RETURN TO THIS TAB" banner with vibration (`navigator.vibrate`), and emit a `mobile_backgrounded` audit event so the admin sees it immediately.
- Battery API: when battery <15%, surface a warning to the candidate and notify the admin (`mobile_low_battery` event).
- Add an explicit "I lost connection" recovery flow: if the WebRTC peer fails three reconnect attempts, the page automatically re-enters pairing mode using the same session token (no new QR scan needed).

---

### 4. Live admin alerts that actually reach a human

**Problem.** Anomaly notifications land in the in-app notification table. If the admin isn't on the proctoring tab, they miss it.

**What to build:**
- Wire SideEye flag/fatal findings into the existing `usePushNotifications` web push subscription so admins get an OS-level toast even when the tab is in the background.
- Add a minimal "Live anomaly ticker" floating panel on `/admin/contests/:id/proctor` that uses the existing realtime channel and plays a short beep + flashes red when a `secondary_device` / `extra_person` / `candidate_absent` finding arrives. Mute toggle persisted per admin in `localStorage`.
- Optional escalation channel (off by default): if `recipient_user_ids` is set and Resend is configured, send an email digest every 60s (not per finding) for high-severity events only — avoids inbox flooding.

---

### 5. Tamper-evident evidence (integrity for HR / legal)

**Problem.** Recordings and frames sit in storage. If a candidate disputes a flag, we have no proof the file wasn't edited after the fact.

**What to build:**
- On every recording chunk upload, compute SHA-256 client-side and store it on the `contest_side_camera_recordings` row alongside the storage path. Same for frames.
- Add an append-only `sideeye_evidence_chain` table: each row references the prior row's hash + the new file hash, forming a hash chain per session. This is what gets cited in the integrity report.
- Extend `contest-sideeye-report` edge function to:
  - Walk the chain and re-verify each hash against the stored object.
  - Embed signed URLs valid for 7 days for each frame and recording.
  - Render to PDF (not just JSON) using a server-side template so HR can attach it directly to a case file. Keep the JSON export as well.

---

### 6. Operational controls the admin needs day-to-day

Small but high-value additions for the SideEye tab in `AdminContestProctor`:

- **"Pause / resume monitoring"** per session — useful when a candidate has a legitimate restroom break. Records who paused and why; resumes cleanly with a fresh chain entry.
- **"Re-pair phone"** action that invalidates the current pairing token and shows a fresh QR for the candidate to re-scan, without restarting their contest session.
- **Bandwidth/quality indicator per tile** — packet-loss, bitrate, resolution — pulled from `RTCPeerConnection.getStats()` and surfaced as a small color dot on each `SideEyeTile`.
- **Bulk actions on the audit log table**: filter to a window, then "Mark reviewed" or "Add note" against many events at once. Adds two columns (`reviewed_at`, `reviewer_note`) to `contest_side_camera_audit_logs`.

---

### Out of scope for this batch (deliberate)

- A native iOS/Android app (browser-based stays our differentiator — no install).
- Realtime on-device person counting (handled by the 15-second AI sweep; doing it on-device would drain battery).
- Replacing WebRTC with HLS pull (WebRTC's sub-second latency is the whole point for live proctoring).

---

### Technical specifics

**New tables / columns**
- `contest_sessions`: enforce read of `side_camera_required` / `side_camera_status` (no schema change).
- `contest_side_camera_recordings`: add `sha256 text`, `prev_hash text`.
- `contest_side_camera_frames`: add `sha256 text`.
- New `sideeye_evidence_chain` (`session_id`, `seq int`, `kind`, `object_path`, `sha256`, `prev_sha256`, `created_at`), unique `(session_id, seq)`.
- `contest_side_camera_audit_logs`: add `reviewed_at timestamptz`, `reviewer_note text`, `reviewer_id uuid`.
- New `sideeye_session_pauses` (`session_id`, `paused_by`, `reason`, `paused_at`, `resumed_at`).

**New edge functions**
- `contest-sideeye-ice` — returns TURN credentials.
- `contest-sideeye-pause` / `contest-sideeye-resume` — admin-gated.
- `contest-sideeye-repair` — invalidates pairing token + emits new one.

**Updated edge functions**
- `contest-sideeye-frame-analyze` — write hash + chain entry.
- `contest-sideeye-heartbeat` — return current session status, drive stale-sweep.
- `contest-sideeye-report` — verify chain, return PDF + JSON.
- `submit-code`, `submit-sql` — enforcement gate.

**Cron**
- `sideeye-sweep-stale-status` — every minute.

**Frontend**
- `useSideEyeSignalling.ts` — fetch ICE, log selected candidate-pair type.
- `SideEyeMobile.tsx` — Wake Lock, background warning, low-battery, auto re-pair.
- `SideEyeTile.tsx` — connection-quality dot.
- `AdminContestProctor.tsx` — live anomaly ticker, pause/resume/re-pair actions.
- `SideEyeScanTimeline.tsx` — bulk review, reviewer notes.

**Secrets needed (one new)**
- TURN provider API key. I will request this via `add_secret` once you confirm the provider — Cloudflare Calls is recommended (cheap, generous free tier, no per-minute billing surprise).

---

### Suggested rollout order

1. **TURN + enforcement** (sections 1 + 2) — without these, the rest doesn't matter; candidates either can't connect or can bypass entirely.
2. **Mobile resilience** (section 3) — the single biggest source of false-positive "candidate disappeared" flags today.
3. **Live admin alerts + ops controls** (sections 4 + 6) — quality-of-life for the proctor.
4. **Evidence chain + PDF reports** (section 5) — needed before the first real dispute, not before the first real contest.

Approve this plan and I'll start with batch 1 (TURN + enforcement). I'll ask for the TURN provider choice before requesting the secret.
