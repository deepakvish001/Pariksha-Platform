

# Plan: Redesign Position Resources with Card-Based Navigation

## Overview

Transform the Position Wise Resources page from a single-page layout to a two-page card-based navigation system, matching the pattern used by DashboardSheets and SheetDetail pages.

## User Experience Flow

1. **Landing Page** (`/library/positions`) - Shows role cards (Backend Developer, Frontend Developer, AI Engineer, etc.) in a responsive grid layout
2. **Detail Page** (`/library/positions/:roleId`) - Opens when clicking a role card, showing the questions table with all existing features (search, filters, revision mode, notes, etc.)

## Implementation Steps

### Step 1: Rename Current Page to Position Detail

Rename and refactor `src/pages/library/PositionResources.tsx` to `src/pages/library/PositionDetail.tsx`:
- Convert from dropdown-based role selection to URL-based routing using `useParams`
- Accept `roleId` from URL parameter instead of state
- Add back navigation to return to the role cards page
- Keep all existing features: search, difficulty filter, notes filter, revision mode, progress tracking

### Step 2: Create New Role Cards Page

Create new `src/pages/library/PositionResources.tsx` to display role cards:
- Display roles as cards in a responsive grid (similar to DashboardSheets)
- Each card shows:
  - Role icon and name
  - Total question count across all categories
  - Progress indicator (solved/total)
  - Difficulty breakdown (Easy/Medium/Hard counts)
- Cards are clickable and navigate to `/library/positions/:roleId`
- Include search functionality to filter roles
- Show "Starred" roles option (frequently accessed)

### Step 3: Update Routing Configuration

Modify `src/App.tsx`:
- Add new route: `/library/positions/:roleId` for the detail page
- Keep existing `/library/positions` for the role cards listing

## Technical Details

### New File Structure
```text
src/pages/library/
  PositionResources.tsx     (NEW - Role cards listing)
  PositionDetail.tsx        (RENAMED - Questions table with features)
```

### Card Layout Design (PositionResources.tsx)
- Header with page title and search bar
- Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Card content:
  - Role icon with gradient background
  - Role name as title
  - Question count and progress percentage
  - Difficulty badges showing Easy/Medium/Hard distribution
  - Visual progress bar

### Detail Page Updates (PositionDetail.tsx)
- Get `roleId` from `useParams()` instead of state
- Add back button linking to `/library/positions`
- Remove role dropdown selector (role is now determined by URL)
- Keep all existing features:
  - Category tabs (Interview, DSA, Aptitude, SQL, Core CS)
  - View mode toggle (All Questions / Revision)
  - Search and difficulty filters
  - Has Notes filter
  - Progress dialog
  - Notes dialog

### Routing Changes (App.tsx)
```typescript
// Library routes
<Route path="/library" element={<DashboardLayoutWrapper />}>
  <Route path="positions" element={<PositionResources />} />
  <Route path="positions/:roleId" element={<PositionDetail />} />
  // ... other routes
</Route>
```

### Data Flow
- Use existing `roles` array from `positionResourcesData.ts` for card generation
- Use existing `getAllQuestionsForRole()` and `getQuestionCountsByDifficulty()` helpers for stats
- Progress data continues to use localStorage with same key structure

## Visual Design Reference

The cards will follow the same design pattern as DashboardSheets:
- Rounded corners with subtle border
- Hover state with shadow elevation
- Icon in a rounded gradient container
- Clean typography with muted descriptions
- Progress indicators and badges

