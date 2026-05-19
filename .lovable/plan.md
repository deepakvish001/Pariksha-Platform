# Share Dialog — Status & Polish

The Share Dialog you described already exists at `src/b2b/pages/placements/ShareDialog.tsx` and is wired into both `RankingsTab` (per-row share + bulk shortlist share) and `StudentPlacementProfile` (Share with HR button). It already supports:

- **Profile vs shortlist** — chosen via the `target` prop (`{ kind: "profile", studentId }` or `{ kind: "shortlist", studentIds }`)
- **Expiry** — 7 / 14 / 30 / 90 day presets, stored as `expires_at`
- **Optional message to HR** — `Textarea` saved to `message`
- **Recruiter name + email** — optional fields persisted on the share row
- Link generation with random token, public route at `/p/student/:token` or `/p/shortlist/:token`, plus copy-to-clipboard and preview

Given that, this plan is a small **polish pass** to make the dialog more useful for placement coordinators — not a full rebuild.

## Changes

### 1. Custom expiry option
- Add `Custom date…` to the expiry `<select>`. When chosen, reveal a small date picker (`<Input type="date">`) so coordinators can target a specific deadline (e.g. drive close).
- Validate: must be a future date, max 365 days out; otherwise show inline error and disable Generate.

### 2. Permission toggles
Two `Switch` rows under the message field, persisted on the share row (already-present columns):
- **Show resume** — defaults on. Sent through as `allow_resume` in the insert; the public profile already gates on this.
- **Show contact info** — defaults off. Maps to `allow_contact`.

If the columns don't exist yet on `student_share_links`, add them via migration (`allow_resume boolean default true`, `allow_contact boolean default false`). I will check the table first and only migrate if needed.

### 3. After-create panel improvements
- **QR code** for the link (use `qrcode.react`, already commonly bundled — if not, generate an SVG inline via a tiny inline encoder). Useful for printed flyers / WhatsApp.
- **Copy as message** — secondary button that copies a prefilled blurb: `Hi {recruiterName || "team"},\n\n{message}\n\nView: {url}\n\nExpires: {date}.`
- **Send by email** — if recruiter email was provided, show a `Send to {email}` button that calls the existing `placement-share-email` edge function (already created earlier per project history). If it isn't deployed yet, hide the button and surface a tooltip "Set up Resend to enable email delivery." We will detect by checking for SUPABASE_PROJECT secrets at runtime — no UI for misconfiguration.

### 4. Recent links list (compact)
Below the form, a collapsible **Recent shares** section (last 5 for this `target`):
- Query `student_share_links` for the same `student_id` (profile) or matching `student_ids` array (shortlist).
- Columns: recruiter / created / expiry / views / status (Active · Expired · Revoked).
- Per-row actions: Copy link, Revoke (sets `revoked_at = now()`).

### 5. Minor UX
- Disable Generate when the dialog is in a pending state (already done) **and** when expiry is invalid (new).
- Auto-focus the recruiter-name input on open.
- Toast on revoke / on email send.
- Tighten labels and helper text; keep current glass / semantic-token styling.

## Out of Scope

- The public viewer pages (`PublicStudentProfile`, `PublicShortlist`) — already exist.
- The `placement-share-email` edge function — already created earlier (will be reused, not rebuilt).
- View analytics dashboard (separate task — would aggregate `student_share_views` across all links).

## Open Question

Do you want the **Send by email** button included? That requires the `placement-share-email` edge function plus the `RESEND_API_KEY` secret. If you'd rather keep the dialog link-only for now, I'll skip it and ship items 1–2 and 4–5 (plus QR + copy-as-message from item 3).