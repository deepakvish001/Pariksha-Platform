
# Competitive Programming Sheet Implementation Plan

## Overview
Create a new Competitive Programming sheet page that matches the reference design with a left sidebar for filtering by Track and Topic, and a right-side tabular list showing problem sets with progress tracking. This will follow the established patterns from DSA Questions, SQL Questions, and Company Resources pages.

## Design Reference Analysis
Based on the provided screenshot:
- **Left Sidebar**: Contains "All Sets" header, "By Track" section (Preliminaries, Basics, Intermediate, etc.), and "By Topic" section (Algorithmic Techniques, Data Structures, DP, Geometry, Graphs, etc.)
- **Right Content Area**: Search bar with Clear button, "Show" dropdown for pagination, sortable table with columns: Track badge, Problem Set name, Progress (solved count + percentage + progress bar)
- **Pagination**: Bottom pagination with page numbers

## Technical Implementation

### 1. Create Data File: `src/data/competitiveProgrammingData.ts`
Define the data structure for problem sets:
- `CPTrack` interface: id, name, color (for badge styling)
- `CPTopic` interface: id, name
- `CPProblemSet` interface: id, title, trackId, topicId, problemCount, externalUrl (optional)
- Export arrays: `cpTracks`, `cpTopics`, `cpProblemSets`
- Helper functions: `getByTrack()`, `getByTopic()`, `searchProblemSets()`

Sample tracks to include:
- Preliminaries, Basics, Intermediate, Advanced Data Structures, Advanced Algorithms, Advanced Mathematics
- Contest tracks: AtCoder Beginner, AtCoder Regular, Codeforces Educational, ICPC World Finals

Sample topics:
- Algorithmic Techniques (except DP), Data Structures, Dynamic Programming, Geometry, Graphs, Implementation, Math, Strings

### 2. Create Progress Hook: `src/hooks/useCPProgress.ts`
Following the pattern of `useDSAProgress.ts`:
- Track solved/revision status per problem set
- Store progress in `user_company_progress` table with `company_id: "cp-questions"`
- Include real-time sync via Supabase channel subscription
- Calculate progress stats (solved count, total, percentage per track/topic)

### 3. Create Main Page: `src/pages/library/CompetitiveProgramming.tsx`
Layout structure matching the reference:

```text
+----------------------------------+
| Sticky Header (icon + title)     |
+--------+-------------------------+
| Left   |  Search + Show dropdown |
| Filter |  -----------------------|
| Sidebar|  Sortable Table         |
|        |  - Track badge column   |
| Tracks |  - Problem Set name     |
| Topics |  - Progress bar + count |
|        |  -----------------------|
|        |  Pagination controls    |
+--------+-------------------------+
```

Features to implement:
- **Left Sidebar**: Collapsible sections for "By Track" and "By Topic" with clickable filter items
- **Search bar**: Filter problem sets by name
- **Show dropdown**: Items per page (10, 25, 50)
- **Sortable table columns**: Track, Problem Set, Progress (ascending/descending)
- **Progress column**: Shows "X / Y (Z%) solved" with progress bar
- **Pagination**: Page numbers with ellipsis for many pages
- **Mobile responsive**: Sidebar converts to collapsible dropdown on mobile

### 4. Create Sidebar Filter Component: `src/components/library/CPFilterSidebar.tsx`
Dedicated component for the left filter panel:
- "All Sets" option to clear filters
- "By Track" section with track names as clickable buttons
- "By Topic" section with topic names as clickable buttons
- Active filter highlighting
- Filter counts (optional badges)
- Collapsible on mobile

### 5. Update Routing: `src/App.tsx`
Add route for the new page:
```typescript
<Route path="cp" element={<CompetitiveProgramming />} />
```

### 6. Update Sidebar Navigation: `src/components/DashboardSidebar.tsx`
Add navigation item under Library section:
```typescript
{ title: "Competitive Programming", url: "/library/cp", icon: Code }
```

## Database Considerations
No new tables required. The existing `user_company_progress` table will be used with:
- `company_id`: "cp-questions"
- `tab_id`: "all" (or specific track/topic if needed)
- `item_id`: Problem set ID

## UI/UX Details

### Table Design
| Column | Width | Content |
|--------|-------|---------|
| Track | 120px | Colored badge (teal/green shades) |
| Problem Set | flex | Clickable problem set title |
| Progress | 180px | "0 / 16 (0%) solved" + progress bar |

### Filter Sidebar Styling
- Background: `bg-muted/30` with border
- Section headers: Bold, with chevron for collapse
- Filter items: Hover state, active state with primary color
- Sticky positioning within scroll container

### Responsive Behavior
- Desktop (>1024px): Side-by-side layout
- Tablet (768-1024px): Collapsible sidebar with toggle button
- Mobile (<768px): Sidebar hidden by default, accessible via hamburger menu

## File Structure Summary
```text
src/
  data/
    competitiveProgrammingData.ts    (NEW)
  hooks/
    useCPProgress.ts                 (NEW)
  pages/
    library/
      CompetitiveProgramming.tsx     (NEW)
  components/
    library/
      CPFilterSidebar.tsx            (NEW)
  App.tsx                            (MODIFY - add route)
  components/
    DashboardSidebar.tsx             (MODIFY - add nav item)
```

## Implementation Order
1. Create data file with sample problem sets
2. Create progress tracking hook
3. Create filter sidebar component
4. Create main page with layout and functionality
5. Add routing and navigation
6. Test and refine responsive behavior

