# Personalized AI Dashboard

A new "My Plan" dashboard that asks for the user's goal, timeline, and weekday/weekend study capacity, fetches their public competitive-programming profiles, and generates an adaptive sheet that re-prioritizes itself after every attempt.

## Important reality check on third-party APIs

Before building, you should know that **only some of these platforms have usable public APIs**:

| Platform | Status | What we can fetch |
|---|---|---|
| LeetCode | No official API. Unofficial GraphQL works but breaks often & has CORS/rate limits. We'd proxy via an Edge Function. | Solved counts (easy/med/hard), recent submissions, contest rating |
| Codeforces | Official public API | Rating, solved problems, contest history |
| CodeChef | No official API | Scrape rating from public profile (fragile) |
| HackerRank | No public API | Badges via profile scrape (fragile) |
| HackerEarth | No public API | Limited scrape |
| GeeksforGeeks | No public API | Coding score scrape (fragile) |
| Unstop | No public API | Not feasible reliably |

**Recommendation:** Ship Phase 1 with **LeetCode + Codeforces** (most reliable + cover ~90% of users). Add the rest later as best-effort with clear "may be outdated" labels. I'll structure the code so adding more platforms is plug-and-play.

## What gets built

### 1. Sidebar entry + new route
- New "My Plan" item in the Dashboard sidebar group (icon: `Sparkles`).
- Route: `/dashboard/my-plan` (protected — requires login).

### 2. Onboarding wizard (first visit)
A 4-step dialog the first time the user opens My Plan:
1. **Goal** — Placement / Internship / FAANG prep / Switch jobs / Competitive programming (with target date).
2. **Current level self-assessment** — Beginner / Intermediate / Advanced + topics already comfortable with.
3. **Time budget** — Weekday hours/day + Weekend hours/day + days/week.
4. **Connect profiles** — Optional inputs for LeetCode username, Codeforces handle, CodeChef, HackerRank, GFG, HackerEarth. "Skip for now" allowed.

Saved to a new `user_study_profile` table.

### 3. Profile fetcher (Edge Function)
One Edge Function `fetch-coding-profiles` that takes `{ platform, handle }` and returns a normalized:
```
{ platform, handle, rating, solved: {easy, medium, hard, total}, lastSyncedAt, raw }
```
- Uses Codeforces public API directly.
- Uses LeetCode GraphQL through the function (avoids CORS).
- For CodeChef/HackerRank/GFG: best-effort HTML scrape, marked `confidence: "low"`.
- Results cached in `user_platform_stats` (refreshable, max 1×/hour per platform).

### 4. AI plan generator (Edge Function)
`generate-study-plan` calls Lovable AI (`google/gemini-3-flash-preview`) with structured tool-calling output:
- Input: goal, target date, time budget, platform stats, existing topic progress (`user_topic_progress`).
- Output: ordered list of weeks → days → tasks (topic + difficulty + estimated minutes + source sheet/problem slug).
- Stored in new `user_study_plans` (JSONB plan + metadata) and `user_study_plan_tasks` (one row per task with status).

### 5. Adaptive re-ranking
After each task is marked done OR the user attempts a linked problem (we already log `code_submissions` and `quiz_results`):
- A lightweight scoring function (client-side, no AI call needed for every attempt) adjusts upcoming task priority:
  - Wrong/slow → insert reinforcement task on same topic the next day.
  - Correct/fast → skip ahead, unlock harder variant.
  - Repeated weakness on a topic → AI re-plan call (debounced, max 1×/day).

### 6. The dashboard view itself
At `/dashboard/my-plan`:
- **Header card**: goal, days remaining, daily streak, today's required minutes.
- **Today's tasks** (checklist with timer, links to existing sheet topics & coding problems).
- **This week** view (collapsible days).
- **Connected profiles strip** (rating chips, last synced, manual refresh button).
- **Adaptive insights panel**: "Your weakest area this week is Graphs — added 2 tasks."
- **Re-plan button** (calls AI again with current state).

## Technical details

**New tables (migration):**
- `user_study_profile` (user_id PK, goal, target_date, weekday_minutes, weekend_minutes, level, topics_known[], created_at, updated_at)
- `user_platform_stats` (user_id, platform, handle, rating, solved_easy/med/hard, raw jsonb, last_synced_at, sync_status; PK user_id+platform)
- `user_study_plans` (id, user_id, plan jsonb, generated_at, model, is_active)
- `user_study_plan_tasks` (id, plan_id, user_id, day_date, order_index, topic, difficulty, est_minutes, source_type, source_id, status, completed_at, score)

All with RLS: user can only see/modify own rows.

**New Edge Functions:**
- `fetch-coding-profiles` (public, validates input, rate-limits per user via in-memory map)
- `generate-study-plan` (validates JWT, calls Lovable AI with tool-call schema)

**New files:**
- `src/pages/dashboard/MyPlan.tsx`
- `src/components/my-plan/PlanOnboardingWizard.tsx`
- `src/components/my-plan/PlatformProfilesCard.tsx`
- `src/components/my-plan/TodayTasksList.tsx`
- `src/components/my-plan/AdaptiveInsights.tsx`
- `src/hooks/useStudyPlan.ts`, `usePlatformStats.ts`, `useStudyProfile.ts`
- `src/lib/adaptive/rerank.ts` (pure scoring logic, unit-testable)

**Edits:**
- `src/App.tsx` — add route.
- `src/components/DashboardSidebar.tsx` — add "My Plan" entry.

## Phasing (suggested)

- **Phase 1 (this build)**: Tables + onboarding wizard + LeetCode & Codeforces fetchers + AI plan generation + dashboard view + manual "mark done" adaptation.
- **Phase 2 (later)**: CodeChef/HackerRank/GFG scrapers, automatic re-ranking from `code_submissions` triggers, weekly email recap of adherence.

## Open questions before I start

1. Should the plan strictly use **existing sheets/problems in the app** (DSA sheet, SQL, coding problems library) as task sources, or also generate freeform topics?
2. For the unreliable platforms (CodeChef/GFG/etc.), do you want them included in Phase 1 with "best effort" labels, or skip until Phase 2?
3. Should the onboarding wizard be required before the dashboard renders, or show a sample/preview plan with a "Personalize" CTA?

I can proceed with sensible defaults (use existing sheets, Phase-1 = LeetCode + Codeforces, wizard required) if you don't want to answer — just say "go".