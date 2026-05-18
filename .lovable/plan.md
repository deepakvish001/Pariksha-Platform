## Goal

Push assessment cheating probability as close to zero as physically possible, focusing on **impersonation**, **external/AI help**, and **second-screen / VM / remote desktop**. Enforcement is **hard auto-terminate**, and every flagged attempt flows through **AI summary → admin review → public verifiable report**.

The project already has a strong base (Side Eye, lockdown gate, display capture, device lock, typing analytics, identity-verify, room-scan, viva-scan, audio-analyze, cross-similarity, hash-chain). This plan **closes the remaining gaps** and **wires everything into one zero-trust gate** — not a rewrite.

---

## 1. Pre-test "Trust Gate" (block start, not warn)

A single `TrustGate` step the candidate must pass before the paper unlocks. Failing any check = cannot start.

- **Photo ID + live selfie match** — candidate uploads gov ID once; capture 3-frame live selfie; `contest-identity-verify` (already exists) returns a match score; threshold gates entry. Re-match every 10 min during the test (silent webcam frame vs stored embedding).
- **Side Eye mandatory** — pairing screen blocks Start until phone stream is `LIVE` ≥ 30 s and side-cam shows exactly one person + workspace clear (calls `contest-room-scan-analyze`).
- **Single monitor only** — `window.screen.isExtended` + `getScreenDetails()` Window Management API; if >1 display → block.
- **Anti-VM / anti-RDP** — heuristics: virtual GPU strings via WebGL `UNMASKED_RENDERER_WEBGL` (VMware, VirtualBox, Parallels, llvmpipe), suspicious user-agent, RDP-style framerate caps, Parsec/AnyDesk hostnames in mDNS-free checks, low-precision performance.now, missing audio output devices. New edge function `contest-environment-attest` signs the attestation server-side.
- **Browser hardening probe** — devtools-open detector (debugger-timing trap), automation flags (`navigator.webdriver`, headless UA), extension fingerprint check (known cheat extensions: ChatGPT sidebar, Honey-style injectors).
- **Network probe** — VPN/Tor/datacenter IP check via IP intelligence (ipinfo/abuseipdb) in `contest-environment-attest`.

All probe results stored to a new `contest_trust_attestations` table, hash-chained into the existing evidence chain.

---

## 2. Continuous "Zero-Trust Watcher" during the test

A single `useZeroTrustWatcher` hook orchestrates every continuous signal and pushes events to `contest-violation-engine` (new) instead of each component logging independently.

| Signal | Source | New / existing |
|---|---|---|
| Face presence + identity drift | webcam frame → `contest-identity-verify` every 30 s | existing fn, new cadence |
| Second person / phone on desk | side-cam → `contest-sideeye-frame-analyze` | existing |
| Voice / second voice | mic → `contest-audio-analyze` (already exists) | existing, make mandatory |
| Keystroke biometric drift | `useTypingAnalytics` → new `contest-keystroke-verify` compares to enrolled baseline taken in first 60 s | new fn |
| Paste burst / unnatural code-fill | typing analytics + answer diff | existing data, new rule |
| Tab/window blur, fullscreen exit, devtools open | `useDeviceLock` | existing, raise severity |
| Display added mid-test | Window Management `screens.onchange` | new |
| Network egress to LLM domains | DNS-prefetch probe + report-only CSP violation reports | new |
| Free-text AI-generated answer | post-submit + mid-test sampling via `contest-ai-text-classifier` (Gemini grader) | new fn |
| Code similarity to LLM output / web | existing `contest-cross-similarity` + `contest-similarity-scan` | existing, run live not only post |

---

## 3. Violation engine + hard auto-terminate

New edge function `contest-violation-engine`:

- Accepts a typed event `{ session_id, category, severity, evidence_ref }`.
- Looks up the contest's policy (configurable per contest, defaults to **hard**).
- Maintains a per-session risk score; **any `severity = critical`** (e.g. face mismatch, second person, second monitor, VM detected, RDP detected, devtools opened) → immediate **`terminate`**.
- Termination flow: locks `contest_sessions.terminated_at`, force-submits whatever answers exist, pushes a Realtime kill-signal that the player listens for and immediately renders a "Session terminated — under review" lockout.
- Every action logged + hash-chained.

UI: candidate sees the existing `ViolationBanner` for warnings (graduated levels still available for soft contests), but on terminate they hit a non-dismissable full-screen lockout.

