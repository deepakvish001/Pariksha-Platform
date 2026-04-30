## Goal

Turn the current admin panel (currently limited to coding problems, bulk import, publish history, audit log) into a **full ownership control center** where the admin can manage every meaningful surface of Byteskill: users, roles, content, AI, moderation, notifications, and platform analytics — without ever needing to open the Lovable Cloud dashboard.

## What admins will get

The Admin sidebar will be reorganized into 6 functional groups:

```text
Overview
├── Dashboard (KPIs, health, recent activity)

Content
├── Coding Problems       (existing)
├── Bulk Import           (existing)
├── Publish History       (existing)
├── AI Generated Content  (NEW — moderate community gallery)
└── Featured / Staff Picks (NEW — curate landing + community)

People
├── Users                 (NEW — search, view, suspend, impersonate-readonly)
├── Roles & Permissions   (NEW — grant/revoke admin / moderator)
└── Followers & Reports   (NEW — abuse reports queue)

Engagement
├── Daily Challenge       (NEW — pick problem-of-the-day, schedule)
├── Achievements          (NEW — toggle visibility, recompute)
├── Leaderboards          (NEW — hide users, recompute snapshots)
└── Notifications Broadcast (NEW — push announcement to all users)

Platform
├── Feature Flags         (NEW — toggle features without deploys)
├── Site Settings         (NEW — landing copy, banners, maintenance mode)
└── Storage Browser       (NEW — list/delete files in problem-assets etc.)

System
├── Audit Log             (existing — expanded with filters)
├── Edge Function Logs    (NEW — recent invocations + errors)
└── Backups & Exports     (NEW — CSV export of any table)
```

### 1. Admin Dashboard (upgrade `AdminOverview`)
- KPI cards: total users, DAU (last 24h), WAU, total submissions, accepted today, AI content generated, open reports.
- Charts (recharts, already used): submissions per day (30d), signups per day, top 5 problems by attempts.
- "Needs attention" panel: drafts > 30 days old, problems with 0 hidden tests, users flagged by reports, failed edge function calls.
- Quick actions: New problem, Broadcast notification, Pick today's daily challenge.

### 2. Users management
- Searchable table over `profiles` + `user_profiles_extended` + `user_roles` + auth emails (joined view).
- Columns: avatar, name, username, email, joined, last seen (max `user_activity_log.created_at`), level/XP, role badges, status.
- Row actions: View public profile, View activity timeline, Grant/Revoke admin, Grant/Revoke moderator, Suspend (new `is_suspended` flag on `user_profiles_extended`), Reset XP, Delete account (cascades).
- Bulk actions: export selected as CSV, send notification to selection.

### 3. Roles & Permissions
- Dedicated page listing every admin / moderator with grant date and grantor (from `admin_audit_log`).
- "Add by email" flow that resolves email to user_id then inserts into `user_roles`.
- All grants go through new RPC `admin_grant_role(_user_id, _role)` / `admin_revoke_role` that writes to `admin_audit_log`.

### 4. AI Generated Content moderation
- Table over `ai_generated_content` with filters (type, public/private, likes, reports).
- Preview drawer rendering the JSONB content.
- Actions: Force-private, Delete, Feature on community, Mark as Staff Pick.

### 5. Daily Challenge curator
- Calendar view (next 30 days). For each day pick a problem from `coding_problems` (autocomplete).
- Stored in new table `admin_daily_challenge_schedule (challenge_date, problem_slug, set_by, created_at)`.
- Existing client picker already reads daily challenge — wire it to prefer the scheduled slug, fall back to current logic.

### 6. Notifications Broadcast
- Compose form (title, message, optional CTA URL, audience filter: all / role / level >= N / single user).
- Sends via new edge function `admin-broadcast-notification` that fan-outs into `notifications` table in batches.
- Preview pane shows how the toast / notification bell entry will look.

### 7. Feature Flags & Site Settings
- New table `platform_settings (key text PK, value jsonb, updated_by, updated_at)`.
- UI: grouped toggles + key/value editor for things like `maintenance_mode`, `signup_open`, `landing_banner_text`, `featured_roadmap_slug`, `daily_challenge_enabled`.
- Read via lightweight `usePlatformSetting(key)` hook (cached), gated writes via admin-only RPC `admin_set_setting`.

### 8. Storage Browser
- Lists Supabase storage buckets the admin owns (`problem-assets`, avatars, etc.) using existing `supabase.storage.from(...).list(...)`.
- Folder breadcrumbs, search, preview (image/text), copy URL, delete (admin-only RLS already in place).
- Re-uses the gallery components built for the markdown editor.

### 9. Audit Log (expanded)
- Filters: actor, action, entity_type, date range. CSV export.
- Detail drawer renders the `diff` JSONB nicely.

### 10. Edge Function Logs viewer
- Read-only page hitting a new RPC that returns last 200 rows of edge function invocations from `supabase_functions.hooks` (or, if unavailable, from a new `edge_function_invocations` log table that the most-used functions write into).
- Filter by function name + success/error.

### 11. Backups & Exports
- One-click CSV export of any whitelisted table (`coding_problems`, `quiz_results`, `user_activity_log`, …) via an admin RPC that streams JSON to the client which converts to CSV.
- "Snapshot now" button that calls `snapshot_my_coding_leaderboard_rank` for all visible users (admin-only batch RPC).

### 12. Reports / Moderation queue
- New table `content_reports (id, reporter_id, target_type, target_id, reason, status, created_at, resolved_by, resolved_at)`.
- "Report" buttons on AI content + public profiles populate this; admin queue with Approve / Dismiss / Ban author actions.

