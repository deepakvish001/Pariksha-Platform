## 1. Lockdown anti-cheat for the assessment player

Applies to every attempt — including `?preview=1` — so recruiters see the exact candidate experience.

### Pre-flight gate (before the player mounts)
A new `<AssessmentLockdownGate>` blocks the player until the candidate:
1. Grants webcam permission (camera test with live preview).
2. Clicks "Enter secure mode" → triggers `requestFullscreen()` on `document.documentElement`.
3. Acknowledges the rules card (tab switch, copy/paste, exit fullscreen = violation → 3 strikes auto-submit).

If permission is denied or fullscreen is rejected, the player stays gated with a retry button. No question content is rendered.

### Active enforcement (inside the player)
Extend `useProctoring` (rename effective behavior to "lockdown" — same hook):

- **Fullscreen lock** — if `fullscreenchange` fires and `document.fullscreenElement === null`, show a blocking modal "Return to fullscreen to continue" + `Re-enter` button. Counts as 1 violation.
- **Tab/window switching** — `visibilitychange` (hidden) and `window.blur` each count as 1 violation. Banner toast: "Violation X of 3 — next switch auto-submits."
- **Copy / cut / paste / contextmenu / selectstart / dragstart** — `preventDefault()` + log event. Cumulative — every 5 blocks = 1 violation.
- **Print / Save** — block `Ctrl/Cmd+P`, `Ctrl/Cmd+S` (currently used for flush-save — remap flush to `Ctrl/Cmd+Enter`), `F12`, `Ctrl/Cmd+Shift+I/J/C` (devtools), `Ctrl/Cmd+U` (view source).
- **Text selection / drag** — global CSS `user-select: none` on the player root (editor / textarea / input children get `user-select: text` so candidates can still type/select inside answer fields).
- **Auto-submit** at violation #3 — calls existing submit flow with `auto_submitted: true` payload event.

### Webcam proctoring
- Acquire `getUserMedia({ video: { width: 320, height: 240 }, audio: false })` once at gate-pass; keep the stream alive in a hidden `<video>`.
- A tiny always-visible PIP (bottom-right, 96×72, draggable) shows the live feed so the candidate sees "you are being recorded".
- Every 15s, capture a JPEG snapshot via `<canvas>` → upload to a new private `assessment-proctor` storage bucket at `<attempt_id>/<timestamp>.jpg`, then log an `attempt_events` row of kind `webcam_snapshot` with `{ path }`.
- If the camera track ends/`muted` (covered, unplugged), log `webcam_lost` → counts as a violation.

### Backend changes
- New migration:
  - Storage bucket `assessment-proctor` (private), with RLS:
    - Insert: only the attempt owner may upload to `<attempt_id>/*`.
    - Select: org members of the attempt's assessment may read; the attempt owner may read their own.
  - Extend `attempt_events.kind` allowed values list (no enum — already free `text`) with: `lockdown_enter`, `lockdown_fail`, `webcam_grant`, `webcam_deny`, `webcam_snapshot`, `webcam_lost`, `devtools_attempt`, `print_blocked`, `auto_submitted`, `violation_strike`.
  - Add `assessment_attempts.violations smallint NOT NULL DEFAULT 0` (server-side counter, kept in sync from the client; integrity_score continues to drop too).

### Files to touch
- `src/assessments/hooks/useProctoring.ts` — extend penalties, add devtools/print/copy-block handlers, add webcam snapshot loop, add violation counter & auto-submit callback.
- `src/assessments/components/AssessmentLockdownGate.tsx` (new) — full-screen gate UI.
- `src/assessments/components/WebcamPip.tsx` (new) — draggable live-feed pill.
- `src/assessments/components/ViolationBanner.tsx` (new) — strike toast + fullscreen-lost modal.
- `src/assessments/pages/Player.tsx` — wrap mount with gate, render PIP + banner, wire auto-submit, remove `Ctrl+S` shortcut (move flush to `Ctrl+Enter`).

## 2. Collapsible left Questions drawer

Replace the current 240px `lg:grid-cols-[240px_1fr]` static column with a **persistent collapsible rail** that owns the full viewport height (from below the top bar to above the bottom bar).

### Behavior
- **Expanded (default)** — 300px wide, full height, internal scroll. Shows the existing `QuestionPalette` rail with filters + section groups + legend.
- **Collapsed** — 48px icon strip showing only: a chevron toggle, a small `answered/total` count, and dots for flagged questions (clickable to jump).
- **Toggle** — chevron button at the top of the rail; state persisted in `localStorage` (`assess.palette.collapsed`). Keyboard shortcut `[` to toggle.
- **Mobile (<lg)** — unchanged: tap "Question X of N" pill to open the existing sheet drawer.
- The main question content reflows to fill remaining width; `max-w-[1600px]` cap on `<main>` stays intact (existing playerLayout invariant tests still pass — width token doesn't change, only the grid columns).

### Files to touch
- `src/assessments/lib/playerLayout.ts` — accept `paletteCollapsed` flag; emit `lg:grid-cols-[48px_1fr]` vs `lg:grid-cols-[300px_1fr]`. Width cap untouched.
- `src/assessments/components/QuestionPalette.tsx` — add `collapsed` prop + collapsed mini-strip render path.
- `src/assessments/pages/Player.tsx` — add `paletteCollapsed` state (persisted), pass to layout helper + palette, add `[` shortcut.
- `src/assessments/lib/playerLayout.test.ts` + snapshot — extend cases to lock the new grid tokens.

## Out of scope
- Hard kiosk lockdown (browser extensions that fully disable OS-level shortcuts) — impossible from a web app.
- Recording audio or screen — only periodic webcam stills.
- AI-driven snapshot analysis (a separate edge function can be added later; this plan only stores the evidence).
