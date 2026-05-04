# Batch D — Post-contest forensics

Builds on Batches A–C. All three pieces below ride on tables already created in Batch C (`contest_code_provenance`, `contest_solve_time_analysis`, `contest_cross_similarity`, `contest_integrity_reports`) and the existing `contest_proctor_findings`, `contest_screen_audits`, `contest_network_audit`, `contest_keystroke_samples`, `contest_mouse_metrics`. **No new migrations.**

## 1. Code Timeline Replay

A scrubbable timeline of every captured editing event for a session.

- New component `src/components/admin/contests/CodeTimelineReplay.tsx`
- Pulls up to 2000 rows from `contest_code_provenance` ordered by `server_ts`
- Renders a horizontal track with colored marks per event type:
  - red = suspicious paste, amber = paste, orange = delete-burst, blue = snapshot
- Top stats: total typed chars, total pasted chars, paste count, large-paste count, delete-burst count, paste/total ratio (highlighted red if > 40%)
- Slider + clickable marks let admin scrub to any event; details panel shows JSON of `diff_summary`, char/paste counts and reason

## 2. Session Forensics Dashboard

Per-session aggregator at `/admin/contests/sessions/:sessionId/forensics`.

- New page `src/pages/admin/contests/AdminSessionForensics.tsx`
- Loads the `contest_sessions` row plus row-counts and full data from:
  `contest_proctor_findings`, `contest_screen_audits`, `contest_network_audit`, `contest_keystroke_samples`, `contest_mouse_metrics`, `contest_solve_time_analysis`, `contest_cross_similarity`
- 7 stat cards across the top, then tabs:
  - **Code timeline** → embeds `CodeTimelineReplay`
  - Proctor / Screen / Network / Solve / Cross-sim → raw JSON cards with severity / verdict badges
- "Propose DQ" button inserts into `contest_dq_signoffs` with current counts as evidence (triggers admin alert + second-admin sign-off flow from Batch C)
- Route registered in `src/App.tsx` under the admin `<Route>` group

## 3. Auto Integrity Report Generator

Edge function + admin trigger that fills `contest_integrity_reports`.

- New edge function `supabase/functions/contest-integrity-report-generate/index.ts`
  - Verifies caller is admin via `has_role` RPC
  - Aggregates per-contest counts: total sessions, flagged (alerts severity ≥ high), DQs (sign-offs status='approved'), viva entries
  - Builds `summary` JSONB with breakdowns: alert_type, solve_verdict, cross-sim source, DQ reasons
  - Upserts `contest_integrity_reports` keyed on `contest_id`; optional `publish: true` body flag flips `is_published` and stamps `published_at`
- Admin trigger button: small "Generate Report" / "Generate & Publish" pair on the existing `AdminContestProctor` page (top-right), invoking the function and toasting the result

## Optional sidebar entry

Add a "Session Forensics" link only as a deep-link from the existing proctor view (no top-level sidebar item) — the page expects a session id.

## Files

```text
new   supabase/functions/contest-integrity-report-generate/index.ts
new   src/components/admin/contests/CodeTimelineReplay.tsx
new   src/pages/admin/contests/AdminSessionForensics.tsx
edit  src/App.tsx                                       (route)
edit  src/pages/admin/contests/AdminContestProctor.tsx  (Generate Report buttons + per-row "Forensics" link)
```

## Acceptance

- Visiting `/admin/contests/sessions/<id>/forensics` shows all signal counts and tabs with data
- Code timeline scrubs through provenance with paste/delete spikes visible
- Clicking "Propose DQ" creates a `contest_dq_signoffs` row that appears on `/admin/contests/dq-signoffs`
- Clicking "Generate Report" on a contest creates/updates `contest_integrity_reports`; "Generate & Publish" makes it visible at `/contests/:contestId/integrity`