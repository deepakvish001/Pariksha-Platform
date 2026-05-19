# Public Share Profile — Wire in per-link permissions

The route is already live:

- `/p/student/:token` and `/p/shortlist/:token` → `src/pages/public/PublicStudentProfile.tsx`
- Resolver edge function: `supabase/functions/placement-public-profile/index.ts`

Token lookup, **expiry** (`expires_at`), and **revocation** (`revoked_at`) are already enforced in the edge function with `404 not_found`, `410 revoked`, and `410 expired`, and the page already renders friendly lock screens for each case. View logging + counter update also already happen.

What is **missing** is the per-link permission toggles the new ShareDialog now writes (`allow_resume`, `allow_contact`) — the resolver still only respects the global `student_profile_preferences`. This plan finishes that wiring and adds the resume link to the public view.

## Changes

### 1. Edge function `placement-public-profile`
- Select the new columns on `student_share_links`: `allow_resume`, `allow_contact`.
- Select `resume_url` from `org_students` (plus existing fields).
- For each student in the payload, apply **AND** logic between the link's toggle and the student's own preference:
  - `show_contact = link.allow_contact && pref.show_contact === true`
  - `show_resume  = link.allow_resume  && pref.show_resume  !== false` (default-on)
- Add to each student in the payload:
  - `resume_url: show_resume ? s.resume_url : null`
  - `show_resume: boolean`
- Keep the existing email-gating (`email` is still only set when `show_contact` is true).
- Keep the revoked / expired short-circuits exactly as they are.

### 2. Page `PublicStudentProfile.tsx`
- Extend `StudentPayload` with `resume_url: string | null` and `show_resume: boolean`.
- Add a "View resume" button next to the existing contact button when `show_resume && resume_url` — opens the PDF in a new tab. Uses the same outline style.
- Tweak the lock-screen copy slightly to mention what to do next (already mostly fine, just polish).
- Add a small footer line on each card when both toggles are off: "Contact and resume hidden by the sender." so HR knows to request access rather than thinking data is missing.

### 3. SEO / share preview (small)
- Add a `<title>` and `<meta name="description">` via a tiny inline `useEffect` (no Helmet dependency assumed). Title = `${student.name} · Placement Profile` for profile mode, or `Top ${n} candidates · ${org.name}` for shortlist mode. Description = the recruiter message if present, else a default blurb. `<meta name="robots" content="noindex,nofollow">` so share links never appear in search results.

## Out of scope

- View-analytics dashboard (separate task).
- Email delivery via Resend (separate task; not requested here).
- Schema changes — `allow_resume` / `allow_contact` already exist from the prior ShareDialog migration.

## Files touched

- `supabase/functions/placement-public-profile/index.ts` — add columns, AND-gate visibility, include resume_url.
- `src/pages/public/PublicStudentProfile.tsx` — render resume button, hidden-data notice, SEO tags.