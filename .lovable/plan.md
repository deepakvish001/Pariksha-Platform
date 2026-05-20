## Goal

Give invited students a single, obvious place to find every test sent to them — pending invites and past attempts — and keep the dashboard banner visible until they actually start the test.

## Why now

- The dashboard banner sometimes disappears (likely because `useMyInvites` returns `[]` while the React Query cache is cold, or because the invite already moved to `claimed` and the user expected only `pending` to show).
- Right now the only place to find invited tests is `/assessments` (MyAssessments), which mixes recruiter-facing concerns and isn't discoverable from the student sidebar.

## Changes

### 1. New page: `/my-tests`

New file: `src/pages/MyTests.tsx`, wrapped in `DashboardLayout`.

Sections:
- **Pending invitations** — rows from `useMyInvites()` where `status` is `pending` or `claimed`. Each row shows title, duration, expiry, status badge, and a **Start / Resume** button that calls `claimInvite(token)` then navigates to `/assessments/{attempt.id}/lobby`.
- **Past tests** — rows from `useMyAttempts()` where `status` is `submitted`, `expired`, or `abandoned`. Shows title, submitted_at, duration, score (if visible), and a **View result** button → `/assessments/{attempt.id}/submitted` (or detail if available).
- **Empty state** — friendly card explaining "You have no test invitations yet. Recruiters will appear here when they invite you."

Route registration: add `<Route path="/my-tests" element={<ProtectedRoute><MyTests /></ProtectedRoute>} />` in `src/App.tsx`. Lazy-import like the other student pages.

### 2. Sidebar entry

Add a "My Tests" item to `DashboardSidebar.tsx` in the Home/active section, using the `ClipboardList` lucide icon, linking to `/my-tests`. Show an unread-count badge equal to pending-invite count (reuses `useMyInvites`).

### 3. Banner visibility fix

Update `src/components/InvitedAssessmentsBanner.tsx`:
- Keep the `pending` + `claimed` filter (claimed means accepted but not started/submitted — should still be surfaced).
- Additionally exclude invites whose linked attempt is already `submitted` by cross-checking `useMyAttempts()`.
- Remove any "dismiss once" behavior; banner stays as long as there is at least one not-yet-started invite. This matches the user's choice ("Show until test started").
- Add `staleTime: 0` + `refetchOnMount: 'always'` for `useMyInvites` so navigating back to the dashboard always refetches (fixes "not showing" after first visit).

### 4. No backend / RLS changes

`assessment_invites` and `assessment_attempts` RLS already allow the invited user to read their own rows. No migrations needed.

## Files touched

- new: `src/pages/MyTests.tsx`
- edit: `src/App.tsx` (route + lazy import)
- edit: `src/components/DashboardSidebar.tsx` (nav item + badge)
- edit: `src/components/InvitedAssessmentsBanner.tsx` (visibility logic + refetch)
- edit: `src/b2b/hooks/useInvites.ts` (add `staleTime: 0, refetchOnMount: 'always'` to `useMyInvites`)

## Out of scope

- Recruiter-side changes (`/assessments` MyAssessments remains untouched).
- Email notifications / reminders for pending invites.
- Result analytics page beyond linking to the existing submitted screen.
