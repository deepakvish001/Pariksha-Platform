
# Settings Page Complete Redesign Plan

## Overview
Transform the Settings page into a premium, immersive experience with a deep black background (`#030305`), animated gradient orbs, glassmorphism components, and a modular architecture matching the Astra AI, Resources, and Collections pages.

## Current State Analysis
The existing Settings page has:
- Light/default background (`bg-background`)
- 5-tab structure: Profile, Security, Notifications, Learning, Account
- Inline tab content with `card-dark` styling
- Functional features: avatar upload, profile editing, password change, notification toggles, SRS settings, account deletion
- 1,162 lines in a single monolithic file

## Design Goals
- Deep black background (`#030305`) with animated gradient orbs
- Glassmorphism header and tab panels (`bg-black/40 backdrop-blur-3xl`)
- Modular component architecture (split into separate files)
- Enhanced visual hierarchy and micro-interactions
- Staggered animations for settings items
- Consistent styling with other redesigned pages
- Real-time sync indicators for settings changes

---

## Implementation Steps

### Step 1: Page Shell and Background
Integrate the Astra-style background:
- Use `AstraBackground` component for consistency
- Deep black base with animated gradient orbs
- Sticky glassmorphism header with sidebar trigger

### Step 2: Redesigned Header
Create `SettingsHeader.tsx`:
- Glassmorphism styling (`bg-black/40 backdrop-blur-3xl border-white/[0.05]`)
- Settings icon with glow effect
- User info badge (name, email)
- Theme toggle with smooth animation
- Stats badges (member since, XP level)

### Step 3: Enhanced Tab Navigation
Create `SettingsTabNav.tsx`:
- Glassmorphism tab list with pill indicators
- Animated active tab indicator (underline/glow)
- Icons with color coding per tab
- Mobile-optimized horizontal scroll

### Step 4: Profile Tab Redesign
Create `SettingsProfileTab.tsx`:
- Avatar section with upload overlay and glow ring
- Glassmorphism cards for basic info, professional details
- Animated form fields with focus states
- Skill/interest chips with add/remove animations
- Save button with loading state

### Step 5: Security Tab Redesign
Create `SettingsSecurityTab.tsx`:
- Password change form with glassmorphism container
- Enhanced password strength indicator (animated bars)
- Two-factor authentication section (future-ready placeholder)
- Session management display
- Security tips card

### Step 6: Notifications Tab Redesign
Create `SettingsNotificationsTab.tsx`:
- Push notification toggle with status indicator
- Email preferences with category icons
- Notification type grid with color-coded icons
- Select All / Deselect All bulk actions
- Visual feedback on toggle changes

### Step 7: Learning Tab Redesign
Create `SettingsLearningTab.tsx`:
- XP Level Badge with enhanced styling
- Spaced repetition settings with visual slider
- Review interval visualization (timeline graphic)
- Mastery threshold with progress preview
- Learning statistics summary

### Step 8: Account Tab Redesign
Create `SettingsAccountTab.tsx`:
- Account status card with active badge
- Member since with calendar icon
- Data export section (future-ready)
- Danger zone with red border accent
- Delete account with confirmation dialog

### Step 9: Real-time Sync Indicators
Add visual feedback for settings changes:
- Auto-save indicator with sync animation
- "Saved" confirmation with checkmark
- Optimistic UI updates

### Step 10: Empty and Loading States
Add polished states:
- Skeleton loaders matching glassmorphism design
- Tab content fade transitions

---

## Technical Details

### Color Palette
```text
Background:     #030305 (deep black)
Card BG:        bg-black/40 + backdrop-blur-2xl
Borders:        border-white/[0.03] to border-white/[0.08]
Primary text:   text-white
Secondary:      text-white/40 to text-white/60
Tab active:     bg-primary/10 border-primary/30
Form inputs:    bg-black/30 border-white/[0.08]
```

### Tab Color Coding
```text
Profile:        Orange/Primary gradient
Security:       Blue gradient
Notifications:  Purple gradient
Learning:       Emerald gradient
Account:        Amber gradient
```

### Animation Specifications
- Tab switch: Fade + slide transition (200ms)
- Form focus: Border glow animation
- Switch toggle: Spring animation
- Save button: Pulse on success
- Card entrance: Stagger (0.05s delay)

### Component Structure
```text
Settings.tsx (refactored)
├── AstraBackground
├── SettingsHeader.tsx
│   ├── Sidebar trigger
│   ├── User info
│   ├── Theme toggle
│   └── XP badge
├── SettingsTabNav.tsx
│   └── Tab buttons with icons
└── TabContent
    ├── SettingsProfileTab.tsx
    │   ├── AvatarUploadSection
    │   ├── BasicInfoCard
    │   └── ProfessionalInfoCard
    ├── SettingsSecurityTab.tsx
    │   ├── PasswordChangeCard
    │   └── SecurityStatusCard
    ├── SettingsNotificationsTab.tsx
    │   ├── PushNotificationCard
    │   ├── EmailPreferencesCard
    │   └── NotificationTypesGrid
    ├── SettingsLearningTab.tsx
    │   ├── XPLevelCard
    │   └── SRSSettingsCard
    └── SettingsAccountTab.tsx
        ├── AccountStatusCard
        └── DangerZoneCard
```

---

## File Structure

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Settings.tsx` | Modify | Refactor to orchestrate components with dark theme |
| `src/components/settings/SettingsHeader.tsx` | Create | Glassmorphism header component |
| `src/components/settings/SettingsProfileTab.tsx` | Create | Profile settings with enhanced UI |
| `src/components/settings/SettingsSecurityTab.tsx` | Create | Security settings tab |
| `src/components/settings/SettingsNotificationsTab.tsx` | Create | Notifications preferences tab |
| `src/components/settings/SettingsLearningTab.tsx` | Create | Learning/SRS settings tab |
| `src/components/settings/SettingsAccountTab.tsx` | Create | Account management tab |
| `src/components/settings/SettingsCard.tsx` | Create | Reusable glassmorphism card wrapper |

## Dependencies
No new dependencies required - uses existing:
- `framer-motion` for animations
- `lucide-react` for icons
- Existing UI components (Tabs, Switch, Input, Select, Slider, etc.)
- Existing hooks (useAuth, useSRSSettings, useXPSystem, usePushNotifications)

## Expected Outcome
A premium, immersive settings experience with:
- Deep black aesthetic matching Astra AI and Resources pages
- Smooth animations and micro-interactions
- Professional glassmorphism effects throughout
- Modular, maintainable component architecture
- Enhanced visual hierarchy and user feedback
- Real-time sync indicators for changes
- Consistent styling across all tabs
- Responsive design for mobile
