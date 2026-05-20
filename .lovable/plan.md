## Goal

When a recruiter invites a student to an assessment:
1. The test should be **visible on the student's dashboard** (not only on `/assessments`).
2. If the invited person has **no account**, the invite link should let them sign up and land **directly on the test lobby** — no manual hunting.

Today neither works well:
- Invites only appear under `/assessments` (MyAssessments). Nothing surfaces on `/learn`, `/my/college`, or `/b2b/dashboard`.
- `InviteLanding` / `Join` store `sessionStorage.post_login_redirect`, but **`Login.tsx` and `AuthCallback.tsx` never read it** — so after sign-in users get dumped on their role-based default page instead of bouncing back to the invite.
- Signup from the invite link doesn't exist (`InviteLanding` only offers "Sign in"). New invitees are pushed to `/login`, told to confirm email, and navigated to `/login` again — losing the invite token.

## Changes

### 1. Surface invited tests on the dashboard

Create `src/components/InvitedAssessmentsBanner.tsx`:
- Uses `useMyInvites()` (already filters via RLS to invites matching the user's email).
- Shows a compact card listing every invite where `status` is `pending` or `claimed`, with a **Start / Resume** button that calls `claimInvite(token)` and navigates to `/assessments/{attempt.id}/lobby`.
- Empty state: render nothing.
- Mount it inside `src/components/DashboardLayout.tsx` (just above `{children}`) so it appears on every authenticated dashboard route (`/learn`, `/my/college`, etc.). For `/b2b/dashboard` (different layout) we'll skip — recruiters viewing their own admin tools is out of scope.

### 2. Honor the invite redirect on sign in

In `src/pages/Login.tsx` (both the password and MFA success branches) and `src/pages/AuthCallback.tsx`, before falling back to `getPostLoginPath(user.id)`:

```
const stored = sessionStorage.getItem("post_login_redirect");
if (stored) { sessionStorage.removeItem("post_login_redirect"); dest = stored; }
```

Order: `from` (router state) → `pendingAuthAction.path` (AuthCallback only) → `post_login_redirect` → role-based default.

### 3. Signup-from-invite flow

Update `src/assessments/pages/InviteLanding.tsx`:
- When `!user`, show **two** buttons: "Sign in" (existing) and a new **"Create account & start"** that navigates to `/signup` (the `post_login_redirect` is already set in the existing `useEffect`).
- Persist the invited email so signup pre-fills it: also write `sessionStorage.setItem("invite_prefill_email", data.invited_email)` and `sessionStorage.setItem("invite_token", token)`.

Update `src/pages/Signup.tsx`:
- On mount, read `invite_prefill_email` and prefill the `email` field (kept editable but with a small hint "Use this email — it matches your invite").
- After successful `signUp`:
  - If `sessionStorage.post_login_redirect` exists, navigate there immediately (works whether or not email confirmation is enabled; if a session is returned by Supabase, the invite flow proceeds; otherwise the user lands on `/login` with the redirect still queued and the existing Login change in step 2 handles it).
  - Keep the current toast about email confirmation only when no session was returned.

### 4. Minor cleanup

- `Join.tsx` and `InviteLanding.tsx` already set `post_login_redirect`; no change needed beyond step 3's email prefill writes.
- No DB / RLS / edge-function changes. `useMyInvites` already returns the right rows because `assessment_invites` RLS allows the invited email to read their own row.

## Files touched

- new: `src/components/InvitedAssessmentsBanner.tsx`
- edit: `src/components/DashboardLayout.tsx` (mount the banner)
- edit: `src/pages/Login.tsx` (consume `post_login_redirect` in 2 places)
- edit: `src/pages/AuthCallback.tsx` (consume `post_login_redirect`)
- edit: `src/assessments/pages/InviteLanding.tsx` (add "Create account & start", stash prefill)
- edit: `src/pages/Signup.tsx` (prefill email, honor redirect after signup)

## Out of scope

- Auto-confirming email signups (kept as-is; if your project requires confirm-on-email, the redirect still survives because it lives in `sessionStorage` and the Login change picks it up after the user clicks the confirmation link and signs in).
- Changing how recruiters create invites or send emails.
- Surfacing invites inside the B2B admin dashboard layout.

## Open question

Do you want me to also **auto-confirm email signups** so an invited student can go straight from "Create account" into the test without an email-verification round trip? It's a one-toggle change but lowers signup security project-wide — say the word and I'll include it.
