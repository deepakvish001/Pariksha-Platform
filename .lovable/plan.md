

# Quiz History Detail View - Implementation Plan

## Overview

This feature adds the ability to view complete details of past quiz attempts, including all questions asked, the user's selected answers (correct/wrong), the correct answer highlighted, explanations, and overall quiz metrics.

---

## Current Situation

Currently, when a quiz is completed:
- Only aggregate data is saved to the `quiz_results` table (score, accuracy, total time)
- Individual question responses are not persisted
- The QuizReview component only works during an active quiz session (questions are in memory)
- Users cannot review past quiz attempts after leaving the page

---

## Solution Architecture

```text
+-------------------+     +------------------------+     +-------------------+
|   Quiz Attempt    | --> | quiz_question_responses| <-- | Question Data     |
|   (quiz_results)  |     | (new table)            |     | (static files)    |
+-------------------+     +------------------------+     +-------------------+
         |                         |
         v                         v
+--------------------------------------------------+
|           QuizHistoryDetail Component            |
|  - Score summary card                            |
|  - Question navigator (grid/list)                |
|  - Individual question review with explanation   |
+--------------------------------------------------+
```

---

## Implementation Steps

### 1. Database Schema Changes

Create a new table `quiz_question_responses` to store individual question data for each quiz attempt:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `quiz_result_id` | UUID | Foreign key to quiz_results |
| `question_id` | INTEGER | ID of the question from static data |
| `question_category` | TEXT | Category (dsa, cs, sql, aptitude) |
| `question_index` | INTEGER | Position in the quiz (1-based) |
| `selected_answer_index` | INTEGER | User's answer (null if skipped) |
| `is_correct` | BOOLEAN | Whether the answer was correct |
| `time_taken_seconds` | INTEGER | Time spent on this question |
| `was_flagged` | BOOLEAN | If user flagged this question |
| `created_at` | TIMESTAMPTZ | Timestamp |

**RLS Policies**: Users can only read/write their own quiz responses.

---

### 2. Update Quiz Saving Logic

Modify `CombinedQuizMode.tsx` to save individual question responses alongside the quiz result:

- After inserting into `quiz_results`, get the returned `id`
- Insert each question's data into `quiz_question_responses`
- Include: question_id, category, selected answer, correctness, time taken, flagged status

---

### 3. Create Quiz History Detail Component

Build a new component `QuizHistoryDetail.tsx` that:

- Receives a quiz result ID as a prop (or via dialog state)
- Fetches the quiz result + all question responses
- Reconstructs question data by matching `question_id` with static data files
- Displays a rich UI similar to the existing `QuizReview` component

**UI Elements**:
- Header: Quiz date, type, score, accuracy, total time
- Question grid: Visual overview showing correct/incorrect/skipped
- Question detail view: Navigate through questions with full details
- Filter tabs: All / Incorrect / Skipped (similar to QuizReview)
- Explanation panel: Shows the answer explanation for each question

---

### 4. Integrate with QuizHistory Page

Modify `QuizHistory.tsx` to:

- Add a "View Details" button/icon on each quiz result row
- Open a dialog/sheet showing `QuizHistoryDetail` for the selected quiz
- Keep the existing list view as the default

---

### 5. Create a Hook for Fetching Quiz Details

Create `useQuizHistoryDetail.ts` hook that:

- Takes a `quizResultId` parameter
- Fetches the quiz result metadata
- Fetches all associated question responses
- Maps question IDs to full question data from static files
- Returns loading state, error state, and the reconstructed quiz data

---

## UI/UX Design

**Quiz Result Row (enhanced)**:
```text
┌─────────────────────────────────────────────────────────────────┐
│ [DSA] [Medium]        Feb 5, 2026 at 3:45 PM                    │
│ Score: 8/10 (80%)  │  Avg Time: 45s  │  [View Details] [Delete] │
└─────────────────────────────────────────────────────────────────┘
```

**Detail View Dialog**:
```text
┌───────────────────────────────────────────────────────────────────┐
│  Quiz Review - Feb 5, 2026                              [X Close] │
├───────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │  8/10   │  │  80%    │  │  7:30   │  │  45s    │              │
│  │  Score  │  │ Accuracy│  │  Total  │  │ Avg/Q   │              │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │
├───────────────────────────────────────────────────────────────────┤
│  [All] [Incorrect] [Skipped]                     Q 1 of 10       │
├───────────────────────────────────────────────────────────────────┤
│  [DSA] [Medium] [Correct ✓]                                       │
│  Climbing Stairs                                                  │
│  You are climbing a staircase...                                 │
│                                                                   │
│  ○ O(2^n) recursive                                              │
│  ● O(n) time, O(1) space [Correct ✓]                             │
│  ○ O(n²) dynamic programming                                     │
│  ○ O(n log n) divide and conquer                                 │
│                                                                   │
│  📖 Explanation                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ This is essentially the Fibonacci sequence...               │ │
│  └─────────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────────────┤
│  [← Previous]                                       [Next →]     │
└───────────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx_quiz_responses.sql` | Create | New table and RLS policies |
| `src/hooks/useQuizHistoryDetail.ts` | Create | Hook to fetch and reconstruct quiz details |
| `src/components/library/QuizHistoryDetail.tsx` | Create | Detail view component |
| `src/components/library/CombinedQuizMode.tsx` | Modify | Save individual question responses |
| `src/pages/library/QuizHistory.tsx` | Modify | Add "View Details" button and dialog |
| `src/integrations/supabase/types.ts` | Auto-updated | TypeScript types for new table |

---

## Technical Considerations

**Question Data Reconstruction**:
- Questions are stored in static TypeScript files, not the database
- We only store the `question_id` and `category` in responses
- On retrieval, we match these IDs against the static data to get full question details
- If a question is removed from static data, we show a "Question no longer available" message

**Backwards Compatibility**:
- Existing quiz results won't have question responses
- The "View Details" button will only appear for quizzes with saved responses
- Or show a message: "Detailed review not available for quizzes before [date]"

**Performance**:
- Batch insert question responses in a single query
- Use indexes on `quiz_result_id` for efficient lookups
- Limit question response storage to reasonable quiz sizes (e.g., max 50 questions)