## Technical details

### New database objects (one migration)

```sql
-- Settings
create table public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.platform_settings enable row level security;
create policy "settings public read" on public.platform_settings for select using (true);
create policy "settings admin write" on public.platform_settings for all
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- Daily challenge schedule
create table public.admin_daily_challenge_schedule (
  challenge_date date primary key,
  problem_slug text not null references public.coding_problems(slug) on delete cascade,
  set_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.admin_daily_challenge_schedule enable row level security;
create policy "dcs read" on public.admin_daily_challenge_schedule for select using (true);
create policy "dcs admin write" on public.admin_daily_challenge_schedule for all
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- Suspensions
alter table public.user_profiles_extended
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_reason text,
  add column if not exists suspended_at timestamptz;

-- Reports
create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,        -- 'ai_content' | 'profile' | 'comment' | ...
  target_id text not null,
  reason text not null,
  status text not null default 'open',  -- open | resolved | dismissed
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz
);
alter table public.content_reports enable row level security;
create policy "report own insert" on public.content_reports for insert
  with check (auth.uid() = reporter_id);
create policy "report admin read" on public.content_reports for select
  using (public.has_role(auth.uid(),'admin'));
create policy "report admin update" on public.content_reports for update
  using (public.has_role(auth.uid(),'admin'));
```

### New RPCs (all `SECURITY DEFINER`, gated via `has_role(_, 'admin')`)
- `admin_list_users(_search, _limit, _offset)` — joined view of profiles + roles + last_active + email (from `auth.users`).
- `admin_grant_role(_user_id, _role)` / `admin_revoke_role(_user_id, _role)` — writes to `admin_audit_log`.
- `admin_suspend_user(_user_id, _reason)` / `admin_unsuspend_user(_user_id)`.
- `admin_set_setting(_key, _value)`.
- `admin_broadcast_notification(_audience jsonb, _title, _message, _data)` — inserts into `notifications` for matching users; capped at 50k per call.
- `admin_export_table(_table text)` — returns rows for whitelisted tables only.

### Edge functions
- `admin-broadcast-notification` — wraps the RPC plus optional email blast through existing `send-notification-email` (re-uses Resend secret).
- No new secrets required.

### Frontend structure
- Extend `src/components/admin/AdminShell.tsx` NAV array with the new groups (use collapsible `<Collapsible>` sections so the sidebar stays tidy).
- New pages under `src/pages/admin/`:
  - `AdminDashboard.tsx` (replaces overview), `Users.tsx`, `UserDetail.tsx`, `Roles.tsx`, `AIContentModeration.tsx`, `DailyChallengeSchedule.tsx`, `Broadcast.tsx`, `FeatureFlags.tsx`, `SiteSettings.tsx`, `StorageBrowser.tsx`, `EdgeFunctionLogs.tsx`, `Backups.tsx`, `Reports.tsx`.
- New hooks under `src/hooks/admin/`:
  - `useAdminUsers`, `useAdminRoles`, `useAdminAIContent`, `useDailyChallengeSchedule`, `useBroadcast`, `usePlatformSettings`, `useStorageBrowser`, `useReports`, `useEdgeLogs`.
- New components: `<UserDrawer/>`, `<ReportRow/>`, `<SettingEditor/>`, `<BroadcastComposer/>`, `<DailyChallengeCalendar/>`, `<KpiCard/>`, `<TrendChart/>`.
- Routes added in `src/App.tsx` under `<AdminRoute>` wrapper (already exists).

### Reused infra
- `useUserRole.isAdmin` for client gating; every action is double-checked server-side.
- `react-query` for caching; existing `toast` for feedback.
- `recharts` (already in deps) for charts.
- `react-day-picker` (already in shadcn) for the daily-challenge calendar.

### Out of scope (follow-ups)
- True user impersonation (requires service-role; we'll stick to read-only "view as").
- In-app A/B testing.
- Webhook management UI.

## Step-by-step build order

1. **Migration**: create `platform_settings`, `admin_daily_challenge_schedule`, `content_reports`, suspension columns, all admin RPCs.
2. **Sidebar regroup**: refactor `AdminShell.tsx` with collapsible groups + new icons; wire routes in `App.tsx`.
3. **Dashboard**: build KPI cards + 2 charts on `AdminDashboard.tsx`.
4. **Users + Roles + Suspensions**: list page, detail drawer, role grant/revoke, suspend.
5. **Reports queue** + "Report" button hooks on AI content cards & public profiles.
6. **AI Content Moderation** page.
7. **Daily Challenge Schedule** calendar; update existing daily-challenge resolver to prefer scheduled slug.
8. **Broadcast Notifications** (RPC + edge function + composer UI).
9. **Feature Flags / Site Settings** page + `usePlatformSetting` hook; thread `maintenance_mode` and `signup_open` into the app shell.
10. **Storage Browser** reusing gallery components.
11. **Edge Function Logs** + **Backups/Exports**.
12. **Audit Log** filters + CSV export.
13. Smoke test: every page gated by `AdminRoute`, every RPC re-checks `has_role`, audit entries written for state-changing actions.

## Communication note
I'll build this in stages and ship after each numbered step so you can review incrementally rather than waiting for the whole thing. Given the size, I recommend approving the plan and then telling me which 2–3 sections you want first (Dashboard + Users + Daily Challenge are the highest-leverage starting trio).
