# Fix Third Eye disconnect detection

Right now the desktop shows "Third Eye connected" forever after the phone pairs — even if the phone is closed — because:

1. `SideCameraPairing` stops polling as soon as `status === "paired"` (early `return` in the status `useEffect`), so it never sees the DB flip back to `disconnected`.
2. Preflight auto-advances to the Ready step 600 ms after pair, where the line "Third Eye paired" is hardcoded and never re-checked.
3. A backend disconnect only happens if the phone fires `pagehide`/`sendBeacon`. If the OS kills the tab silently, there's no signal — we need a `last_seen_at` freshness check too.

## Changes

### 1. `src/assessments/components/SideCameraPairing.tsx` — keep polling, surface disconnect
- Remove the early `return` so polling continues after `paired`.
- On every poll, also compute `isStale = now - last_seen_at > 15s` (server already returns `lastSeenAt`). If stale or `status === "disconnected" | "expired"`, treat as **disconnected**.
- Add `onUnpaired?: () => void` prop. Fire it whenever we transition out of `paired`.
- New "disconnected" UI: amber/destructive card — "Third Eye disconnected — reopen the link on your phone" + a **Reconnect** button that calls `createPairing()` again (fresh QR/code).
- While `paired`, keep current green card but add a tiny "Last seen Xs ago" subtext driven by `last_seen_at`.

### 2. `src/assessments/pages/Preflight.tsx` — react to unpair
- Replace the local `passCurrent`/auto-advance closure for `ThirdEyeStep` with `onPass={...}` and a new `onUnpaired={...}`:
  - `onPass`: `passCurrent()` + auto-advance after 600 ms (unchanged).
  - `onUnpaired`: `failCurrent()` (mark thirdeye failed), and if user is past it (`current > thirdeyeIndex`), `setCurrent(thirdeyeIndex)` so they're forced back to re-pair. Also block `Start test` (`canAdvance` already requires `passed`, but extend the `onStart` guard with `!blocked && stateById["thirdeye"] !== "failed"`).
- In `ReadyStep`'s "Third Eye paired · Camera & mic ready" line, drive the text from `stateById["thirdeye"]` instead of hardcoding — if it ever flips to failed while on Ready, the user gets bounced back by the effect above before reading it anyway, but this avoids a stale flash.

### 3. (Optional, server) `supabase/functions/assessment-sidecam/index.ts`
No edge-function change needed: the `status` action already returns `last_seen_at`, and the upload handler refreshes it on every frame (~5 s cadence). The client-side freshness check (>15 s) is enough to catch silent kills without a backend cron.

## Out of scope
- Contest `SideEyeMobile` flow (separate proctor path).
- Player-side re-pair UI inside `AssessmentLockdownGate` (already has its own logic; not what the user reported).
- Backend stale-pairing sweeper.

## Files
- edit `src/assessments/components/SideCameraPairing.tsx`
- edit `src/assessments/pages/Preflight.tsx`
