## Goal

You already have the strongest web-based stack I can reasonably build: Trust Gate, Zero-Trust Watcher, Violation Engine, hard auto-terminate, Side Eye phone-cam, hash-chained evidence, Integrity Queue, AI-text classifier, keystroke biometric. The realistic remaining cheating vectors are:

1. **Pre-built answer banks** (someone else solved the paper, candidate memorizes / pastes).
2. **Earpiece + accomplice** reading questions aloud.
3. **Second device just out of side-cam view** (smartwatch, tablet under desk, mirror reflection).
4. **Mid-test identity swap** (someone else physically sits down).
5. **Replay / network tampering** (clock skew, request replay, modified client).
6. **Post-hoc dispute** ("that wasn't me / the video is fake").

This plan adds six targeted layers, each closing one of those vectors. Nothing here is a rewrite — every layer plugs into the existing `contest-violation-engine` sink.

---

## Layer 1 — Question randomization + per-candidate watermarking

- **Per-candidate question shuffle** from a 3-5x oversized pool, with options also shuffled. Kills the "leaked paper" attack.
- **Invisible per-candidate watermark** rendered behind every question (zero-width chars in the DOM + faint canvas overlay encoding `session_id`). If a screenshot ever surfaces online, we can prove who leaked it.
- **Right-click / print / select-all** already partially blocked — extend to block the Print Screen key on focus-loss and log it as `critical`.

New: `contest-question-allocator` edge function (deterministic per-session shuffle, server-side answer key).

---

## Layer 2 — Continuous voice-print + ambient-audio forensics

Extends the existing `contest-audio-analyze`:

- **Enrolled voice baseline** captured during the Trust Gate (candidate reads a 10-sec sentence). Mid-test mic chunks are compared; a second distinct voice → `critical`.
- **Earpiece-leak detection**: high-pass filter looks for the tinny 4-8 kHz signature of a phone earpiece bleeding into the room mic.
- **Whisper / sub-vocal coaching**: low-energy speech segments with consistent cadence → `high`.
- **Question read-aloud detection**: candidate's own voice + simultaneous keystrokes on free-text → flagged (people don't normally narrate while typing).

New: `contest-voiceprint-verify` edge function (enroll + verify embeddings).

---

## Layer 3 — Active liveness, not just face match

Today's identity check is a still-frame match. Add:

- **Random challenge prompts** every 5 min: "look left", "blink twice", "show your right ear" — micro-action verified by Gemini vision. Defeats photo-on-stand attacks and pre-recorded video loops.
- **Depth/parallax check** on enrollment: candidate slowly turns head 15°, we sample 5 frames and check geometric consistency (defeats printed-photo + monitor-replay).
- **Hand-in-frame requirement**: at least one hand visible on keyboard every 30 s, otherwise warn → terminate.

Reuses `contest-identity-verify` with a new `mode: "liveness"`.

---

## Layer 4 — Side Eye AI room sweep, upgraded

Side Eye already streams a phone-cam. Add stricter rules:

- **Mandatory pre-test 360° room sweep** (15-sec slow pan) → Gemini vision must confirm: no second monitor, no second person, no phone other than the paired one, no notes/whiteboards/sticky notes, ceiling/door visible (no one hiding above the frame).
- **Mid-test occlusion detection**: if the side-cam view is suddenly blocked (hand, towel, change in lighting) → `critical`.
- **Phone-must-stay-still gyroscope check**: phone reports accelerometer/gyro every 5 s; movement above threshold → warn (someone is repositioning the camera to hide something).

Extends existing `contest-sideeye-frame-analyze` + new gyro channel on the pairing WebRTC datachannel.

---

## Layer 5 — Tamper-proof transport & replay defense

Closes the "modified client" and "post-hoc dispute" vectors:

- **Per-session ephemeral signing key** issued at Trust Gate. Every answer submission, every violation event, every webcam frame upload is HMAC-signed client-side; server rejects unsigned or replayed payloads.
- **Strict-monotonic event clock**: events carry a server-issued nonce + sequence; gaps or out-of-order → `critical`.
- **Subresource Integrity + CSP** lockdown on the player route (no eval, no inline scripts, hash-pinned bundles) so injected extensions can't silently swap the proctoring code.
- **Client-attestation token** rotated every 60 s; missing 2 rotations in a row → terminate.

New: `contest-session-sign` (issue/rotate key) + middleware on every existing contest function to verify the HMAC.

---

## Layer 6 — Public, independently-verifiable evidence packet

Makes disputes impossible to win without actual evidence:

- On termination, the existing `contest-integrity-report-generate` is extended to emit a **signed ZIP**: timeline JSON, all webcam/side-cam thumbnails, hash-chain proof, admin verdict, public token. Hash of the ZIP is anchored to a public timestamping service (OpenTimestamps / Bitcoin merkle).
- The existing `PublicVerifyReport` page re-walks the hash chain client-side against the anchor — anyone (recruiter, court, the candidate themselves) can verify it's untampered.
- Candidate gets a one-shot dispute window (48 h) with a structured form; the engine attaches the dispute to the same chain.

Reuses `contest-sideeye-verify-chain` + new `contest-evidence-anchor` edge function.

---

## What this stack defeats

| Attack | Layer that catches it |
|---|---|
| Leaked paper / answer bank | 1 — randomization + watermark |
| Accomplice reading questions | 2 — voiceprint + earpiece detector |
| Hidden second device | 4 — 360° sweep + occlusion |
| Mid-test swap | 3 — active liveness challenges |
| Modified player / replay | 5 — signed transport, attestation |
| "Wasn't me" denial later | 6 — anchored signed evidence ZIP |

Combined with the existing hard auto-terminate, the **practical** cheating probability for a non-state-actor candidate drops to near-zero: any single trip = session ends, evidence is sealed, and the report is publicly verifiable.

---

## New surface area (summary)

**Edge functions (5 new):** `contest-question-allocator`, `contest-voiceprint-verify`, `contest-session-sign`, `contest-evidence-anchor`, plus extended `contest-identity-verify` (liveness mode) and `contest-sideeye-frame-analyze` (sweep mode).

**Tables (3 new):** `contest_voiceprint_baselines`, `contest_session_keys`, `contest_evidence_anchors`.

**UI:** Trust Gate gets two new steps (voice enrollment, 360° sweep). Player gets random-liveness prompt overlay. Admin Integrity Queue gets a "Download signed evidence" button.

**Out of scope (unchanged):** native lockdown browser, live human proctors, mobile-only candidate flow. Those remain the only further upgrades possible after this plan.

---

## Honest caveat

A determined cheater with a hidden in-ear coach and a memorized question pool is *still* theoretically possible — no web stack reaches mathematical zero. But after this plan, every practical attack either (a) trips a `critical` signal and ends the session, or (b) leaves cryptographically-anchored evidence that survives any dispute. That is as close to zero as a browser-based system can get.

---

## Build order if you approve

I'd ship in this order to maximize impact per turn:

1. **Layer 5** (signed transport) — foundational, every other layer depends on it.
2. **Layer 1** (randomization + watermark) — biggest single deterrent, smallest code.
3. **Layer 3** (active liveness) — closes the most common real-world attack.
4. **Layer 2** (voiceprint).
5. **Layer 4** (room sweep upgrades).
6. **Layer 6** (anchored evidence packet).

Reply **yes** to start with Layer 5, or name a layer to start elsewhere.