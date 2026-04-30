## Goal

Today's admin covers coding problems, users, roles, AI content moderation, daily challenge, broadcast, reports, settings/flags, storage, audit log, edge logs, exports, system health, and cron jobs.

To make Byteskill **fully manageable from /admin**, we'll add 11 new surfaces that close the remaining gaps: curated content, gamification rules, communications, user-support tooling, and security visibility.

## New admin pages (grouped into existing sidebar)

```text
Content
├── Featured / Staff Picks         (NEW) — curate landing + community gallery
├── Library Curation               (NEW) — toggle DSA / SQL / Aptitude / Interview Q visibility
└── Roadmaps Manager               (NEW) — publish/unpublish roadmaps, set "Featured" roadmap

Engagement
├── Achievements Manager           (NEW) — toggle, recompute, manually award
├── Leaderboards Admin             (NEW) — hide users, force-snapshot, reset weekly
└── Gamification Rules             (NEW) — XP weights, level thresholds, streak-freeze policy

People
├── User Detail Drawer (upgrade)   — activity timeline, XP history, suspend, impersonate-readonly
└── Support Inbox                  (NEW) — contact form / feedback queue with reply-via-email

Communications
├── Email Templates                (NEW) — edit subject/body for digest, SRS reminder, etc.
└── Notification Preferences Admin (NEW) — global defaults + per-user override

Security
└── Security Center                (NEW) — failed-login attempts, role grants, suspicious activity feed
```

## Per-page scope

### 1. Featured / Staff Picks
- Pick AI content + roadmaps + problems to feature on landing & community.
- Backed by new `featured_content (slot text PK, target_type, target_id, weight, starts_at, ends_at)`.

### 2. Library Curation
- Master switches per category (DSA, SQL, Aptitude, Interview, CS Subjects, Notes) using `platform_settings` keys (`library.<cat>.enabled`).
- Hide individual hard-coded questions via new `library_hidden_items (category, item_id)`.

### 3. Roadmaps Manager
- Reads `roadmapsData`/`roadmapTreesData`; admin can toggle `is_published` per roadmap (new table `roadmap_overrides (roadmap_id PK, is_published, is_featured, sort_order)`).
- "Featured roadmap" slot drives the homepage card.

### 4. Achievements Manager
- Table view of all achievement IDs (from code) joined with `user_achievements` counts.
- Actions: hide achievement (`platform_settings` key), recompute for a user (calls existing achievement-evaluation RPC), manually grant via `admin_grant_achievement(_user_id,_id)`.

### 5. Leaderboards Admin
- Tabs: XP, Coding, Streak, Daily Challenge.
- Actions: hide user from leaderboards (new column `user_profiles_extended.leaderboard_hidden`), force snapshot (`snapshot_my_coding_leaderboard_rank` batched), reset weekly bucket.

### 6. Gamification Rules
- Form editor for XP weights (quiz pass, problem solved by difficulty, streak day, daily challenge).
- Stored in `platform_settings` key `gamification.rules` (jsonb); read by `useXPSystem`.
- Includes streak-freeze daily cap and level threshold table.

### 7. User Detail Drawer (upgrade)
- Click any user in `AdminUsers` to open a drawer with: profile summary, activity timeline (`user_activity_log`), XP history, role badges, completion stats.
- Inline actions: grant/revoke role, suspend/unsuspend, reset XP, "view as" (read-only impersonation that opens public profile in new tab), delete account (cascades).

### 8. Support Inbox
- New `support_messages (id, user_id nullable, email, subject, body, status, created_at, replied_at, replied_by)`.
- Queue with filters; "Reply" launches `mailto:` or sends via existing `send-notification-email` edge function.
- Public submit endpoint reused from existing contact form (will wire it to insert here).

### 9. Email Templates
- Editable subject/body for the 6 existing transactional emails (weekly digest, SRS reminder, study reminder, velocity reminder, quiz summary, resume score).
- Stored in `platform_settings` keys `email.<name>.{subject,body,enabled}`; each edge function reads via helper before falling back to baked-in copy.

