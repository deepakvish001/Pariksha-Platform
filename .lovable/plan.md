

# Plan: Enhanced Collapsible Table Design for Position Detail

## Overview
Transform the current flat table layout into an organized, collapsible accordion-style design similar to SheetDetail, with improved visual hierarchy, animations, and better information organization.

## Current vs Proposed Design

### Current Design
- Flat table showing all questions for selected category tab
- Simple table with question text, difficulty badge, and action buttons
- Tab switching required to view different categories
- No visual grouping or collapsible sections

### Proposed Design
- Collapsible category sections (each category as an expandable accordion)
- Animated progress bars per category showing completion status
- Nested table inside each section with enhanced row animations
- "Expand All / Collapse All" quick toggle
- Preserved tab view option for those who prefer it

## Key Improvements

### 1. Collapsible Category Sections
Each category (Interview, DSA, SQL, etc.) becomes a collapsible section:
```text
+--------------------------------------------------+
| v Interview Questions          [====>    ] 12/25 |
|   +----------------------------------------------+
|   | # | Question              | Diff | Actions  |
|   | 1 | What is middleware... | Easy | [v][*][n]|
|   +----------------------------------------------+
| > DSA Questions                [==>       ] 5/20 |
| > SQL Questions                [=>        ] 3/15 |
+--------------------------------------------------+
```

### 2. Section Header Design
- Chevron icon with rotation animation on open/close
- Section title with sparkle icon when 100% complete
- Animated progress bar with shimmer effect
- Solved count badge (e.g., "12 / 25")

### 3. Enhanced Table Within Sections
- Animated row entrance (staggered fade-in)
- Hover lift effect with background highlight
- Completion celebration animation
- Note preview on hover

### 4. Quick Actions
- "Expand All" / "Collapse All" button
- Toggle between "Section View" and "Tab View" (preserves current behavior)
- Section-specific random question picker

### 5. Visual Polish
- Animated chevron rotation (90deg on expand)
- Shimmer effect on progress bars
- Sparkles icon on completed sections
- Smooth height transitions using framer-motion

## Technical Implementation

### New Components to Create

**1. CategorySection Component**
A collapsible wrapper for each category containing:
- Header with title, progress bar, and count
- Nested table with question rows
- Expand/collapse animation

**2. SectionProgressBar Component**
Animated progress indicator with:
- Shimmer overlay effect
- Color transition based on completion percentage
- Smooth value transitions

### Files to Modify

**1. `src/pages/library/PositionDetail.tsx`**
- Add view mode toggle: "sections" | "tabs"
- Render CategorySection components when in section view
- Preserve existing tab logic for backward compatibility
- Add "Expand All" / "Collapse All" controls

**2. `src/components/library/CategorySection.tsx` (New)**
- Collapsible wrapper using Radix Collapsible
- Progress calculation per category
- Animated height transitions
- Nested table rendering

**3. `src/components/library/SectionProgressBar.tsx` (New)**
- Animated Progress component with shimmer
- Color gradients based on completion level
- Smooth value interpolation

### Animation Specifications

**Chevron Rotation:**
- Initial: 0deg (collapsed)
- Open: 90deg
- Transition: 200ms ease-out

**Content Expand/Collapse:**
- Height: 0 to auto
- Opacity: 0 to 1
- Transition: 300ms cubic-bezier(0.4, 0, 0.2, 1)

**Progress Bar:**
- Width transition: 500ms ease-out
- Shimmer overlay animation: 1.5s infinite

**Row Stagger:**
- Each row delays 30ms after previous
- Fade-in + slide from left

## UI Layout Changes

### Section View (New Default)
```text
+--------------------------------------------------+
| Progress Card                                     |
| +--------+  +----------------------------------+ |
| |  45%   |  | Easy: 12/20  Medium: 8/15       | |
| +--------+  +----------------------------------+ |
+--------------------------------------------------+
| [Section View] [Tab View]  [Expand All]          |
|--------------------------------------------------|
| [Search] [Difficulty] [Notes Filter] [Random]    |
|--------------------------------------------------|
| v Interview Questions          [======>  ] 32/50 |
|   | # | Question | Difficulty | Solved | Rev | N |
|   |---|----------|------------|--------|-----|---|
|   | 1 | Question | Easy       | [x]    | [*] |[n]|
|   | 2 | Question | Medium     | [ ]    | [ ] |[n]|
|--------------------------------------------------|
| v DSA Questions                [===>     ] 10/25 |
|   | # | Question | Difficulty | Solved | Rev | N |
|--------------------------------------------------|
| > SQL Questions (collapsed)    [=>       ] 5/15  |
| > Aptitude Questions           [         ] 0/13  |
| > Core CS Questions            [>        ] 2/13  |
+--------------------------------------------------+
```

### Tab View (Preserved)
Same as current design - switches categories via tabs.

## Implementation Steps

1. **Create SectionProgressBar Component**
   - Build animated progress bar with shimmer effect
   - Add color transitions based on percentage

2. **Create CategorySection Component**
   - Implement collapsible wrapper with Radix Collapsible
   - Add progress calculation and header design
   - Include nested table with QuestionRow components

3. **Update PositionDetail Page**
   - Add view mode state (sections vs tabs)
   - Implement view toggle buttons
   - Add expand/collapse all functionality
   - Integrate CategorySection components

4. **Add Animation Polish**
   - Chevron rotation animations
   - Height transition effects
   - Row stagger animations
   - Completion celebration effects

5. **Mobile Optimization**
   - Compact section headers on mobile
   - Touch-friendly expand/collapse targets
   - Responsive progress bar sizing

## Benefits

- **Better Organization**: All categories visible at once, expandable on demand
- **Visual Progress**: Clear progress indicators per category motivate completion
- **Faster Navigation**: No tab switching needed to see multiple categories
- **Consistent Design**: Matches SheetDetail design language
- **User Choice**: Can switch between section and tab views based on preference

