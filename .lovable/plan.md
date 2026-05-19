# Placement Rankings & Shareable Student Profiles

Build a ranking system on top of the Placements dashboard so colleges can identify top performers across all branches/batches and share polished profile pages with HR/recruiters.

## What the user gets

1. **Rankings tab** inside `/b2b/placements` — sortable, filterable leaderboard of every student in the org with a composite "Placement Score".
2. **Student Placement Profile page** at `/b2b/placements/students/:studentId` — rich view college admins and the student themselves can see.
3. **Public shareable profile** at `/p/student/:shareToken` — recruiter-safe, no-auth link with a watermark, expiry, and view tracking.
4. **Bulk share to HR** — select N top students, generate a "shortlist link" and copy/email it to a recruiter.

## Rankings tab

Sits as a new tab in PlacementsDashboard next to Overview.

Columns (all sortable, click row → profile):
- Rank (#)
- Student (avatar, name, roll no.)
- Branch · Batch · Section
- Placement Score (0–100, color-coded)
- Assessments taken / avg score / avg integrity
- DSA + Quiz mastery (from XP / SRS)
- Resume strength %
- Drives applied / shortlisted / offers
- Status badge (Unplaced / Shortlisted / Placed / Multi-offer)
- Actions: View profile · Share to HR · Add to shortlist

Filters (reuse existing PlacementFilters context): batch, branch, section, status, score band, "has resume", "has offer", min assessments.

Top of tab: "Top 10 across college", "Top 3 per branch" quick-view chips, plus CSV export and "Generate shortlist link" button.

## Placement Score formula

Stored in `placement_snapshots.scores jsonb` per student, recomputed nightly + on-demand:

```text
Score = 0.30 * assessment_score_pct
      + 0.15 * assessment_integrity_pct
      + 0.20 * skill_mastery (XP-tier + SRS mastery normalized)
      + 0.15 * resume_strength (latest AI analysis 0–100)
      + 0.10 * drive_engagement (applications & shortlist rate)
      + 0.10 * offer_factor (placed/multi-offer boost)
```

Each component is computed in SQL from existing tables (`assessment_attempts`, `user_xp`, `srs_*`, `resume_analyses`, `drive_applications`, `placement_offers`). Missing data → component = 0 with an "incomplete profile" hint shown in UI.

## Student Placement Profile (internal)

Route: `/b2b/placements/students/:studentId` — visible to org admins/TPO/recruiter roles AND to the student themselves (if `org_students.user_id = auth.uid()`).

Sections:
- Header card: avatar, name, roll/branch/batch, Placement Score gauge, status badge, rank-in-branch + rank-in-college
- Strengths radar chart (the 6 score components)
- Assessment history (table from existing `assessment_attempts`)
- Skill mastery (DSA topics, languages, XP level)
- Resume preview (latest template + AI strengths/weaknesses)
- Drive timeline (applications, rounds, offers)
- Top tags ("Top 5% in DSA", "Consistent integrity", "Resume-ready")
- Share controls: "Generate HR link", "Copy public URL", "Revoke link"

## Public shareable profile (HR-facing)

Route: `/p/student/:shareToken` — no login required; resolved via edge function `placement-public-profile`.

- Clean recruiter-ready layout: name, branch/batch, headline, score highlights, key skills, resume download (if student opted in), achievements, contact button.
- Hides: integrity raw scores, internal notes, exam attempt details — only curated highlights.
- Watermarked "Shared by {College} via Parikshaa · Expires {date}".
- View tracking: each open logged; college sees "Viewed by 3 recruiters, last opened 2h ago".
- Student-side toggle to opt into sharing (default: requires admin generation, student notified).

## Bulk shortlist to HR

From Rankings tab → select rows → "Create shortlist link":
- Generates `/p/shortlist/:token` listing the chosen students as cards (each linking to their public profile).
- Optional message + recruiter email; if email provided, sends via existing Resend setup.
- Expiry (default 30 days), revoke anytime.

## Technical details

**New tables**
- `placement_snapshots` (already in earlier migration) — extend with `student_id`, `score numeric`, `scores jsonb`, `rank_in_org`, `rank_in_branch`, `computed_at`. Indexed on `(org_id, score desc)`.
- `student_share_links` — `id`, `org_id`, `student_id` (nullable for shortlists), `kind` enum(`profile`,`shortlist`), `token text unique`, `student_ids uuid[]` (for shortlists), `created_by`, `expires_at`, `revoked_at`, `recruiter_email`, `message`.
- `student_share_views` — `share_id`, `viewed_at`, `ip_hash`, `user_agent`, `referrer`.
- `student_profile_preferences` — `student_id`, `allow_public_share bool`, `show_resume bool`, `show_contact bool`, `headline text`.

**RLS**
- Snapshots/shares: org admins via `is_org_member(...)`; students can read their own row via `org_students.user_id = auth.uid()`.
- Public profile fetch uses an **edge function with service role** that validates token + expiry + revocation; no direct table SELECT for anon.

**RPCs**
- `placement_rankings(org_id, filters jsonb, sort text, limit, offset)` → ranked list with all columns.
- `placement_score_recompute(org_id, student_id uuid default null)` → recompute one or all.
- Nightly `pg_cron` job recomputes whole org snapshots at 02:00 IST.

**Edge functions**
- `placement-share-create` — issues token, stores row.
- `placement-public-profile` — resolves token → curated payload.
- `placement-share-email` — Resend email to recruiter with the link.

**Frontend**
- `src/b2b/pages/placements/RankingsTab.tsx` (TanStack Table, virtualized for >1k rows)
- `src/b2b/pages/placements/StudentPlacementProfile.tsx`
- `src/pages/public/PublicStudentProfile.tsx` + `PublicShortlist.tsx` (under `/p/...`)
- `src/b2b/components/placements/PlacementScoreGauge.tsx`, `StrengthsRadar.tsx`, `ShareDialog.tsx`
- New routes wired in `src/App.tsx`

**Reuse**
- Existing `OrgShell`, `PlacementFilters` URL state, recharts, `useOrgStudents`, `useAttempts`, resume analysis tables, XP/SRS hooks.

## Build order

1. Migration: snapshots score columns + `student_share_*` tables + RLS + rankings RPC
2. `RankingsTab` with sort/filter/export
3. Internal `StudentPlacementProfile` page
4. Share dialog + `placement-share-create` edge function
5. Public profile + shortlist pages + `placement-public-profile` edge function
6. View tracking + recruiter email send
7. Nightly recompute cron + on-demand refresh button
8. Student-side opt-in preferences UI in their own dashboard

## Open questions

1. **Who can share to HR?** Only TPO/admins, or also faculty/recruiter role? Default: TPO + admin + owner.
2. **Student consent**: should public share require explicit student opt-in, or admin-controlled with student notified? Default: admin can generate, student is notified and can revoke from their dashboard.
3. **Contact exposure on public profile**: show email/phone by default or behind a "Request contact" button that emails the student? Default: behind button.
4. **Score weights**: are the proposed weights OK or do you want to tune them (e.g. heavier on assessments for tech colleges)?