### 10. Notification Preferences Admin
- Read/write defaults (everyone) + per-user overrides via existing `notification_preferences` table.
- Switch board: weekly digest, SRS reminders, achievements, broadcast pushes.

### 11. Security Center
- Read-only feed: recent role grants/revokes (from `admin_audit_log`), suspended users, recent failed logins (from auth schema via SECURITY DEFINER RPC `admin_recent_auth_events(_limit)`), users with abnormal activity (>N submissions/min via window query).
- Quick actions: revoke session, force-suspend.

## Technical details

### Database migration (one file)

```sql
-- Featured content
create table public.featured_content (
  slot text primary key,
  target_type text not null,
  target_id text not null,
  weight int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- Library hidden items
create table public.library_hidden_items (
  category text not null,
  item_id text not null,
  hidden_at timestamptz not null default now(),
  primary key (category, item_id)
);

-- Roadmap overrides
create table public.roadmap_overrides (
  roadmap_id text primary key,
  is_published boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- Support inbox
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  subject text not null,
  body text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  replied_at timestamptz,
  replied_by uuid references auth.users(id)
);

-- Leaderboard hide flag
alter table public.user_profiles_extended
  add column if not exists leaderboard_hidden boolean not null default false;

-- All new tables: enable RLS + admin-write / public-read where appropriate
-- (mirrors patterns in platform_settings / content_reports)
```

### New RPCs (SECURITY DEFINER, gated by `has_role(_, 'admin')`)
- `admin_grant_achievement(_user_id, _achievement_id)`
- `admin_recompute_achievements(_user_id)`
- `admin_recent_auth_events(_limit int)` — reads `auth.audit_log_entries`
- `admin_force_snapshot_leaderboard(_window text)` — batches `snapshot_my_coding_leaderboard_rank`
- `admin_reply_support(_message_id, _body)` — marks resolved + invokes email

### Edge functions
- `admin-reply-support` — wraps RPC + Resend (reuses existing secret).
- Update existing 6 email functions to read subject/body from `platform_settings` first.

### Frontend
- New pages under `src/pages/admin/`: `FeaturedContent.tsx`, `LibraryCuration.tsx`, `RoadmapsManager.tsx`, `AchievementsAdmin.tsx`, `LeaderboardsAdmin.tsx`, `GamificationRules.tsx`, `SupportInbox.tsx`, `EmailTemplates.tsx`, `NotificationPrefsAdmin.tsx`, `SecurityCenter.tsx`.
- Upgrade `AdminUsers.tsx` with a `<UserDrawer/>` (Sheet component) for inline actions.
- New hooks: `useFeaturedContent`, `useLibraryCuration`, `useRoadmapOverrides`, `useAdminAchievements`, `useLeaderboardsAdmin`, `useGamificationRules`, `useSupportInbox`, `useEmailTemplates`, `useNotificationPrefsAdmin`, `useSecurityCenter`.
- Extend `AdminShell.tsx` `GROUPS` with the new items + add a new "Communications" and "Security" group.
- Extend `useAdminSidebarBadges` to include support inbox open count and security alerts.

### Reuse
- `react-query` for caching, existing `toast`, `Sheet`, `Tabs`, `recharts`, `react-day-picker`.
- All actions audit-logged via `admin_audit_log`.

## Step-by-step build order

1. Migration: new tables + columns + admin RPCs.
2. Sidebar: regroup with Communications + Security; wire all 11 new routes in `App.tsx`.
3. Content trio: Featured / Library Curation / Roadmaps Manager.
4. Engagement trio: Achievements / Leaderboards / Gamification Rules.
5. People upgrade: User Detail Drawer in `AdminUsers`.
6. Communications: Support Inbox + Email Templates + Notification Prefs Admin (+ edge function changes).
7. Security Center.
8. Smoke test every RPC for `has_role` gating + audit entries.

## Notes
- I'll ship after each numbered step so you can review incrementally.
- Recommend approving and starting with **Steps 1–3** (migration + sidebar + Content trio), since those unlock the biggest day-to-day curation wins.
