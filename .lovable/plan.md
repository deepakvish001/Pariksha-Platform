
# Real-Time Activity Dashboard Implementation Plan

## Overview
Transform the static My Activity page into a dynamic, real-time activity feed that aggregates user actions from multiple data sources and updates live as new activities occur.

## What We'll Build

### 1. Create a Unified Activity Feed
A new database table to store all user activities in one place, making it easy to query and display a chronological timeline.

### 2. Real-Time Updates
When you complete a quiz, earn XP, or unlock an achievement on another device or tab, the activity feed will update instantly without refreshing the page.

### 3. Aggregated Stats
Dynamic statistics cards showing:
- Problems solved (from DSA/SQL/Interview progress)
- Quizzes completed (from quiz results)
- Templates used (from resume downloads + outreach usage)
- XP earned this week

### 4. Visual Activity Timeline
A beautiful timeline showing your recent learning activities with:
- Activity type icons and badges
- Relative timestamps ("2 hours ago")
- Activity-specific details (quiz scores, topics completed, achievements unlocked)

---

## Technical Implementation

### Step 1: Create Activity Logging Table

Create a new `user_activity_log` table to centralize all activity tracking:

```text
┌─────────────────────────────────────────────────────────┐
│                   user_activity_log                      │
├─────────────────────────────────────────────────────────┤
│ id           │ UUID (primary key)                       │
│ user_id      │ UUID (not null)                          │
│ activity_type│ TEXT (quiz, topic, achievement, xp, etc) │
│ title        │ TEXT (human-readable title)              │
│ description  │ TEXT (additional details)                │
│ metadata     │ JSONB (score, category, etc)             │
│ created_at   │ TIMESTAMPTZ (auto)                       │
└─────────────────────────────────────────────────────────┘
```

Enable realtime for this table and add RLS policies for user-only access.

### Step 2: Create Database Triggers

Add triggers on existing tables to automatically log activities:

- **Quiz completed** → Log when a row is inserted into `quiz_results`
- **Achievement unlocked** → Log when a row is inserted into `user_achievements`
- **XP earned** → Log when a row is inserted into `xp_transactions`
- **Topic completed** → Log when `completed` changes to `true` in `user_topic_progress`

### Step 3: Create Activity Hook (`useActivityFeed.ts`)

```text
┌────────────────────────────────────────┐
│           useActivityFeed              │
├────────────────────────────────────────┤
│ • Fetches recent activities            │
│ • Subscribes to realtime channel       │
│ • Auto-updates on new activities       │
│ • Calculates aggregated stats          │
│ • Provides loading/error states        │
└────────────────────────────────────────┘
```

Key features:
- Use Supabase Realtime channel for `postgres_changes` on `user_activity_log`
- Filter by user_id using channel filter
- Prepend new activities to the list with animation
- Calculate stats from aggregated queries

### Step 4: Create Stats Aggregation Hook (`useActivityStats.ts`)

Aggregate statistics from multiple sources:

```text
Stats Queries:
├── Problems Solved: COUNT from user_company_progress WHERE solved=true
├── Quizzes Completed: COUNT from quiz_results
├── Weekly XP: SUM from xp_transactions (last 7 days)
├── Achievements: COUNT from user_achievements
└── Streak: From existing useStreak hook
```

### Step 5: Update MyActivity Page Components

**ActivityFeedItem Component:**
- Dynamic icon based on activity type
- Animated entrance for new items
- Type-specific badge colors
- Relative time display with auto-refresh

**Stats Cards:**
- Real count values instead of hardcoded
- Week-over-week change calculation
- Loading skeletons

**Activity Timeline:**
- Grouped by date (Today, Yesterday, This Week, Earlier)
- Infinite scroll or "Load More" button
- Empty state for new users

---

## File Changes Summary

| Action | File | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/xxx_create_activity_log.sql` | New table + triggers |
| Create | `src/hooks/useActivityFeed.ts` | Realtime activity hook |
| Create | `src/hooks/useActivityStats.ts` | Aggregated stats hook |
| Create | `src/components/activity/ActivityFeedItem.tsx` | Individual activity card |
| Create | `src/components/activity/ActivityStats.tsx` | Stats grid component |
| Update | `src/pages/research/MyActivity.tsx` | Integrate new components |

---

## Activity Types Supported

| Type | Source Table | Title Example |
|------|--------------|---------------|
| `quiz_complete` | quiz_results | "Completed DSA Quiz" |
| `achievement` | user_achievements | "Unlocked First Steps badge" |
| `xp_earned` | xp_transactions | "Earned 25 XP" |
| `topic_complete` | user_topic_progress | "Completed Arrays topic" |
| `resume_download` | resume_downloads | "Downloaded Modern Template" |
| `outreach_copy` | outreach_usage | "Copied LinkedIn template" |

---

## Realtime Flow Diagram

```text
User Action (e.g., completes quiz)
         │
         ▼
┌─────────────────────┐
│   quiz_results      │ ◄── INSERT
│   (table)           │
└─────────────────────┘
         │
         ▼ (trigger fires)
┌─────────────────────┐
│  user_activity_log  │ ◄── AUTO INSERT
│   (table)           │
└─────────────────────┘
         │
         ▼ (realtime broadcast)
┌─────────────────────┐
│  Supabase Realtime  │
│     Channel         │
└─────────────────────┘
         │
         ▼ (useActivityFeed receives)
┌─────────────────────┐
│   MyActivity Page   │ ◄── UI Updates instantly
│   (React)           │
└─────────────────────┘
```

---

## User Experience

1. **Instant Feedback**: Complete a quiz → see it appear in the activity feed immediately
2. **Cross-Device Sync**: Activity logged on mobile shows on desktop in real-time
3. **Accurate Stats**: All numbers reflect actual database counts
4. **Engaging Design**: Animated entries, color-coded badges, and a clean timeline
