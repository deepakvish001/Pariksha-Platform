## Goal

Make the Admin Control Center a true single pane of glass: every user-facing feature on Byteskill must be observable, configurable, and actionable from `/admin` with full CRUD/audit coverage.

## Current state — what already exists

```
ADMIN ROUTE                      STATUS                                NOTES
/admin                           ✓ working                             KPIs, trends
/admin/problems + /editor        ✓ working                             CRUD + tests + bulk
/admin/problems/import           ✓ working
/admin/publish-history           ✓ working
/admin/ai-content                ✓ working                             toggle public, delete
/admin/featured                  ✓ working                             slot CRUD
/admin/library-curation          ✓ working                             hide/unhide
/admin/roadmaps                  ✓ working                             publish/feature/order
/admin/users                     ✓ working                             search, drawer, XP, ban
/admin/roles                     ✓ working                             grant/revoke
/admin/reports                   ✓ working                             resolve content reports
/admin/daily-challenge           ✓ working                             schedule
/admin/broadcast                 ✓ working                             send to all
/admin/achievements              ✓ working (just hardened)             bulk + diff modal
/admin/leaderboards              ✓ working                             hide/snapshot
/admin/gamification              ✓ working                             validated + history
/admin/support                   ✓ working                             inbox
/admin/settings                  ✓ working                             flag CRUD
/admin/storage                   ✓ working                             list/delete files
/admin/security                  ✓ working                             auth events
/admin/system-health             ✓ working
/admin/cron-jobs                 ✓ working                             read-only
/admin/audit                     ✓ working                             filterable
/admin/edge-logs                 ✓ working                             tail
/admin/exports                   ✓ working                             CSV
```

## Coverage gaps (user-facing features with NO admin control today)

1. **Notifications** — `notifications` + `push_subscriptions` tables: no admin view, no per-user inspection, no template/digest controls.
2. **Quizzes & SRS** — `quiz_results`, `quiz_question_responses`, `quiz_spaced_repetition`: no global stats view, no ability to delete malformed sessions or reset SRS for a user.
3. **Resume system** — `resume_analyses`, `resume_downloads`, `resume_favorites`: zero admin visibility (cost & abuse risk for AI scoring).
4. **Cold Outreach** — `outreach_custom_templates`, `outreach_favorites`, `outreach_usage`: no curation of user templates or usage analytics.
5. **Folders & sharing** — `user_folders`, `shared_folders`: no way to revoke a public share link or audit shared content.
6. **Daily challenge** — completions table + opt-in leaderboard exist, but `/admin/daily-challenge` only schedules; no completion/leaderboard inspection or unschedule.
7. **Coding submissions** — `code_submissions`, `code_runs`, `code_drafts`: no admin viewer (judge debugging, abuse hunting).
8. **Conversations / chat** — `conversations`, `chat_messages` (Byteskill AI): no usage stats, no per-user purge.
9. **Email & deliverability** — Resend used by edge functions, but nothing in admin shows queue / bounces / failures.
10. **Realtime channels & cache** — no kill-switch / TanStack invalidation broadcast.
11. **User drawer gaps** — drawer shows XP/achievements/audit but not: notifications, quiz history, resume uploads, conversations, force-logout.
12. **Daily challenge & broadcast scheduling** — broadcasts are immediate only; no scheduled/recurring broadcasts and no targeting (e.g., "all users with XP > N").
13. **Bulk role ops** — roles page is one-by-one; no CSV import, no bulk grant.
14. **Audit log retention & export** — no purge, no scheduled export.
15. **Feature flags UX** — current flag editor is a raw JSON textarea; no typed schema, no environment-scoped toggles, no rollout %.
16. **Support inbox** — no canned replies, no assignment, no SLA timer.

Plus a verification pass on all "✓ working" pages to confirm hooks aren't stubs and RPCs return real data.

## What we'll build

### A. New admin sections (7 new pages)

```
/admin/notifications        — global notification log, per-user filter, resend, push-subscription audit, broadcast templates
/admin/quizzes              — quiz attempts table (filterable), top categories, accuracy distribution, reset SRS, delete attempt
/admin/resumes              — analyses + downloads + favorites; per-user usage; delete file from storage on row delete
/admin/outreach             — user-created templates list (search, hide, delete), top templates by copies, weekly trend
/admin/folders              — folders + shared_folders; revoke share link, force-private, view contents
/admin/submissions          — code_submissions feed + per-problem acceptance, per-user history, rerun a submission
/admin/conversations        — chat usage stats, per-user purge, top topics
/admin/email                — Resend deliverability dashboard via edge function (sent, delivered, bounced, complaints), test send
/admin/realtime             — list active realtime channels, broadcast cache-invalidation event, force-logout target user
```

### B. Enhancements to existing sections

