

# Plan: Add Inline Expandable Answers to Questions

## Overview
Add an answer field to each question with a modern inline expandable design. Clicking on a question row will smoothly expand to reveal the answer below it, keeping the table format clean while providing detailed content on demand.

## Design Approach: Inline Accordion Rows

The chosen approach uses an **inline expandable row** pattern - a modern, simple UX where:
- Each question row has a subtle expand indicator (chevron icon)
- Clicking anywhere on the question text expands the answer below
- The answer appears as a full-width panel under the question row with smooth animation
- Supports markdown formatting with syntax highlighting for code answers (especially useful for DSA/SQL categories)
- Only one answer is visible at a time to reduce cognitive load

### Why This Approach?
- **Clean table layout preserved** - answers don't clutter the main view
- **Instant access** - single click reveals answer, no navigation needed
- **Modern feel** - smooth framer-motion animations match existing design
- **Mobile friendly** - full-width answers work well on small screens
- **Code-friendly** - supports syntax-highlighted code blocks for DSA/SQL answers

---

## Implementation Steps

### 1. Update Data Structure

**File: `src/data/positionResourcesData.ts`**

Extend the `Question` interface to include an optional `answer` field:

```typescript
export interface Question {
  id: number;
  text: string;
  difficulty: Difficulty;
  answer?: string;  // Optional markdown-formatted answer
}
```

Add sample answers to a few questions to demonstrate the feature:

```typescript
{ 
  id: 1, 
  text: "What is middleware in web frameworks?", 
  difficulty: "Easy",
  answer: "Middleware is software that sits between..." 
}
```

---

### 2. Create AnswerPanel Component

**New File: `src/components/library/AnswerPanel.tsx`**

A reusable component for displaying formatted answers:
- Glassmorphism styled panel matching existing design
- Markdown rendering with `react-markdown` for rich text
- Code syntax highlighting using existing `CodeBlock` component
- Subtle entrance animation with framer-motion
- Copy answer button for easy reference

---

### 3. Update QuestionRow Component

**File: `src/components/library/QuestionRow.tsx`**

Add expandable answer functionality:
- Add `answer?: string` and `isExpanded: boolean` to props
- Add `onToggleAnswer: () => void` callback
- Add chevron indicator that rotates on expand
- Make question text clickable to toggle answer
- Render `AnswerPanel` in a collapsible row below when expanded

Key changes:
- Wrap row content in clickable container
- Add `ChevronDown` icon with rotation animation
- Use `AnimatePresence` for smooth expand/collapse
- Show "No answer available" placeholder if answer is undefined

---

### 4. Update CategorySection Component  

**File: `src/components/library/CategorySection.tsx`**

Manage expanded answer state:
- Add `expandedQuestion: string | null` state (format: `${categoryId}-${questionId}`)
- Only one answer open at a time within a category
- Pass expansion state and toggle handler to `QuestionRow`
- Auto-collapse answer when collapsing section

---

### 5. Update PositionDetail Page

**File: `src/pages/library/PositionDetail.tsx`**

Ensure answer data flows through:
- Update `QuestionWithMeta` interface to include `answer?`
- Pass answer data when mapping questions
- Handle answer toggle for tabs layout view

---

## Visual Design

```text
┌─────────────────────────────────────────────────────────────────┐
│ #  │ Question                              │ Diff │ ✓ │ ★ │ 📝 │
├─────────────────────────────────────────────────────────────────┤
│ 1  │ ▼ What is middleware in web...       │ Easy │ ☐ │ ☆ │ 📋 │
├─────────────────────────────────────────────────────────────────┤
│    ┌────────────────────────────────────────────────────────┐   │
│    │  💡 Answer                                     [Copy]  │   │
│    │  ───────────────────────────────────────────────────── │   │
│    │  Middleware is software that sits between the OS       │   │
│    │  and applications, handling requests/responses.        │   │
│    │                                                        │   │
│    │  **Key Points:**                                       │   │
│    │  - Authentication                                      │   │
│    │  - Logging                                             │   │
│    │  - Error handling                                      │   │
│    └────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 2  │ ▶ How does HTTP caching work?        │ Easy │ ☑ │ ★ │ 📋 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Details

### Dependencies
- Uses existing `react-markdown` and `react-syntax-highlighter` (already installed)
- Leverages existing `CodeBlock` component for syntax highlighting
- Uses existing framer-motion for animations

### State Management
- Expanded answer state is local to each category section (not persisted)
- Single-answer-open constraint reduces visual clutter
- Keyboard accessibility: Enter/Space to toggle

### Mobile Responsiveness
- Answer panel uses full width on all screen sizes
- Touch-friendly tap targets
- Readable text sizing with proper padding

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/data/positionResourcesData.ts` | Modify | Add `answer` field to Question interface, add sample answers |
| `src/components/library/AnswerPanel.tsx` | Create | Styled answer display with markdown support |
| `src/components/library/QuestionRow.tsx` | Modify | Add expand/collapse UI and answer rendering |
| `src/components/library/CategorySection.tsx` | Modify | Manage expanded answer state |
| `src/pages/library/PositionDetail.tsx` | Modify | Pass answer data through component tree |

