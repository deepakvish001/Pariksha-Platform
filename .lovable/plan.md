

# Dashboard & Sheets — Full Functionality & Next Features

## Current State Assessment

**What works:**
- Dashboard (`/dashboard`) loads with stats, heatmap, goals, leaderboard, achievements, weekly activity chart
- Sheets listing (`/dashboard/sheets`) shows 8 sheet cards with progress tracking from database
- Sheet detail pages load with sections/subsections, toggle completion, notes, revision marks, all persisted to `user_topic_progress`
- DSA Level 1 sheet (467 topics) integrated from CSV data
- CP sheet has its own dedicated view (`CPProblemSetsView`)
- Guest users can browse with delayed login prompts

**Issues to fix:**
1. **DashboardMatrix missing sheets**: The `sheetDefinitions` array only has 6 sheets (missing `dsa-level-1` and `competitive-programming`), so those don't appear in the progress cards at bottom
2. **Striver's sheet has only ~130 mock topics** but claims `totalProblems: 446` — the difficulty counts (easy/medium/hard) are wrong relative to actual topics
3. **`leaderboard_view` doesn't exist** — the dashboard queries it but it's not a real table/view, causing silent errors
4. **`completed_at` not set on toggle** — when marking a topic complete, `saveProgress` doesn't send `completed_at: new Date().toISOString()`, so sheet completion dates are never tracked
5. **Category filter (Completed/Pending) not wired** — the `categoryFilter` select exists but isn't used in `getFilteredSections`
6. **Console warning**: `DelayedLoginPrompt` can't receive refs (minor)

## Plan

### Step 1: Fix DashboardMatrix sheet definitions
Add `dsa-level-1` (467 topics) and `competitive-programming` (97 topics) to the `sheetDefinitions` array so their progress shows on the main dashboard cards.

### Step 2: Fix `completed_at` timestamp in SheetDetail
Update `saveProgress` to include `completed_at: new Date().toISOString()` when `completed: true`, and `completed_at: null` when uncompleting. This enables the "Recently Completed" section on the sheets page to work.

### Step 3: Wire up the Completed/Pending category filter
In `getFilteredSections`, add logic for `categoryFilter === "completed"` (show only completed topics) and `categoryFilter === "pending"` (show only uncompleted topics).

### Step 4: Fix totalProblems count for Striver's sheet
Update the `totalProblems` in the mock data to match the actual number of topics defined (currently ~130, not 446). Adjust `easy`/`medium`/`hard` counts accordingly.

### Step 5: Handle missing leaderboard view gracefully
The dashboard queries `leaderboard_view` which doesn't exist. Add error handling so the leaderboard section shows the empty state instead of failing silently. Optionally create it as a simple query from `user_topic_progress` joined with `profiles`.

### Step 6: Add Machine Learning sheet data
The ML sheet card exists but has no detail data in `mockSheetData`. Add a structured section/topic layout so clicking it shows actual content instead of "Sheet not found".

### Step 7: Improve next feature set
- **Floating progress widget on SheetDetail**: A sticky mini-card at bottom-right showing current progress %, completed count, and a "next unsolved" button
- **Bulk actions**: "Mark section as complete" button on section headers
- **Export progress**: Download progress as CSV from sheet detail page

## Technical Details

- **Files modified**: `src/pages/DashboardMatrix.tsx`, `src/pages/SheetDetail.tsx`
- **No database changes needed** — all fixes use existing `user_topic_progress` table
- **No new dependencies**

