# Batch E — Second Eye (Phone-as-Side-Camera)

## Honest framing first

You're right about the three remaining holes. Here's what Second Eye actually closes vs. what no software can ever fully close:

**Second Eye reliably catches:**
- A second phone/tablet/monitor pointed at the screen (visible in side-angle frame).
- A second person in the room out of webcam frame (visible from 1–2 m side view).
- Looking down at notes/cheat-sheets on the desk that the front webcam misses.
- Earpieces / hidden microphones (visible from the side).

**Second Eye still cannot stop:**
- A pre-memorized solution typed naturally (no software can — this is why we have **code provenance + viva queue + solve-time analysis** from Batch C/D).
- A perfectly placed mirror/reflection trick if the candidate is technically sophisticated.
- Collusion when the phone itself is hijacked (we mitigate via device-binding + heartbeat, but not 100%).

So Second Eye is a **strong deterrent + evidence layer**, not a silver bullet. It pairs with the existing layers.

---

## What we're building

A "pair your phone as Side Camera" flow during preflight:
1. Candidate scans a QR code with their phone → opens `/contests/sideeye/:pairingToken` (no app install).
2. Phone requests camera + mic, binds to the session, starts a **WebRTC live stream** to the laptop and a parallel **MediaRecorder upload** to storage (chunked, every 10 s).
3. Admin proctor sees the side-camera tile next to the front webcam in `AdminContestProctor` (live grid).
4. AI sweeps side-camera frames every 15 s for: extra person, second screen/phone, looking-away patterns, empty chair (candidate left).
5. Loss of side stream for >30 s → auto-flag + optional auto-pause of contest timer.

---

## File changes

**New DB migration** (`contest_side_camera_*` tables):
- `contest_side_camera_pairings` — pairing_token, session_id, status (pending/paired/active/lost), device_user_agent, paired_at, last_heartbeat_at.
- `contest_side_camera_frames` — session_id, captured_at, storage_path, ai_summary jsonb, severity.
- `contest_side_camera_recordings` — session_id, storage_path, started_at, ended_at, byte_size.
- New storage bucket `contest-side-camera` (private, RLS: owner + admin read).

**New edge functions:**
- `contest-sideeye-pair` — issues short-lived pairing token (HMAC, 5 min TTL), validates session ownership.
- `contest-sideeye-claim` — phone POSTs token → marks pairing active, binds device fingerprint.
- `contest-sideeye-frame-analyze` — Gemini 2.5 Flash vision: detects extra person, second device, candidate-absent, looking-away. Writes `contest_side_camera_frames` + raises `contest_proctor_findings` on severity ≥ medium.
- `contest-sideeye-heartbeat` — phone pings every 10 s; gap >30 s → finding + optional timer pause flag.

**New components / pages:**
- `src/components/contests/SideEyePairingStep.tsx` — QR code (qrcode.react), pairing status, "skip" disabled if contest mandates it.
- `src/pages/contests/SideEyeMobile.tsx` — phone-side page, getUserMedia(env-facing camera), MediaRecorder chunked upload, WebRTC offer to laptop via Supabase Realtime signalling, heartbeat loop, screen-on wake-lock.
- `src/components/contests/SideEyeTile.tsx` — laptop-side video element receiving WebRTC stream + status badge.
- `src/hooks/useSideEyeSignalling.ts` — WebRTC peer connection over Supabase Realtime broadcast channel.

**Edits:**
- `PreflightChecksStep.tsx` — insert SideEye pairing as required step (configurable per-contest).
- `AdminContestProctor.tsx` — add live grid showing side-camera tiles per session, "playback" link to recording.
- `AdminSessionForensics.tsx` — add Side Camera section: recording playback + frame-by-frame AI flags.
- `contest_sessions` (migration) — add `side_camera_required boolean default true`, `side_camera_status text`.

**Realtime channel:** `sideeye:{session_id}` for SDP/ICE signalling between phone and laptop.

---

## Behavior decisions (calling them out — tell me if you want different)

- **Mandatory by default** for new contests; toggle per contest in `ContestEditor`.
- **No phone install required** — pure web (works on Safari iOS 14.3+ and Chrome Android).
- **Recording stored 30 days** then auto-purged (matches existing screen recording retention).
- **Phone disconnect grace = 30 s** before flag; >2 min = auto-pause timer + admin alert.
- **AI frame sample = every 15 s** (cost balance; can tune).
- **Battery warning** shown on phone if <20%.

---

## What I'm NOT building (explicitly)

- Native iOS/Android apps (web is enough; install friction kills participation).
- Real-time on-device person counting on phone (battery drain; we do it server-side).
- Forcing two phones (overkill; one side angle catches >90% of the gap).

---

Approve and I'll implement in one batch. Or tell me to adjust any of the behavior decisions above first.
