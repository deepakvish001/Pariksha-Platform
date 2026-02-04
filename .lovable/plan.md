

# Enhanced Company Detail Page - Responsive & Professional Design

## Overview
Transform the individual company pages (e.g., `/library/companies/accenture`) into a more compact, professional, and fully responsive design that maximizes screen real estate and minimizes unnecessary scrolling.

---

## Current Issues Identified

1. **Header Section**: Takes up significant vertical space with separate elements
2. **Tab Navigation**: Occupies a full row with horizontal scrolling on mobile
3. **Content Area**: Fixed padding and spacing that doesn't adapt well to different screen sizes
4. **Stats Card**: Shown as a separate card, adding to vertical height
5. **Search/Controls**: Takes another full row of space
6. **Overall Layout**: Stacked vertically rather than utilizing available horizontal space

---

## Proposed Solution: Dashboard-Style Compact Layout

### 1. Compact Header with Inline Stats

**Before**: Separate header row + separate stats card
**After**: Single integrated header with inline stats chips

```text
+------------------------------------------------------------------+
| ☰ Companies / Accenture    [Technology] [Hiring]  45% ████░  ⭐ |
+------------------------------------------------------------------+
```

Changes:
- Merge company info and stats into a single compact header row
- Show progress as an inline mini-bar instead of a large card
- Move favorite button to header
- Remove the separate progress card (integrate into header)

### 2. Two-Panel Layout for Desktop

**Before**: Full-width stacked content
**After**: Sidebar tabs + main content panel

```text
+------------------+----------------------------------------+
| SQL Questions    |  [Search...]        [Expand] [Collapse]|
| Interview (24)   |----------------------------------------|
| DSA (12)         |  Question content with answers...      |
| Aptitude (8)     |                                        |
| Job Portals      |                                        |
| Projects         |                                        |
| Resumes          |                                        |
| Cold DMs         |                                        |
+------------------+----------------------------------------+
```

Benefits:
- Tabs always visible on desktop (no horizontal scrolling)
- Maximizes content viewing area
- Professional dashboard aesthetic
- On mobile: reverts to horizontal scrollable tabs

### 3. Virtualized/Compact Question List

- Reduce row height and padding
- Use a more compact grid system
- Show difficulty as colored dots instead of full badges on mobile
- Inline checkboxes that don't take extra space

### 4. Responsive Breakpoint Optimization

| Breakpoint | Layout |
|------------|--------|
| Desktop (lg+) | Two-panel: sidebar tabs + content |
| Tablet (md) | Compact horizontal tabs + full-width content |
| Mobile (sm) | Icon-only tabs + stacked content |

### 5. Viewport Height Optimization

- Use `h-[calc(100vh-header)]` for content area
- Enable internal scrolling within content panels
- Keep header and tabs fixed/sticky
- Content area becomes the only scrollable region

---

## Technical Implementation

### File Changes

**`src/pages/library/CompanyDetail.tsx`**

1. **Header Redesign**
   - Reduce height from 64px to 48px
   - Inline progress indicator (mini progress bar)
   - Compact breadcrumb navigation
   - Favorite button moved inline

2. **Layout Restructure**
   - Implement `grid grid-cols-[auto_1fr]` for desktop
   - Sidebar width: 200px on lg, 180px on md
   - Use `h-screen` with internal scroll containers
   - Add `overflow-hidden` to main container

3. **Tab Navigation Component**
   - Vertical sidebar for desktop with full labels + counts
   - Horizontal compact tabs for tablet
   - Icon-only tabs for mobile with tooltips

4. **Content Area**
   - Use `ScrollArea` component for internal scrolling
   - Reduce padding: from `p-6` to `p-4`
   - Compact question rows with tighter spacing

5. **Question Table Optimization**
   - Reduce row height from ~60px to ~44px
   - Tighter grid columns
   - Show difficulty as colored indicator dots on mobile
   - Compact checkbox and bookmark buttons

### New Component: `CompanyDetailSidebar.tsx`

A dedicated sidebar component for tab navigation:
- Shows all tabs vertically
- Active state with highlight
- Item counts as badges
- Icons + labels
- Collapses to icon-only on medium screens

### Updated Grid Layouts

**Question Row (Compact)**
```text
Desktop:  [40px] [1fr] [80px] [100px] [50px] [50px]
Tablet:   [30px] [1fr] [60px] [40px] [40px]
Mobile:   [24px] [1fr] [40px] [32px]
```

**Non-Question Cards**
- 4 columns on desktop
- 3 columns on tablet
- 2 columns on mobile

---

## Specific UI Optimizations

### Header (Height: 48px)
- Smaller company icon (32px instead of 64px)
- Single-line title with inline badges
- Progress shown as: `45% (18/40)` with mini bar
- Favorite star button inline

### Tabs Sidebar (Desktop)
- Width: 180px fixed
- Each tab: icon + label + count badge
- Hover and active states
- Sticky positioning

### Content Panel
- `max-h-[calc(100vh-120px)]` with `overflow-y-auto`
- Search bar sticky at top of content
- Expand/Collapse controls inline with search
- Content scrolls independently

### Question Rows
- Reduce vertical padding: `py-4` to `py-2.5`
- Smaller font size for descriptions
- Tighter icon buttons (28px instead of 32px)
- Answer panels maintain readability

### Resource Cards (Job Portals, Projects, etc.)
- Smaller card padding: `p-5` to `p-4`
- More columns on larger screens
- Compact badge styling
- Smaller icons

---

## Mobile-First Approach

### Mobile (< 640px)
- Header: Icon + name only, progress hidden
- Tabs: Horizontal scroll with icons only
- Content: Full-width, reduced padding
- Questions: 2-column (# + text | actions)

### Tablet (640px - 1024px)
- Header: Full info inline
- Tabs: Horizontal with abbreviated labels
- Content: Full-width with moderate padding
- Questions: Full grid but compact

### Desktop (> 1024px)
- Header: Complete with all details
- Tabs: Vertical sidebar
- Content: Panel with scroll area
- Questions: Full grid with comfortable spacing

---

## Animation & Polish

- Smooth transitions on tab changes
- Subtle hover effects on sidebar items
- Spring animations on checkboxes
- Content fade-in on tab switch

---

## Summary of Changes

| Component | Before | After |
|-----------|--------|-------|
| Header Height | 64px + 140px stats | 48-56px integrated |
| Tab Layout | Horizontal scroll | Vertical sidebar (desktop) |
| Content Scroll | Page scroll | Panel scroll |
| Row Height | ~60px | ~44px |
| Grid Padding | p-6/p-8 | p-3/p-4 |
| Overall Experience | Scroll-heavy | Dashboard-like, minimal scroll |

---

## Files to Modify

1. **`src/pages/library/CompanyDetail.tsx`**
   - Complete layout restructure
   - Integrated compact header
   - Two-panel grid layout
   - Optimized question sections
   - Compact resource grids

2. **`src/components/library/CompanyQuestionRow.tsx`**
   - Reduced padding and heights
   - Compact mobile view
   - Smaller interactive elements

3. **New: `src/components/library/CompanyTabSidebar.tsx`**
   - Vertical tab navigation for desktop
   - Icon + label + count
   - Responsive visibility

4. **`src/components/library/CompanyStatsCard.tsx`** (may be deprecated)
   - Stats integrated into header instead

