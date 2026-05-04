## Goal

Ship Tier 1 anti-cheat: server-side submission validation, single-device/single-tab enforcement, paste/typing telemetry, and mandatory continuous webcam + screen-share with auto-DQ.

## 1. Database changes (migration)

**Extend `contest_sessions`**
- `client_fingerprint jsonb` — UA + screen + timezone + canvas hash captured at session start
- `ip_address inet` — captured by RPC via `inet_client_addr()`
- `last_heartbeat_at timestamptz` — updated by `contest_session_heartbeat`
- `stream_grace_until timestamptz` — when stream stops, grace window before auto-DQ

**New tables (RLS: user inserts own, admins read all)**
- `contest_typing_events` — `session_id, problem_slug, char_count, dt_ms, is_burst, ts`
- `contest_stream_health` — `session_id, stream_kind ('webcam'|'screen'), healthy, ts`
- `contest_tab_locks` — `contest_id, user_id, tab_id, claimed_at` (unique on contest_id+user_id) — server-side single-tab guard

**New / updated RPCs**
- `contest_validate_submission(_contest_id, _session_id, _fingerprint)` → returns `{ok, reason}`. Checks: session active, heartbeat ≤ 45s old, fingerprint match, not DQ'd, no stale stream health.
- `contest_session_heartbeat` — extended to also update `last_heartbeat_at` and accept `_fingerprint` for drift check.
- `contest_claim_tab_lock(_contest_id, _tab_id)` — upserts; returns `{ok, displaced_tab_id?}`.
- `contest_report_stream_health(_session_id, _kind, _healthy)` — inserts row; if unhealthy + grace expired, marks session `disqualified`.
- Trigger: when `stream_grace_until` is in the past and unhealthy persists, auto-DQ.

## 2. Edge function: `validate-contest-submission`

Wraps the existing `submit-code` flow. Called by client BEFORE invoking `submit-code`, AND called server-to-server by `submit-code` as the first step (defense in depth).

Logic:
1. `getClaims` → user id
2. Call `contest_validate_submission` RPC
3. Check typing events for the problem in last 30s — if total chars submitted > 200 with zero typing events ⇒ reject as `paste_only_submission`
4. Returns `{allowed, reason, severity}`. On reject, log a `contest_violations` row (`type: 'submission_blocked'`).

Wire into `supabase/functions/submit-code/index.ts` so contest submissions cannot bypass the gate.

## 3. Client: typing telemetry

**New hook `useTypingTelemetry(contestId, sessionId, problemSlug)`**
- Wraps Monaco `onDidChangeModelContent`
- Batches events every 2s: total chars added, time deltas
- Flags `is_burst` when ≥80 chars in <300ms (likely paste even if clipboard blocked)
- Inserts batched rows into `contest_typing_events`
- On burst, also calls `logViolation('paste_burst', 'flag', {chars, dt_ms})`

Mounted inside `ContestPlayProblem` / `CodingProblemDetail` only when `secure.sessionId` is active.

## 4. Client: single-tab / single-device enforcement

**New hook `useContestTabLock(contestId)`**
- Generates `tab_id = crypto.randomUUID()` on mount
- BroadcastChannel `byteskill:contest:${contestId}` — broadcasts `claim` on mount; on receiving another `claim`, the older tab shows a blocking modal "Contest opened in another tab" and forces redirect to `/contests/:slug`
- Calls `contest_claim_tab_lock` RPC every 15s; if response says displaced ⇒ same modal

**`SecureContestGate`** — uses the hook; renders `<MultiTabBlockedDialog>` overlay when displaced.

## 5. Client: client fingerprint

**New util `src/lib/contestFingerprint.ts`**
- Returns `{ua, screen: {w,h,dpr}, tz, canvasHash}` (small canvas draw → SHA-256 of dataURL)
- Captured once at session start, passed to `contest_start_secure_session` and re-sent on every heartbeat

`useContestSecureMode.start()` updated to compute + send the fingerprint.

## 6. Client: mandatory continuous streams

**`useScreenRecorder`** — already exists. Add:
- On `MediaStream` `inactive` / track `ended` event → call `contest_report_stream_health(sessionId, 'screen', false)` and start a 30s grace UI timer
- During grace: editor becomes read-only (pass `streamHealthy` down to `CodingProblemDetail` → disable Monaco), HUD shows red "Screen sharing stopped — reshare in 30s or you will be disqualified" with a `Reshare` button
- On grace expiry without recovery: client calls `logViolation('screen_share_lost','fatal')`; trigger or RPC marks session DQ'd

**`useContestSecureMode` (webcam path)** — same treatment:
- `videoStreamRef.current.getVideoTracks()[0].onended` → report unhealthy + grace timer
- Editor read-only during grace

**New component `<StreamHealthBanner />`** — shown in `ContestKioskLayout` top bar; counts down grace, exposes Reshare/Re-grant buttons.

## 7. Submission flow wiring

In `CodingProblemDetail.handleSubmit` (contest mode branch):
1. If `!secure.submissionAllowed` ⇒ toast and abort (already there)
2. Call `validate-contest-submission` edge function
3. If `allowed === false` ⇒ toast `reason`, log telemetry, abort
4. Otherwise call existing `submit-code`
5. `submit-code` itself re-invokes `contest_validate_submission` RPC server-side as defense in depth

## 8. Telemetry / admin visibility

Extend `contest_lock_events` consumer (or reuse) so the admin contest page can show:
- Recent paste bursts per user
- Stream-health timeline
- Tab-lock displacements
- Submission blocks with reason

(Admin UI itself is Tier 3 item 12 — out of scope here, but data is captured.)

## Files to create

- `supabase/migrations/<ts>_contest_tier1_hardening.sql`
- `supabase/functions/validate-contest-submission/index.ts`
- `src/hooks/useTypingTelemetry.ts`
- `src/hooks/useContestTabLock.ts`
- `src/lib/contestFingerprint.ts`
- `src/components/contests/MultiTabBlockedDialog.tsx`
- `src/components/contests/StreamHealthBanner.tsx`

## Files to edit

- `src/hooks/useContestSecureMode.ts` — fingerprint, webcam health reporting + grace
- `src/hooks/useScreenRecorder.ts` — health reporting + grace
- `src/components/contests/SecureContestGate.tsx` — mount tab lock + multi-tab dialog
- `src/layouts/ContestKioskLayout.tsx` — mount `<StreamHealthBanner />`
- `src/pages/library/CodingProblemDetail.tsx` — mount typing telemetry, gate submit through `validate-contest-submission`, read-only Monaco when stream unhealthy
- `src/pages/contests/ContestPlayProblem.tsx` — pass stream health to top bar
- `supabase/functions/submit-code/index.ts` — call `contest_validate_submission` RPC for contest submissions
- `src/integrations/supabase/types.ts` — auto-regenerated after migration

## Out of scope (covered by later tiers)

- Identity/face match, audio, devtools detection, fetch interceptor, similarity scan, admin live monitor, randomized variants, viva queue.

## Risks / notes

- Canvas fingerprinting is probabilistic; we'll only treat *changes* mid-session as suspicious, not use it as the sole identity check.
- Some legitimate users will lose webcam permission accidentally; the 30s grace + Reshare button is the safety valve. We'll log a `webcam_lost_recovered` event when they recover so admins can distinguish.
- BroadcastChannel only works same-origin; cross-device second logins are caught by the existing `contest_start_secure_session` invalidation + `useActiveContestSession` dialog (already shipped).
