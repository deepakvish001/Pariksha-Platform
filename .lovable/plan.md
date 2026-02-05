

# Plan: Create Enhanced Job Portals and Roadmaps Pages

## Overview
Transform the existing simple Job Portals and Roadmaps pages into comprehensive learning modules similar to HLD/LLD pages, complete with quiz functionality, progress tracking, streak cards, leaderboards, and achievements.

---

## What Will Be Created

### 1. Research Overview Dashboard
A new overview page at `/research` that aggregates progress across Job Portals and Roadmaps (similar to Fundamentals Overview and System Design Overview).

**Features:**
- Overall progress stats (topics completed, quizzes taken, accuracy)
- Quick navigation cards to Job Portals and Roadmaps
- Achievements section specific to Research category
- Leaderboard and Analytics tabs

---

### 2. Enhanced Job Portals Page
Transform the current simple card-based page into a full learning module.

**New Data Structure (jobPortalsData.ts):**
- Categories: Job Boards, Professional Networks, Startup Platforms, AI-Powered Matching, Freelance Platforms
- Topics: Platform strategies, profile optimization, application tips
- Questions with quiz options covering:
  - LinkedIn profile optimization
  - Naukri application strategies
  - Indeed resume tips
  - AngelList startup networking
  - Platform-specific best practices

**Features:**
- Category-based navigation (like HLD categories)
- Quiz mode with timer
- Progress tracking (solved/revision)
- Search and difficulty filters
- Leaderboard integration
- Streak card integration

---

### 3. Enhanced Roadmaps Page
Transform the current roadmap display into an interactive learning module.

**New Data Structure (roadmapsData.ts):**
- Categories: Frontend, Backend, Full Stack, DevOps, Data Science, Mobile, AI/ML
- Topics: Technology choices, learning paths, project ideas, interview prep
- Questions covering:
  - Technology stack decisions
  - Learning sequence recommendations
  - Common mistakes to avoid
  - Career progression tips

**Features:**
- Interactive roadmap categories
- Quiz mode for career guidance questions
- Progress tracking per roadmap
- Milestone tracking (steps completed)
- Streak and leaderboard integration

---

### 4. Research-Specific Achievements
New achievements for Research section:

| Achievement | Requirement |
|-------------|-------------|
| Job Hunter | Complete first Job Portals quiz |
| Portal Pro | Complete 5 Job Portals quizzes |
| Career Navigator | Score 90%+ on a Roadmap quiz |
| Research Explorer | Complete quizzes in both Job Portals and Roadmaps |
| Career Master | Score 100% on both a Job Portals and Roadmap quiz |

---

### 5. Navigation Updates
- Add "Overview" link under Research section in sidebar
- Update routes in App.tsx for `/research` index route

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/data/jobPortalsData.ts` | Categories, topics, and 20+ quiz questions for job portals |
| `src/data/roadmapsData.ts` | Categories, topics, and 20+ quiz questions for career roadmaps |
| `src/pages/research/Overview.tsx` | Research dashboard with aggregated progress |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/research/JobPortals.tsx` | Complete rewrite with quiz mode, progress tracking, categories |
| `src/pages/research/Roadmap.tsx` | Complete rewrite with quiz mode, progress tracking, categories |
| `src/components/AchievementBadge.tsx` | Add 5 new Research achievements |
| `src/hooks/useUserAchievements.ts` | Add Research achievement calculation logic |
| `src/pages/Achievements.tsx` | Add Research category tab |
| `src/App.tsx` | Add `/research` index route pointing to Overview |
| `src/components/DashboardSidebar.tsx` | Add Overview link under Research section |

---

## Technical Details

### Data Structure Pattern
Following the established pattern from `systemDesignData.ts`:

```typescript
// Example structure for jobPortalsData.ts
export interface JobPortalQuestion {
  id: number;
  title: string;
  text: string;
  difficulty: "Easy" | "Medium" | "Hard";
  categoryId: string;
  topicId: string;
  answer: string;
  options?: { text: string; isCorrect: boolean }[];
}

export interface JobPortalCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}
```

### Progress Tracking
- Sheet IDs: `job-portal-{categoryId}` and `roadmap-{categoryId}`
- Reuses existing `user_topic_progress` table
- Quiz results stored with `quiz_type` prefix: `job-portal-` and `roadmap-`

### Component Reuse
- `FundamentalsQuizMode` - For quiz functionality
- `QuizLeaderboard` - For category leaderboards  
- `FundamentalsStreakCard` - For streak display (compact mode)
- `AnswerPanel` - For expandable answer display

---

## Implementation Sequence

1. Create data files (`jobPortalsData.ts`, `roadmapsData.ts`)
2. Build Research Overview page
3. Rewrite JobPortals page with full functionality
4. Rewrite Roadmap page with full functionality
5. Add Research achievements to badge system
6. Update achievement tracking hook
7. Add Research tab to Achievements page
8. Update routing and sidebar navigation

