# Feature Roadmap: Making Parikshaa Stand Out

Parikshaa already has strong fundamentals (DSA sheets, contests, arena, proctoring, AI assistant, resume tools, roadmaps, college dashboards). Below is a curated set of features that competitors (LeetCode, GFG, InterviewBit, Unstop) lack or do poorly — grouped by impact and effort.

---

## Tier 1 — Signature Differentiators (high impact)

### 1. AI Mock Interview Studio (voice + video)
Live voice interview with an AI interviewer that asks DSA/system-design/HR questions, listens to the candidate's spoken answer, evaluates clarity + correctness, and produces a scorecard with timestamps.
- Uses Lovable AI Gateway (Gemini 2.5 Pro for reasoning, audio in/out).
- Replayable transcript, rubric scoring, "weak signal" highlights.
- Optional peer-mode: pairs two students for human mock.

### 2. Placement Readiness Score (PRS)
A single 0–100 score per student computed from: DSA mastery, SRS retention, contest rating, resume score, mock-interview scores, soft-skill signals.
- Visible to student and (with consent) to college TPO dashboard.
- Drives Adaptive recommendations and unlocks "Ready to apply" badges.

### 3. Company-Targeted Prep Paths
Pick a target company + role → auto-generated 4/8/12-week plan combining DSA topics, company-tagged questions, OA patterns, behavioral prompts, recent interview experiences.
- Plan adapts weekly to PRS deltas.
- Shows "students who cracked X did Y" social proof.

### 4. Real Interview Experience Marketplace
Verified students post recent interview rounds (questions, difficulty, rounds, verdict) → earn XP / cash credits. Others upvote/flag.
- Moderation queue in admin.
- Tie experiences directly to the question bank.

---

## Tier 2 — Engagement & Stickiness

### 5. Daily Live Coding Rooms
Twitch-style rooms where top students or mentors solve a problem live; viewers can fork the editor mid-stream. Recordings become content.

### 6. Squad / Study Group Mode
Private 3–6 person groups with shared streak, group leaderboard, weekly goals, group chat, accountability nudges.

### 7. Career Timeline & Portfolio Page
Auto-generated public page (`/u/handle`) showing verifiable achievements: solved problems, contest rating graph, badges, AI-mock scores, projects. Shareable on LinkedIn with an OG image.

### 8. Recruiter / TPO Discovery Search
Recruiters filter the verified student pool by skill, PRS, college, branch, location → request intros. Monetization channel.

---

## Tier 3 — Learning Depth

### 9. Interactive Visualizers for DSA + System Design
Drag-and-drop visualizers for graphs, trees, DP tables, LRU caches; system-design canvas with components (LB, cache, DB, queue) that auto-explains tradeoffs via AI.

### 10. Code Review Bot on Submissions
On every accepted submission, AI suggests cleaner idioms, time/space improvements, and a "senior-engineer rewrite" diff.

### 11. Multi-language Skill Trees
Beyond DSA: Python/Java/SQL/Git/Linux/DevOps mini trees with hands-on terminals (WebContainers) and certificate.

### 12. Spaced-Repetition Flashcards from Mistakes
Every wrong answer auto-becomes an SRS card; weekly "your weak spots" digest email.

---

## Tier 4 — College / B2B Moats

### 13. College Analytics Pro
Cohort drill-downs: at-risk students, topic heatmaps, predicted placement rate, weekly auto-report email to TPO.

### 14. White-label Mock Drives
TPOs schedule full mock placement drives (aptitude + coding + interview) with the existing proctoring stack; auto-shortlist by PRS.

### 15. Alumni Network Layer
Verified alumni connect to current students; mentorship slots bookable in-app.

---

## Tier 5 — Trust & Polish

### 16. Verified Skill Badges (cryptographic)
Signed credentials (Open Badges 3.0 / VC) students can attach to LinkedIn/resume — provably issued by Parikshaa.

### 17. Offline-first PWA + Mobile App Wrapper
Practice/SRS works offline; sync on reconnect. Bare-minimum mobile shell via Capacitor.

### 18. Accessibility & Localization Pass
i18n for Hindi/Tamil/Telugu/Bengali (i18n stack already wired), full keyboard nav, screen-reader audit, dyslexia-friendly font toggle.

---

## Suggested Build Order

```text
Phase 1 (4–6 wks): #2 PRS, #3 Company Paths, #7 Portfolio Page
Phase 2 (4–6 wks): #1 AI Mock Studio, #10 Code Review Bot, #4 Experience Marketplace
Phase 3 (4 wks):   #6 Squads, #13 College Analytics Pro, #16 Verified Badges
Phase 4 (ongoing): #5 Live Rooms, #9 Visualizers, #14 White-label Drives, #17 PWA, #18 i18n
```

## Technical notes
- All AI features route through existing Edge Functions + Lovable AI Gateway (Gemini 2.5 Pro / Flash, GPT-5 for code review).
- PRS = nightly Edge Function aggregating tables already present (xp, srs, contest_results, resume_score, mock_scores [new]).
- Mock Studio audio: Gemini live audio; store transcripts in `mock_sessions` table with RLS.
- Marketplace + Badges need moderation hooks in existing Admin Control Center.
- Portfolio page reuses existing PublicStudentProfile + JSON-LD SEO infra.

---

Tell me which tier or specific features to detail next, and I'll produce an implementation plan for that slice.