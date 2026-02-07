
# Complete "Create with AI" Feature Build Plan

## Overview
This plan outlines the remaining work to complete the "Create with AI" section with all features working end-to-end. The current implementation has a solid foundation - the core AI generation, storage, and display is working. This plan focuses on completing the remaining functionality to make it a polished, complete feature.

---

## Current Status Summary

| Feature | Status |
|---------|--------|
| AI Content Generation (Edge Function) | Working |
| Content Storage (Database + RLS) | Working |
| Generate Page (Plan, Course, Guide, Roadmap, Quiz) | Working |
| My Plans/Courses/Guides/Roadmaps/Quizzes Pages | Working |
| Content Detail View | Working |
| Community & Staff Picks (View Only) | Working |
| Roadmap Chat | Placeholder Only |
| Like Functionality | Not Implemented |
| Interactive Quiz Mode | Not Implemented |
| Progress Tracking | Not Implemented |

---

## Implementation Plan

### Phase 1: Like Functionality (Priority: High)
Enable users to like public content to power Staff Picks and Community rankings.

**Database Changes:**
- Create `ai_content_likes` table to track user likes (user_id, content_id, created_at)
- Add RLS policies for authenticated users to insert/delete their own likes

**Frontend Changes:**
- Add `useLikeContent` hook to manage like state
- Add like button to content cards in Community, Staff Picks, and AIContentDetail pages
- Show filled/unfilled heart icon based on user's like status
- Update likes_count display in real-time

---

### Phase 2: Interactive Quiz Mode (Priority: High)
Allow users to actually take AI-generated quizzes instead of just viewing answers.

**New Components:**
- `QuizPlayer.tsx` - Interactive quiz-taking interface with:
  - Question display with progress indicator
  - Multiple choice answer selection
  - Timer (based on timeLimit in quiz content)
  - Submit and navigation controls
  
- `QuizResultsView.tsx` - Results screen showing:
  - Final score and percentage
  - Time taken
  - Question-by-question review with correct answers
  - Option to retake or share results

**Detail Page Update:**
- Add "Take Quiz" button in AIContentDetail for quiz type
- Toggle between study mode (current view) and quiz mode

---

### Phase 3: Roadmap Chat (Priority: Medium)
Convert the placeholder into a functional AI chat for personalized roadmap guidance.

**Implementation:**
- Create new edge function `roadmap-chat` that uses Lovable AI with roadmap-specific system prompt
- Build chat interface similar to existing AstraAI/Ask AI Tutor
- Include context about user's goals and experience level
- Provide actionable roadmap recommendations

**Features:**
- Message history persistence (use existing conversations table)
- Suggested prompts for career goals, learning paths, skill gaps
- Ability to generate a roadmap directly from chat recommendations

---

### Phase 4: Progress Tracking (Priority: Medium)
Track completion progress for courses and guides.

**Database Changes:**
- Create `ai_content_progress` table:
  - content_id, user_id, progress_data (JSONB), completed_at, updated_at
  - Progress data stores completed lessons/steps/phases

**Frontend Changes:**
- Add completion checkboxes to lessons (courses), steps (guides), phases (plans)
- Show progress bar on content cards
- Add "Continue Learning" section showing in-progress content
- Award XP when completing sections

---

### Phase 5: User Attribution & Sharing (Priority: Low)
Show creator info and enable content sharing.

**Database Changes:**
- Join profiles table when fetching public content to get creator name/avatar

**Frontend Changes:**
- Display creator avatar and name on Community/Staff Picks cards
- Add share button with copy link functionality
- Add social share options (Twitter, LinkedIn)

---

### Phase 6: Polish & UX Improvements (Priority: Low)

**Search & Filtering:**
- Add search bar to Community page
- Filter by content type (dropdown/tabs)
- Sort options (Most Liked, Most Recent, Most Viewed)

**Enhanced Content Cards:**
- Add view count tracking
- Show estimated completion time
- Add difficulty badges for courses/quizzes

**Navigation Improvements:**
- Breadcrumb navigation in detail pages
- "Related Content" suggestions based on topic

---

## Technical Details

### New Database Tables

```text
ai_content_likes
+-------------+-------+---------+
| Column      | Type  | Notes   |
+-------------+-------+---------+
| id          | uuid  | PK      |
| user_id     | uuid  | FK      |
| content_id  | uuid  | FK      |
| created_at  | timestamptz     |
+-------------+-------+---------+
Unique constraint: (user_id, content_id)

ai_content_progress  
+-------------+-------+---------+
| Column      | Type  | Notes   |
+-------------+-------+---------+
| id          | uuid  | PK      |
| user_id     | uuid  | FK      |
| content_id  | uuid  | FK      |
| progress    | jsonb | Stores completed items |
| last_accessed_at | timestamptz |
| completed_at | timestamptz | Nullable |
+-------------+-------+---------+
Unique constraint: (user_id, content_id)
```

### New Edge Functions
- `roadmap-chat` - AI chat for roadmap guidance with career-focused prompts

### New React Components
- `src/components/ai/LikeButton.tsx` - Reusable like button with animation
- `src/components/ai/QuizPlayer.tsx` - Interactive quiz interface
- `src/components/ai/QuizResults.tsx` - Quiz results display
- `src/components/ai/ContentProgress.tsx` - Progress tracking controls
- `src/components/ai/CreatorCard.tsx` - User attribution component

### New Hooks
- `useContentLike.ts` - Manage like state and mutations
- `useContentProgress.ts` - Track and update content progress
- `useRoadmapChat.ts` - Handle roadmap chat messages

---

## Recommended Implementation Order

1. **Like Functionality** - Quick win, enables Community engagement
2. **Interactive Quiz Mode** - High value, makes quizzes actually usable
3. **Roadmap Chat** - Completes the Byteskill AI section
4. **Progress Tracking** - Adds retention mechanics
5. **User Attribution** - Social features for community growth
6. **Polish & UX** - Final refinements

---

## Estimated Effort
- Phase 1 (Likes): ~1 session
- Phase 2 (Quiz Mode): ~2 sessions  
- Phase 3 (Roadmap Chat): ~2 sessions
- Phase 4 (Progress): ~2 sessions
- Phase 5 (Attribution): ~1 session
- Phase 6 (Polish): ~1-2 sessions

**Total: ~9-10 implementation sessions**

---

## Success Criteria
- Users can generate all 5 content types and view them
- Users can take interactive quizzes with scoring
- Users can like public content
- Community and Staff Picks show real engagement data
- Roadmap Chat provides personalized guidance
- Progress is tracked across learning content