- **AdminUserDrawer**: add tabs for Notifications · Quizzes · Resumes · Conversations · Sessions, plus a "Force logout" and "Send DM notification" button.
- **Daily Challenge**: add list of past challenges + completion counts, unschedule, opt-in leaderboard preview.
- **Broadcast**: schedule for later (`scheduled_broadcasts` table), targeting filters (role, min XP, registered after), draft/preview, send test to admin first.
- **Roles**: bulk grant/revoke via CSV/multi-user picker, recently-changed audit strip.
- **Audit Log**: retention slider (auto-purge >N days), download filtered slice.
- **Feature Flags**: typed registry (boolean / number / json) + per-key inline editor with validation, rollout percentage.
- **Support Inbox**: assign-to-admin, status workflow (open → in_progress → resolved), canned replies stored in `support_canned_replies`.
- **Storage**: rename + move + signed-URL preview for non-public buckets.
- **Reports**: bulk resolve, attach action note that auto-creates an audit row, "ban reporter" guardrail.
- **System Health**: edge function uptime per-name, recent error count, DB connection count.
- **Achievements**: import/export catalog as JSON.
- **Leaderboards**: rebuild snapshot for a date range, recompute weekly XP.

### C. Cross-cutting infra

- **Single `admin_*` RPC family** for any new mutation (admin-only, audited).
- **Audit auto-write** trigger wrapper: every new admin RPC inserts to `admin_audit_log` with a structured `diff`.
- **Server-side validation**: zod-shaped JSON checks in the same shape as `gamificationRules.ts` (extracted to `src/lib/admin/`).
- **Realtime invalidation**: a `admin_broadcast_invalidate` RPC that emits a Supabase realtime payload consumed by a global QueryClient listener.
- **Admin-only edge functions**: `admin-email-stats` (Resend API), `admin-resend-broadcast` (Resend send), `admin-rerun-submission`, `admin-process-scheduled-broadcasts` (cron).

## Database changes (one migration)

```
TABLE scheduled_broadcasts(id, title, message, target_filter jsonb, scheduled_for, sent_at, created_by)
TABLE support_canned_replies(id, label, body, created_by)
TABLE admin_feature_flag_registry(key PK, type text, schema jsonb, description, rollout_pct)
TABLE admin_session_invalidations(id, user_id, reason, created_by, created_at)   -- forces logout
ALTER  notifications ADD COLUMN sent_by_admin uuid NULL
ENABLE pg_cron job: process-scheduled-broadcasts every minute
```

Plus ~25 new SECURITY DEFINER RPCs (`admin_list_notifications`, `admin_resend_notification`, `admin_purge_user_conversations`, `admin_force_logout`, `admin_email_stats`, `admin_revoke_share`, `admin_delete_quiz_attempt`, `admin_reset_srs`, `admin_list_resumes`, `admin_delete_resume`, `admin_list_outreach`, `admin_hide_outreach_template`, `admin_list_folders`, `admin_list_submissions`, `admin_rerun_submission`, `admin_list_conversations`, `admin_chat_usage_stats`, `admin_schedule_broadcast`, `admin_cancel_scheduled_broadcast`, `admin_canned_reply_*`, `admin_flag_registry_*`, `admin_purge_audit_older_than`, `admin_storage_rename`, `admin_storage_move`, `admin_export_achievements`, `admin_import_achievements`).

All follow the hardened pattern: `EXECUTE` granted only to `authenticated`, `has_role(auth.uid(),'admin')` enforced inside, every mutation writes to `admin_audit_log`.

## Verification pass — done as part of the work

For every existing admin page, an automated walkthrough:

1. Page renders without console errors as admin.
2. Page is forbidden for non-admin (RLS + UI gate).
3. Each button triggers the expected RPC and an audit row appears.
4. Network tab shows no 4xx beyond explicit forbidden test.
5. Add a row to `mem://features/admin/control-center` listing each section's verified date.

A `docs/admin-coverage.md` matrix will list every user-facing feature, its admin route, and the verified actions (view / edit / delete / audit).

## Suggested execution order (to keep PRs reviewable)

1. Migration + new RPCs + audit wrapper (DB only).
2. AdminUserDrawer expansion (highest leverage).
3. Notifications + Email + Realtime pages (ops critical).
4. Quizzes + Resumes + Submissions + Conversations + Outreach + Folders pages.
5. Enhancements to Broadcast (scheduling), Flags (registry), Roles (bulk), Support (canned replies), Reports (bulk).
6. Verification walkthrough + coverage doc + memory update.

## Out of scope / explicit non-goals

- Multi-tenant / org-level admin (single global admin role only).
- Self-serve developer API keys.
- Stripe/Paddle billing dashboards (no payments enabled yet).
- Rewriting the existing admin pages that already work — only enhancements listed above.

## Open question (will ask after approval if unclear)

Do you want **scheduled broadcasts** to support recurring sends (e.g., weekly digest) on day 1, or only one-shot scheduled? Defaults to one-shot to keep scope tight. whichever will be good as a brand.,