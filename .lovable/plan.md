# Conduct Contest in Secure Mode

The secure mode primitives (honor code RPC, session RPC, violation logging, webcam snapshots, admin proctor review) already exist. This plan stitches them into the actual participant journey so a contest can be conducted end-to-end with lockdown enforced from registration to submission.

## Goals

1. A registered participant cannot see contest problems until they have started a Secure Session.
2. Lockdown (fullscreen, anti-paste, tab-blur, webcam) is active on the **problem-solving page**, not just the contest detail page.
3. Only one device can hold an active session; opening a second device kicks the first.
4. Disqualification immediately blocks submissions and hides problems.
5. Participants get a clear pre-start lobby with a live countdown, and a "background apps" reminder checklist.

## Participant journey

```text
Register (before start) ──► Honor code accepted ──► Lobby + countdown
        │                                               │
        ▼                                               ▼
   start_secure_session RPC ◄── "Start Secure Session" button (live phase)
        │                            (requests webcam + fullscreen)
        ▼
   Secure HUD on contest page ──► Open problem ──► SecureProblemShell
        │                                              │
        ▼                                              ▼
   Violations logged in real time            Submit only allowed while
   (>=3 flag, >=5 auto-DQ via RPC)           session.is_active = true
```

## Changes

### 1. Gate problems behind an active secure session
- `ContestDetail.tsx` Problems tab: replace the `canSeeProblems` check with `canSeeProblems && hasActiveSecureSession`. If contest is live, registered, and no active session, show a CTA card "Start Secure Session to view problems" that scrolls to the gate.
- Pass an `onSessionStarted` callback from the gate up to `ContestDetail` so the tab updates without a refetch.

### 2. Lobby with live countdown
- New `ContestLobby` block rendered by `SecureContestGate` when honor code is accepted but `phase !== "live"`.
- Shows: countdown to `starts_at`, registered participant count, a "Pre-flight checklist" (close other apps, single monitor, charge laptop, quiet room) with a confirm checkbox before "Start Secure Session" becomes enabled at T-0.

### 3. Single active session enforcement (client side)
- New `useActiveContestSession(contestId)` hook subscribes via Supabase realtime to `contest_sessions` filtered by `contest_id` + `user_id`.
- When a row's `is_active` flips to `false` (server-side invalidation triggered by another device starting), the current device:
  - Stops webcam tracks, exits fullscreen.
  - Logs `session_invalidated` violation locally (already a typed enum value).
  - Shows blocking dialog "Session ended on another device" with link back to the contest page.

### 4. Secure problem solver shell
- New wrapper `SecureProblemShell` mounted on `/library/problems/:slug` when the URL has `?contest=<slug>`:
  - Reads contest by slug, verifies `phase === "live"`, registration is `registered`, not disqualified, and an active session row exists. Otherwise redirects back to the contest page with a toast.
  - Mounts `useContestSecureMode(contestId, true)` so paste/copy/contextmenu/tab-blur/fullscreen-exit listeners fire on the editor too.
  - Renders the floating Secure HUD in the corner (violations/5, fullscreen/proctor badges).
  - Disables the existing submit button when `disqualified || !sessionId` and shows the same gating tooltip pattern used on Friends.
- The submit handler additionally calls a new `contest_can_submit(_contest_id)` RPC that returns false when DQ'd, withdrawn, or no active session — this is the server-side guard so a savvy user cannot bypass the UI.

### 5. "Close background apps" guidance
True OS-level enforcement is not possible from a browser, so we use the strongest available signals:
- Pre-flight checklist item the user must tick.
- Live HUD warns when `navigator.userActivation.isActive` is false for too long, when `screen.isExtended === true` (multiple monitors), and when `navigator.getBattery()` reports `< 25%`. Each is logged once per session as a `meta` field on a soft `warn` violation.

### 6. Server additions
- New SQL function `public.contest_can_submit(_contest_id uuid) returns boolean` — checks active session + registration status. Used by the problem submit edge function (or RPC) before accepting a submission tied to a contest.
- Extend `contest_start_secure_session` to accept `_screen` JSON (resolution, dpr, monitors) and persist it on `contest_sessions.user_agent`/new `device_meta jsonb` column for admin review.
- Trigger on `contest_registrations.disqualified_at` change → set all that user's `contest_sessions.is_active = false` so the realtime hook above kicks them out instantly.

### 7. Admin "Conduct" controls
- On `AdminContestRegistrations.tsx`: add a "Force end session" action per row that updates `contest_sessions` (admin RLS already exists). Useful for support cases.
- On `AdminContestProctor.tsx`: add a small live counter "X active sessions now" computed from `contest_sessions` where `is_active`.

## Files to add / edit

- new `src/components/contests/ContestLobby.tsx`
- new `src/components/contests/SecureProblemShell.tsx`
- new `src/hooks/useActiveContestSession.ts`
- edit `src/components/contests/SecureContestGate.tsx` — render lobby, expose `onSessionStarted`, surface session-invalidated dialog.
- edit `src/hooks/useContestSecureMode.ts` — emit `sessionInvalidated`, capture device meta, soft warns for multi-monitor/low-battery.
- edit `src/pages/contests/ContestDetail.tsx` — gate Problems tab, hook session state up.
- edit `src/pages/library/CodingProblemDetail.tsx` (or current problem detail file) — wrap in `SecureProblemShell` when `?contest=` query is present, route submit through `contest_can_submit`.
- edit `src/pages/admin/contests/AdminContestRegistrations.tsx` and `AdminContestProctor.tsx` — force-end + active count.
- one migration: `contest_can_submit` RPC, `contest_sessions.device_meta` column, DQ → invalidate-sessions trigger.

## Out of scope

- True OS-level app blocking (browser cannot enforce).
- Native desktop proctor app.
- Secondary identity verification (ID upload) — can be a follow-up.
