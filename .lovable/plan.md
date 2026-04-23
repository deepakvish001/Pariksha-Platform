

## LeetCode-style Coding Problems Hub

A new section where users browse coding problems in a list, open any problem to see the full statement alongside a Monaco code editor, run code against sample test cases, submit solutions, and review their submission history — all powered by real execution via Judge0.

### What you'll see

**1. Problems list page — `/library/problems`**
- LeetCode-style table: Status (✅/🟡/—), Title, Difficulty, Topic tags, Acceptance, Your attempts.
- Search box, difficulty filter (Easy/Medium/Hard), topic filter, status filter (Solved / Attempted / Todo), and "Random pick" button.
- Stats strip up top: solved counts by difficulty, total attempts, current streak.
- Pagination (20/page).

**2. Problem detail page — `/library/problems/:problemId`**
Two-pane split layout (resizable):
- **Left pane** — tabs: `Description` · `Solution` · `Submissions` · `Discuss` (Discuss = "coming soon" placeholder).
  - Description: title, difficulty badge, topic tags, problem statement (markdown), examples, constraints, hints (collapsible).
  - Solution: gated until first AC submission, then shows reference solution + complexity.
  - Submissions: user's history for this problem (status, language, runtime, memory, date) with click-to-view code.
- **Right pane** — Monaco editor.
  - Language picker: **Python, C++, Java, JavaScript, C, Go, TypeScript** (each with starter stub).
  - Toolbar: Run, Submit, Reset to default, Format, Theme.
  - Bottom panel: `Test Case` (editable cases) · `Output` (verdict, stdout, runtime, memory, failing case diff).
- Mobile: stacked tabs (Problem / Code / Output) instead of split.

**3. Backend execution**
- Edge function `run-code` proxies to **Judge0 CE** (RapidAPI). Accepts `{ source, language_id, stdin, expected_output }`, polls until result, returns `{ status, stdout, stderr, time, memory }`.
- Edge function `submit-code` runs source against ALL hidden test cases for the problem, computes verdict (`Accepted`, `Wrong Answer`, `TLE`, `Runtime Error`, `Compile Error`), inserts a row in `code_submissions`, awards XP on first AC.
- Both functions require auth; Run is rate-limited (10/min/user), Submit (5/min/user) via in-memory token bucket.

**4. Submission history**
- Stored per-user; shown on problem detail "Submissions" tab and on a global page `/library/problems/submissions` (filter by problem, language, verdict).
- Row click opens read-only Monaco viewer with the exact submitted code.

**5. Sidebar**
- Add "Coding Problems" entry under the existing Practice group, icon `Terminal`.

---

### Technical details

**New files**
- `src/data/codingProblemsData.ts` — seed of ~30 LeetCode-style problems (Two Sum, Valid Parentheses, Reverse Linked List, etc.). Each: `{ id, slug, title, difficulty, topics[], description (md), examples[], constraints[], hints[], starterCode: Record<lang, string>, referenceSolution: Record<lang, string>, sampleTests[], hiddenTests[], timeLimitMs, memoryLimitKb }`.
- `src/pages/library/CodingProblems.tsx` — list page.
- `src/pages/library/CodingProblemDetail.tsx` — split-pane problem page.
- `src/pages/library/CodingSubmissions.tsx` — global submissions history.
- `src/components/coding/MonacoEditor.tsx` — wrapper around `@monaco-editor/react`.
- `src/components/coding/LanguageSelect.tsx`, `TestCasePanel.tsx`, `OutputPanel.tsx`, `SubmissionRow.tsx`, `VerdictBadge.tsx`, `ProblemDescription.tsx`.
- `src/hooks/useCodeRunner.ts`, `src/hooks/useCodingSubmissions.ts`, `src/hooks/useCodingProgress.ts`.
- `supabase/functions/run-code/index.ts`, `supabase/functions/submit-code/index.ts`.

**Database (migration)**
- `coding_problems_meta` (optional cache for stats: `problem_slug`, `total_submissions`, `total_accepted`, `acceptance_rate`).
- `code_submissions` (`id`, `user_id`, `problem_slug`, `language`, `source_code`, `verdict`, `runtime_ms`, `memory_kb`, `passed_tests`, `total_tests`, `failing_case`, `created_at`). RLS: users can `SELECT/INSERT` only their own rows; service role inserts via edge function.
- `code_drafts` (`user_id`, `problem_slug`, `language`, `source_code`, `updated_at`) — autosaves the editor every 1.5s so users don't lose work. RLS: own rows only.
- Trigger `log_code_submission_activity` → inserts into `user_activity_log` so coding submissions show up in My Activity heatmap.

**Code execution — Judge0**
- Use **Judge0 CE** via RapidAPI. Required secrets: `JUDGE0_API_KEY`, `JUDGE0_API_HOST` (e.g. `judge0-ce.p.rapidapi.com`). Will request both via `add_secret` once you approve the plan.
- Language IDs mapped: Python 3 (71), C++17 (54), Java (62), JS Node (63), C (50), Go (60), TypeScript (74).
- Submission flow: POST `/submissions?base64_encoded=true&wait=false` → poll `/submissions/{token}` until `status.id > 2` → return result.

**Routing (`src/App.tsx`)**
- Public: `/library/problems`, `/library/problems/:slug`.
- Protected: `/library/problems/submissions` (requires login to view your own history).

**Guest gating**
- Browsing problems and reading statements: open to guests.
- Run/Submit/draft autosave: prompt login (existing `LoginPromptDialog`).

**Routes/sidebar**
- `DashboardSidebar.tsx`: add `Coding Problems` to `practiceItems`, mark `/library/problems` in `ACTIVE_ROUTES`.

**Dependencies**
- Add `@monaco-editor/react` and `monaco-editor`.

**XP & achievements**
- First AC on a problem: +25 XP via existing `award_xp('topic_complete')`.
- New achievements (data only): "First Accepted", "10 Problems Solved", "Polyglot" (solve in 3 languages).

### Out of scope (future)
- Discuss tab content (placeholder only).
- Contest mode / leaderboards per problem.
- Custom user-uploaded problems.
- Linking existing DSA library questions to problems (queued for follow-up — schema already supports it via `problem_slug`).

