

# Make All Features Publicly Accessible (Login Required Only for Tracking Actions)

## Overview
Currently, all dashboard/library/research/platform routes are wrapped in `ProtectedRoute`, requiring login to even view content. The goal is to make everything viewable without login, but prompt login when users try to perform tracked actions (mark progress, like, save, generate AI content, etc.).

## Architecture Change

### 1. Remove ProtectedRoute from Content Routes
- Replace `DashboardLayoutWrapper` (which wraps everything in `ProtectedRoute`) with a new `PublicDashboardLayoutWrapper` that renders `DashboardLayout` without auth gating
- Keep `ProtectedRoute` only for truly personal pages: Settings, Profile, Notifications, Onboarding

### 2. Create a `useRequireAuth` Hook
A reusable hook that checks if user is logged in before performing an action. If not logged in, shows a login prompt dialog/toast and redirects to login.

```text
useRequireAuth() → { requireAuth: (callback) => void, user, LoginPromptDialog }
- If user exists: executes callback immediately
- If no user: shows modal "Sign in to continue" with Login/Signup buttons
```

### 3. Create `LoginPromptDialog` Component
A modal dialog that appears when unauthenticated users try to perform tracked actions. Shows a message like "Sign in to track your progress" with Login and Sign Up buttons.

### 4. Update All Action Handlers Across the App
Wrap tracked/interactive actions with `requireAuth()`:
- **Progress tracking**: marking topics solved/completed, sheet progress checkboxes
- **Likes**: LikeButton component already has a toast for this, upgrade to dialog
- **AI generation**: generating content, saving content
- **Quiz**: saving quiz results, quiz history
- **Collections**: creating/managing folders
- **Resume**: uploading/analyzing resumes, downloading templates (tracked)
- **Outreach**: copying templates (tracked)
- **Chat**: Astra AI, Roadmap Chat
- **Settings/Profile**: already protected, keep as-is
- **Achievements/XP**: viewing personal achievements page
- **Streak/Activity**: personal activity feed

### 5. Update DashboardSidebar
- Show sidebar to all users (logged in or not)
- Hide personal sections (My Activity, Profile, etc.) for unauthenticated users OR show them but redirect to login on click
- Show sign-in button in sidebar for unauthenticated users

### 6. Route Changes in App.tsx

**Keep protected** (require login to even view):
- `/onboarding`
- `/settings`
- `/dashboard/profile`
- `/dashboard/notifications`
- `/dashboard/notifications/preferences`
- `/dashboard/achievements`

**Make public** (viewable without login):
- `/dashboard` (main dashboard - show read-only view)
- `/dashboard/sheets`, `/dashboard/sheets/:sheetId`
- All `/library/*` routes
- All `/fundamentals/*` routes
- All `/system-design/*` routes
- All `/research/*` routes (except activity)
- `/platform/ai/community`, `/platform/ai/staff-picks`, `/platform/ai/content/:id`
- `/platform/resources`

**Require login on action** (viewable but actions gated):
- `/platform/ai/generate`, `/platform/ai/my-*` pages
- `/platform/ai` (Astra chat)
- `/platform/ai/roadmap-chat`
- `/platform/collections`
- `/research/activity`
- `/research/analyser` (upload action)

## Technical Details

### New Files
- `src/hooks/useRequireAuth.ts` - Hook returning `requireAuth` wrapper + dialog state
- `src/components/LoginPromptDialog.tsx` - Reusable login prompt modal

### Modified Files
- `src/App.tsx` - Split routes into public (new `PublicDashboardLayout`) and protected groups
- `src/components/DashboardLayout.tsx` - Remove auth dependency, work for all users
- `src/components/DashboardSidebar.tsx` - Show login CTA for guests, conditionally show personal items
- `src/components/ProtectedRoute.tsx` - Keep for personal-only routes
- `src/hooks/useSheetProgress.ts` - Gate mutations with auth check
- `src/hooks/useContentLike.ts` - Already has toast, upgrade to dialog
- `src/hooks/useStreak.ts`, `useXPSystem.ts` - Skip for unauthenticated users
- `src/components/ai/LikeButton.tsx` - Use LoginPromptDialog
- Various progress/action components - Add `requireAuth` gate before mutations

### Key Pattern
```typescript
// useRequireAuth hook usage
const { requireAuth, LoginPromptDialog } = useRequireAuth();

const handleSolve = () => {
  requireAuth(() => {
    // actual tracking logic
    toggleSolved(topicId);
  });
};

return (
  <>
    <Button onClick={handleSolve}>Mark Solved</Button>
    <LoginPromptDialog />
  </>
);
```

## Implementation Order
1. Create `useRequireAuth` hook and `LoginPromptDialog`
2. Create `PublicDashboardLayout` wrapper (no ProtectedRoute)
3. Update `App.tsx` routes - split public vs protected
4. Update `DashboardSidebar` for guest users
5. Update key action components to use `requireAuth` gate
6. Test all flows end-to-end

