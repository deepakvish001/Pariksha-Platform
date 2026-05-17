# Invitation Section — Better & Easier Sending

Goal: make adding candidates and sending invitation emails fast, safe, and clear. Redesign the Invites tab UI, add CSV upload, give users a preview-before-send step, bulk actions, status filtering, one-click retry of failures, and optional scheduled sends + auto-reminders.

---

## 1. New Add-Candidates Flow

Replace today's single textarea with a tabbed input card:

- **Paste** (default) — same textarea, but with live parsing under it
- **CSV / Excel upload** — drag-drop or click; supports `.csv`, `.tsv`, `.xlsx`
- **Single candidate** — quick `name / email / roll id` form

After parsing, show a **Review preview table** before insert:

```text
┌──────────────────────────────────────────────────────────────┐
│ 24 rows found · 22 valid · 2 issues · 3 duplicates of existing│
├──────────────────────────────────────────────────────────────┤
│ ✓ alex@acme.com       Alex Morgan      R001                  │
│ ✓ sam@acme.com        Sam Lee          —                     │
│ ⚠ not-an-email        Bad row          (invalid email)       │
│ ⊘ jane@acme.com       Jane Roy         (already invited)     │
└──────────────────────────────────────────────────────────────┘
[ Send immediately ▾ ]  [ Add as drafts ]   [ Cancel ]
```

The primary button is a **split button** with two modes (per the "let user choose each time" answer):
- **Send immediately** — current behavior; saves user's last choice in localStorage as default
- **Add as drafts** — inserts rows with no email send; they appear as `pending` in the list

Invalid rows are skipped; duplicates of existing invites are skipped silently with a counted summary toast.

---

## 2. Redesigned Invite List

Replace today's flat list with a cleaner card + table layout:

**Header strip** (sticky inside the tab):
- Status pills with counts that act as filters: `All · Pending · Sent · Opened · Started · Submitted · Failed`
- Search box (name / email / roll id)
- Sort: Recent · Name · Status · Last sent
- Right side: `[Resend pending]  [⋯ More]` (export CSV, copy all links)

**Row** (denser, scannable):
```
☐  Avatar  Name              email                        roll_id
            status pill      Last sent 2h ago · 2× attempts
                                                  [Resend] [Copy link] [⋯]
```

`[⋯]` menu: View email · Copy join link · Remove · (if failed) Show error

**Bulk selection bar** appears when any row is checked:
```
3 selected   [Resend]  [Copy links]  [Export CSV]  [Delete]   ✕
```

**Failed group**: when filter = Failed, show a banner "2 emails failed — Retry all" with last error inline per row.

---

## 3. Sending Improvements

- **Confirm-before-send** modal for any batch ≥ 10 emails: "Send 24 emails now?" with recipient count + first 5 emails preview. Skippable with a "don't ask again" checkbox.
- **Progress toast** during sends — "Sending 12 of 24…" instead of waiting silently.
- **One-click retry** for failed sends from the row and from the Failed filter banner.
- **Cooldown guard**: disable per-row Resend for 30s after a successful send to prevent accidental double-clicks.
- Keep the existing **Preview email** and **Send test email** buttons, moved into the header strip.

---

## 4. Schedule & Auto-Reminders

Add a **Schedule** option in the split button:
- "Send immediately" / "Add as drafts" / **"Schedule for later…"** → picks date+time, stored as `scheduled_send_at` on each invite.
- A small banner under the header strip shows scheduled batches: "12 invites scheduled for Tue 6:00 PM · Edit · Cancel".

Add an **Auto-reminder** toggle in the Invites tab settings popover:
- "Send a reminder after N days if still pending" (default off; 3 days when on)
- Stored at the assessment level; reminders go only to invites still in `pending` and not past `expires_at`.

Both run via a new scheduled edge function `process-invite-schedule` triggered by `pg_cron` every 5 minutes; it calls the existing `send-assessment-invite` for due invites.

---

## Technical Section

### Frontend (`src/b2b/pages/assessments/Detail.tsx` + new files)
Split the current `InvitesPanel` into focused components under `src/b2b/components/invites/`:
- `AddCandidatesCard.tsx` — tabs (Paste / Upload / Single), parse + review preview, split send button.
- `CsvDropzone.tsx` — `.csv`/`.tsv` via PapaParse (already use of paste parsing); `.xlsx` via `xlsx` package (add dependency).
- `InvitesToolbar.tsx` — status pill filters, search, sort, export, preview/test buttons.
- `InviteRow.tsx` — selectable row with checkbox, status pill, actions menu (shadcn DropdownMenu).
- `BulkActionBar.tsx` — sticky bottom bar when selection > 0.
- `ScheduleDialog.tsx` — date+time picker (reuse existing shadcn Calendar + Input time).
- `useInviteSelection.ts` — small hook for selected ids + helpers.

State management stays in React Query (`useInvites`, `useCreateInvites`, `useDeleteInvite`). Add:
- `useResendInvites(ids)` mutation wrapping `supabase.functions.invoke("send-assessment-invite", { invite_ids })`.
- `useUpdateInviteSchedule()` mutation for `scheduled_send_at`.
- Client-side filtering/sorting/search; no extra queries.

### Database (migration)
Add columns to `assessment_invites`:
- `scheduled_send_at timestamptz null`
- `reminder_sent_at timestamptz null`

Add columns to `assessments`:
- `auto_reminder_enabled boolean not null default false`
- `auto_reminder_after_days int not null default 3`

Add indexes:
- `idx_invites_scheduled_send_at` partial on `scheduled_send_at is not null and status = 'pending'`
- `idx_invites_pending_reminder` on `(assessment_id, status, last_sent_at)`

RLS: extend existing org-owner policies to cover the new columns (no new policies needed since columns inherit).

### Edge Functions
- **`send-assessment-invite`** — accept new `skip_send: true` flag (for drafts) and a `scheduled_send_at` body so the UI can both insert and schedule in one call. No behavior change when omitted.
- **NEW `process-invite-schedule`** — runs via `pg_cron` every 5 min:
  1. Picks invites where `scheduled_send_at <= now()` and `status = 'pending'`, calls existing sender, clears `scheduled_send_at`.
  2. For assessments with `auto_reminder_enabled`, picks pending invites where `last_sent_at < now() - interval 'N days'` and `reminder_sent_at is null`, resends and stamps `reminder_sent_at`.

Schedule the cron job via `supabase--insert` (not migration) per the scheduling guideline.

### Dependencies
- `xlsx` (SheetJS) for `.xlsx` parsing — small, browser-safe build.
- `papaparse` if not already present, for robust CSV parsing.

### Out of scope (won't change)
- Email template rendering, brand color logic, suppression infra — untouched.
- The student-side `useMyInvites` / claim flow.
- Existing `assessment_invites` rows are fully compatible; all new columns are nullable / defaulted.

---

## Deliverables Order
1. Migration (new columns + indexes) — request approval, apply.
2. New components + refactored `InvitesPanel` wiring.
3. `xlsx`/CSV upload + review preview.
4. Bulk actions, filtering, search, sort.
5. Schedule dialog + auto-reminder toggle UI.
6. Edge function update + new `process-invite-schedule` + cron insert.
7. Smoke test: add 5 via paste, 5 via CSV, schedule 2, fail-retry 1, bulk-resend 3.
