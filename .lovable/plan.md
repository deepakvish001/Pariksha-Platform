## Goal

Eliminate the duplicate pre-test page. Today candidates go through **Lobby** (welcome/rules) → **Preflight** ("Secure Assessment Mode" system check + identity + consent) → **Play**. Merge them so there is exactly one screen before the test starts: **Preflight** absorbs the lobby content; Lobby is removed.

## Changes

### 1. Preflight becomes the single pre-test screen

Edit `src/assessments/pages/Preflight.tsx`:
- Add a compact "Welcome" header block at the top of the existing layout containing the bits currently only on Lobby:
  - Assessment title + short description
  - Quick facts row (duration, proctored badge, opens/closes window)
  - "Before you begin" rules list (timer can't pause, keep camera on, no tab switch, ID ready)
  - Blocked-state warning (not yet open / closed / not published) with the same logic Lobby uses
- Keep the existing stepper but start it at the first "real" step (system check). The welcome strip sits above the stepper so it reads as context, not a separate step.
- Disable all "continue / start" CTAs when the assessment is blocked (notYetOpen / closed / notPublished).
- No change to system check, identity, consent, or start-test logic — just prepend the missing info.

### 2. Remove the Lobby route and file

- Delete `src/assessments/pages/Lobby.tsx`.
- In `src/App.tsx`:
  - Remove the `StudentLobby` import.
  - Replace the `/assessments/:attemptId/lobby` route with a `<Navigate to="/assessments/:attemptId/preflight" replace />` (or drop it entirely — but a redirect protects any old email links / bookmarks).

### 3. Point every "start" navigation at preflight

Replace `${attemptId}/lobby` with `${attemptId}/preflight` in:
- `src/lib/routing/paths.ts` — change `paths.student.lobby` to return `/preflight`, and rename to `paths.student.preflight` if it's not used elsewhere. (Simpler: keep the function name but change the path so we don't ripple a rename through callers — add a small `// kept as 'lobby' for backwards compatibility` comment.)
- `src/assessments/pages/Join.tsx` (line 28)
- `src/assessments/pages/InviteLanding.tsx` (line 119)
- `src/assessments/pages/MyAssessments.tsx` (claim handler)
- `src/components/InvitedAssessmentsBanner.tsx`
- `src/pages/MyTests.tsx`
- `src/b2b/pages/assessments/Landing.tsx` (admin preview button)

### 4. Out of scope

- Contest lobby (`src/components/contests/ContestLobby.tsx`) — unrelated, leave alone.
- Visual redesign of Preflight beyond inserting the welcome strip.
- Any RLS / backend changes.

## Files touched

- edit: `src/assessments/pages/Preflight.tsx` (add welcome strip + blocked-state guard)
- delete: `src/assessments/pages/Lobby.tsx`
- edit: `src/App.tsx` (remove import, swap route for redirect)
- edit: `src/lib/routing/paths.ts` (lobby helper → preflight path)
- edit: `src/assessments/pages/Join.tsx`
- edit: `src/assessments/pages/InviteLanding.tsx`
- edit: `src/assessments/pages/MyAssessments.tsx`
- edit: `src/components/InvitedAssessmentsBanner.tsx`
- edit: `src/pages/MyTests.tsx`
- edit: `src/b2b/pages/assessments/Landing.tsx`
