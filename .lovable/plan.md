## Feature: DSA Practice Journal (working name)

A free, login-gated tracker where students log every problem they solve each day, schedule revisions, and watch their consistency + mastery improve over time.

Naming options (pick one in chat):
- **DSA Practice Journal** (recommended — calm, study-diary vibe)
- **Grind Log**
- **Solve Diary**
- **DSA Daybook**

I'll use *Practice Journal* below.

---

### 1. Core concept

Two linked entities:

1. **Day Log** — one row per calendar date the student studied.
2. **Problem Entry** — many problems attached to a Day Log. Each problem carries its own attempts history and revision schedule.

```text
DayLog (2026-05-21)
 ├─ ProblemEntry: "Two Sum"   → attempts[…], revisions[…], notes, tags
 ├─ ProblemEntry: "3Sum"      → …
 └─ ProblemEntry: "Trapping Rain Water" → …
```

---

### 2. Fields captured per Problem Entry

Required:
- Title, link(s) (supports multiple — LeetCode + GFG + YouTube)
- Topic (Array, Graph, DP…) and Pattern (Sliding Window, Two Pointers…)
- Algorithm/approach used (free text + optional tags)
- Difficulty (Easy / Medium / Hard) + personal difficulty (1–5 stars)
- Time taken to solve correctly (minutes)
- Number of attempts before clean solve
- Solved cleanly in one attempt? (boolean — feeds mastery score)
- Mistakes made (free text)
- Key learning / takeaway (free text)
- Notes (markdown, reuses existing `NotesPanel` component)
- Status: Solved / Partial / Stuck-needs-revisit
- Next revision date (auto-suggested via SM-2 spaced repetition; editable)

Each **Revision** appended later stores: date, attempts, time taken, solved-cleanly flag, short note. The entry is considered "mastered" once it's solved cleanly in one attempt on a revision.

---

### 3. Pages & routes

| Route | Purpose |
|---|---|
| `/learn/dsa-studio/journal` | Dashboard: streak, today's log, due revisions, weekly heatmap |
| `/learn/dsa-studio/journal/day/:date` | Single day detail — add/edit problem entries |
| `/learn/dsa-studio/journal/problem/:id` | Problem detail — full attempts + revisions timeline |
| `/learn/dsa-studio/journal/revisions` | All upcoming + overdue revisions |
| `/learn/dsa-studio/journal/analytics` | Charts: topics distribution, weak patterns, mastery curve |

Added under existing DSA Studio shell, alongside Patterns / Tricks / Edge.

---

### 4. Dashboard layout

```text
┌─────────────────────────────────────────────────────────┐
│  Streak: 12d 🔥   This week: 18 problems   Due today: 4 │
├──────────────────────────┬──────────────────────────────┤
│  Today (2026-05-21)      │  Due Revisions               │
│  [+ Add problem]         │  • Two Sum   (overdue 1d)    │
│  • 3Sum         ⭐⭐⭐   │  • LRU Cache (today)         │
│  • Word Ladder  ⭐⭐⭐⭐ │  • …                         │
├──────────────────────────┴──────────────────────────────┤
│  Heatmap (last 90 days, GitHub-style)                   │
├─────────────────────────────────────────────────────────┤
│  Quick stats: Topic mix · Pattern mix · Avg attempts    │
└─────────────────────────────────────────────────────────┘
```

---

### 5. Spaced revision

Reuse the existing SM-2 logic (see `mem://features/quizzes/unified-system`). Cadence based on the *clean-solve* flag of the most recent attempt:
- Solved cleanly → push next revision further (1d → 3d → 7d → 16d → 35d…)
- Not clean → reset interval to 1d
- "Mastered" when 3 consecutive clean solves at increasing intervals.

---

### 6. Analytics view

- Problems solved per day (bar)
- Topic & pattern distribution (donut)
- Difficulty mix per week (stacked bar)
- Weakest patterns (lowest clean-solve %) — actionable
- Average attempts trend (line — should drop over time)

---

### 7. Free access

No paywall. Available to any signed-in student. Guests see a teaser + login prompt (reuse existing `mem://auth/delayed-login-prompt` patterns).

---

### Technical section

**Database (new migration):**

```sql
-- One row per (user, date)
practice_journal_days(
  id uuid pk, user_id uuid, log_date date,
  mood smallint null, focus_minutes int null, summary text null,
  unique(user_id, log_date)
)

-- Problems logged on a given day
practice_journal_entries(
  id uuid pk, user_id uuid, day_id uuid fk → days,
  title text, links jsonb default '[]',  -- [{label, url}]
  topic text, pattern text, algorithm text,
  difficulty text check (...), personal_difficulty smallint,
  time_taken_min int, attempts int default 1,
  solved_clean boolean default false,
  mistakes text, learnings text, notes_md text,
  status text check (...) default 'solved',
  tags text[] default '{}',
  next_revision_at date,
  ease_factor real default 2.5, interval_days int default 1,
  mastered_at timestamptz
)

-- Each repeat practice of an entry
practice_journal_revisions(
  id uuid pk, user_id uuid, entry_id uuid fk → entries,
  revised_on date, attempts int, time_taken_min int,
  solved_clean boolean, note text
)
```

RLS: `user_id = auth.uid()` for select/insert/update/delete on all three tables. Indexes on `(user_id, log_date)`, `(user_id, next_revision_at)`, `(entry_id)`.

**Frontend:**
- New folder `src/features/dsa-journal/` with hooks (`useDayLog`, `useEntries`, `useDueRevisions`), components (`EntryForm`, `EntryCard`, `RevisionDialog`, `Heatmap`, `AnalyticsCharts` using Recharts already in project), and page files under `src/pages/learn/dsa-studio/journal/`.
- Reuse: `NotesPanel` (markdown editor), existing heatmap from `mem://features/progress/tracking`, SM-2 helpers from quizzes, `shadcn` Form + zod validation, `shadcn` DatePicker.
- Add nav entry in DSA Studio shell + sidebar (under Home group, matching existing access rules).

**Out of scope (v1):** team/cohort sharing, public profile cards, AI auto-tagging of topic/pattern (can add v2 using Gemini via existing edge function), CSV import.

---

### Build phases

1. Migration + RLS + types regen.
2. Day dashboard + entry CRUD form (the meat).
3. Revision engine + due-list page.
4. Analytics charts.
5. Sidebar/nav integration + empty states + guest teaser.

Confirm the name and I'll start with phase 1.