---

## 4. Reviewer pipeline: AI report → admin review → public verifiable report

Wire into the existing `contest-integrity-report-generate` + `contest-sideeye-verify-chain` + `PublicVerifyReport` / `PublicIntegrityReport` pages.

1. **Auto** on terminate (or admin-requested) → `contest-integrity-report-generate` builds:
   - Timeline of every flagged event with thumbnails (webcam, side-cam, screen).
   - Gemini-written narrative: what happened, severity, suggested verdict (confirm / dispute / inconclusive).
   - Aggregate risk score breakdown.
2. **Admin review** in `AdminSideEyeConsole` → new "Integrity Queue" tab: pending reports, one-click approve/reject + reason. Approval triggers `contest-sideeye-verify-chain` to anchor the final hash.
3. **Public verifiable report** — on admin approval, the existing `PublicVerifyReport` page becomes shareable with a signed link recruiters can independently verify (hash chain re-walked client-side against on-chain anchor).

---

## 5. New DB tables (migration)

- `contest_trust_attestations` — pre-test gate result snapshot per attempt (env probes, ID match, single-monitor, VM check, IP rep).
- `contest_keystroke_baselines` — enrolled keystroke biometric per attempt.
- `contest_violation_events` — append-only typed event log feeding the engine (separate from existing audit logs to keep schema strict).
- `contest_integrity_verdicts` — admin decision + public-report token + final hash anchor.
- `contest_settings.enforcement_mode` column added: `soft | graduated | hard` (default `hard` for new contests).

All with strict RLS: candidate sees only their own rows; admin sees rows for institutions they manage; service role writes.

---

## 6. New edge functions

- `contest-environment-attest` — server-signed environment probe (IP rep, attestation token).
- `contest-keystroke-verify` — enroll + verify keystroke biometric.
- `contest-ai-text-classifier` — Gemini classifier ("how likely AI-written") for free-text answers, sampled mid-test and again post-submit.
- `contest-violation-engine` — single sink that decides warn / pause / terminate per policy and writes to `contest_violation_events`.
- (Re-use existing 12 `contest-*` functions — no duplication.)

---

## 7. Admin/contest configuration

In the contest editor, replace the scattered proctoring toggles with one **"Anti-cheat profile"** selector:

- **Open** (no proctoring) — for practice.
- **Standard** — current default (webcam + lockdown).
- **Hard** *(this plan's default)* — every gate above mandatory, auto-terminate on critical events.
- **Custom** — per-signal toggles for power users.

Plus a "Hardware checklist" the candidate must confirm in the invite email (phone, single monitor, quiet room) — pre-emptive, reduces failed attempts.

---

## Out of scope (intentionally)

- Native OS-level lockdown browser (we stay web-based).
- Live human proctors (this is detection + recording, not a staffing layer).
- Mobile-only candidate flow (desktop required for hard mode).

---

## Technical detail (for engineers)

```text
Player.tsx
  └─ TrustGate (blocks start)
       ├─ IdentityCheck (contest-identity-verify)
       ├─ SideEyeReadyCheck (existing, made mandatory)
       ├─ MultiMonitorCheck (Window Management API)
       ├─ EnvironmentCheck (contest-environment-attest)
       └─ KeystrokeEnroll (60s baseline → contest-keystroke-verify)
  └─ useZeroTrustWatcher  ── pushes typed events ─►  contest-violation-engine
       ├─ useProctoring (face, audio, presence)
       ├─ useDeviceLock (focus, fullscreen, devtools)
       ├─ useDisplayCapture (screen)
       ├─ useTypingAnalytics → contest-keystroke-verify
       └─ screens.onchange listener
  └─ Realtime: kill-signal → TerminatedLockout

Admin
  └─ AdminSideEyeConsole
       ├─ Live tiles (existing)
       └─ Integrity Queue (new)
            └─ contest-integrity-report-generate
                 └─ PublicVerifyReport (signed link)
```

Hash-chain (`sideeye_evidence_chain`) is extended to cover every new event type so the public report verifies the full chain, not just side-cam clips.

---

## Honest caveat

No web-based system reaches *literal* zero — a candidate with a hidden earpiece and a memorized question pool can still cheat. This plan eliminates every *practical* vector for a determined-but-not-state-actor cheater, and makes any successful cheating extremely visible in post-hoc review. If you need higher assurance, the next step is a native lockdown-browser companion, which I can plan separately.