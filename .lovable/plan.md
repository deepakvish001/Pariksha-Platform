
# UI/UX Improvement Plan: Company Detail Pages

## Overview
This plan transforms the Company Detail pages into a cleaner, more organized, and professional design that follows the established patterns from Position Resources while being simpler and more focused on the company-specific content.

---

## Current Issues Identified

### 1. Table Header Mismatch with Rows
- The table header uses a fixed grid layout that doesn't visually align with the responsive row layout
- Header is hidden on mobile but rows show different content, causing visual inconsistency

### 2. Grid-Based Layout Complexity
- The current `CompanyQuestionRow` uses a complex grid system that's hard to maintain
- Different column counts between header and rows when `showCategory` is toggled

### 3. Tab Navigation Could Be Cleaner
- Tabs work but could have better visual separation
- Missing a clear active state indicator

### 4. Non-Question Tabs Are Card-Heavy
- Job Portals, Projects, Resume Templates, and Cold DMs use card grids
- Could benefit from a more unified table-based approach for consistency

### 5. Missing Features from Position Resources
- No layout toggle (Sections vs Tabs view)
- No difficulty filter dropdown
- No "Random Question" feature
- No Notes system for questions

---

## Proposed Improvements

### Phase 1: Unified Table Component (High Priority)

**1.1 Create Proper HTML Table Structure**
Replace the grid-based `CompanyQuestionRow` with a proper `<Table>` component usage:

```
| # | Question | Difficulty | Category* | Solved | Revision |
```

- Use actual `<tr>`, `<td>` elements via shadcn Table components
- Proper column alignment between header and rows
- Responsive behavior: hide Category column on mobile
- Clickable rows for answer expansion (keep current behavior)

**1.2 Responsive Column Strategy**
```
Desktop (sm+):
| # | Question | Difficulty | Category | ✓ | ★ |

Mobile (< sm):
| # | Question | ✓/★ (stacked) |
Difficulty + Category shown inline below question text
```

### Phase 2: Enhanced Tab Navigation

**2.1 Cleaner Tab Design**
- Keep icons but improve spacing
- Add subtle underline indicator for active tab
- Improve wrapping behavior for narrow viewports
- Group tabs logically:
  - Questions: SQL | Interview | DSA | Aptitude
  - Resources: Jobs | Projects | Resumes | DMs

**2.2 Add Tab Group Headers**
```
Questions
[SQL] [Interview] [DSA] [Aptitude]

Resources  
[Job Portals] [Projects] [Resume Templates] [Cold DMs]
```

### Phase 3: Question Tab Improvements

**3.1 Add Difficulty Filter Dropdown**
Same as Position Resources:
- All Levels (default)
- Easy (green dot)
- Medium (amber dot)  
- Hard (red dot)

**3.2 Add Results Count**
Show "X questions found" below search bar with pending badge

**3.3 Improved Empty States**
Better visual design for "No questions found" with clear CTAs

### Phase 4: Resource Tabs Improvements

**4.1 Job Portals - Keep Card Layout**
Cards work well here, but improve:
- Better hover states
- Clearer "Applied" toggle visual
- Mobile-optimized 1-column layout

**4.2 Projects - Enhance Cards**
- Add difficulty indicator badge
- Better technology tag overflow handling
- Optional time estimate display

**4.3 Resume Templates - Gallery Style**
- Keep current gallery, improve hover preview
- Add "Download" action button
- Style category filters

**4.4 Cold DMs - Card with Better Copy UX**
- Keep cards but improve copy feedback
- Show character count more prominently
- Add platform badges (LinkedIn, Email, etc.)

### Phase 5: Overall Polish

**5.1 Consistent Card/Border Styling**
- All sections use same `border-border/50` styling
- Consistent `rounded-lg` corners
- Uniform padding scale

**5.2 Better Loading States**
- Skeleton loaders for initial load
- Smooth transitions between tabs

**5.3 Progress Stats Enhancement**
Add to header card:
- Questions by difficulty breakdown
- Quick toggle for "Show solved only"

---

## Technical Implementation Details

### Files to Modify

**1. `src/components/library/CompanyQuestionRow.tsx`**
Major refactor to use proper Table components:
- Import `TableCell` instead of using divs
- Return `<tr>` element with proper `<td>` children
- Keep answer expansion logic
- Mobile-friendly responsive approach with CSS `hidden`/`block` classes

**2. `src/pages/library/CompanyDetail.tsx`**
Updates:
- Replace `QuestionsSection` with proper `<Table>` structure
- Add difficulty filter state and dropdown
- Improve tab grouping with visual separators
- Add results count below search
- Better responsive column handling in table header

**3. `src/components/ui/table.tsx`**
Minor enhancement:
- Remove `table-fixed` class to allow flexible column widths
- Ensure proper overflow handling

### New Component Structure

```typescript
// Updated QuestionsSection
<div className="rounded-lg border border-border/50 overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="bg-muted/30">
        <TableHead className="w-12">#</TableHead>
        <TableHead>Question</TableHead>
        <TableHead className="w-24">Difficulty</TableHead>
        {showCategory && <TableHead className="hidden md:table-cell w-28">Category</TableHead>}
        <TableHead className="w-16 text-center">Solved</TableHead>
        <TableHead className="w-16 text-center">Revision</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {questions.map((q) => (
        <CompanyQuestionRow key={q.id} {...props} />
      ))}
    </TableBody>
  </Table>
</div>
```

### Responsive Behavior Summary

| Viewport | Columns Shown | Behavior |
|----------|--------------|----------|
| < 640px (mobile) | #, Question, Actions | Difficulty/Category inline, stacked actions |
| 640-768px (sm) | #, Question, Difficulty, Solved, Revision | Category hidden |
| 768px+ (md) | All columns | Full table layout |

---

## UI Before vs After

| Aspect | Current | Proposed |
|--------|---------|----------|
| Table Structure | Grid-based divs | Proper HTML table |
| Column Alignment | Misaligned | Perfectly aligned |
| Mobile Layout | Complex grid | Simplified 2-3 column |
| Difficulty Filter | None | Dropdown selector |
| Tab Groups | Flat list | Grouped by type |
| Empty States | Basic | Polished with icons |
| Results Count | None | "X questions found" |

---

## Implementation Order

1. **Table Refactor** - Convert CompanyQuestionRow to use TableCell
2. **Update QuestionsSection** - Use proper Table wrapper with aligned headers
3. **Add Difficulty Filter** - State + dropdown UI
4. **Improve Tab Navigation** - Better grouping and indicators
5. **Polish Resource Tabs** - Minor enhancements to cards
6. **Add Results Count & Empty States** - Final polish

---

## Summary

This plan focuses on:
1. Fixing table alignment issues with proper HTML table structure
2. Adding missing features (difficulty filter, results count)
3. Improving responsive behavior for sidebar open/closed states
4. Polishing the overall design to match Position Resources quality

The changes maintain full backward compatibility with existing features while significantly improving the user experience.
