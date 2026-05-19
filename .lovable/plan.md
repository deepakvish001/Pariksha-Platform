## Assessment Landing Page

A single, polished, shared landing screen that opens before anyone enters an assessment — both for admins (after they create/open one) and for candidates (when they click an invite link). It surfaces every important fact about the assessment in one beautiful, deep-black + amber glass layout, and has one obvious next step at the bottom.

Today both flows skip this experience:
- Admins land directly inside `/b2b/.../assessments/:id` on a multi-tab edit screen (`Detail.tsx`) — heavy, no overview.
- Candidates hit `/assessments/join/:token` which silently auto-claims the invite and bounces them to the lobby — they never get a chance to read what they signed up for.

### What the landing looks like

Same shared component for both audiences, with mode-specific buttons only at the bottom.

```text
┌──────────────────────────────────────────────────────────────┐
│  [Org logo]  Acme Corp                       ● Published     │
│  ─────────────────────────────────────────────────────────── │
│   Backend Engineer Screening — Q1                            │
│   Two-round screening for senior backend candidates.         │
│                                                              │
│   ⏱ 90 min   📑 3 sections · 18 questions   🎯 Pass 60%      │
│   🛡 Strict proctoring   🔁 1 attempt   📅 Closes in 4d 11h  │
└──────────────────────────────────────────────────────────────┘

┌─ What you'll do ───────────┐ ┌─ Rules & integrity ─────────┐
│ 1. Coding round · 45m      │ │ • Fullscreen required        │
│    5 problems              │ │ • Tab switches penalised     │
│ 2. SQL · 20m · 4 queries   │ │ • Camera + mic on            │
│ 3. System design · 25m     │ │ • Copy / paste blocked       │
└────────────────────────────┘ └──────────────────────────────┘

┌─ What you'll need ─────────┐ ┌─ After you submit ──────────┐
│ ✓ Stable internet          │ │ Results released automatically│
│ ✓ Working webcam + mic     │ │ Receipt PDF emailed          │
│ ✓ Quiet space, 90 minutes  │ │ Retakes: not allowed         │
│ ✓ Govt ID for identity     │ │                              │
└────────────────────────────┘ └──────────────────────────────┘

╔══════════════════════════════════════════════════════════════╗
║ Sticky bottom bar:                                           ║
║  [candidate]  Cancel    →    Start assessment                ║
║  [admin]     Edit  Take preview  Copy invite  →  Live monitor║
╚══════════════════════════════════════════════════════════════╝
```

Visual style follows the existing B2B aesthetic from memory: deep black background, animated orbs, glassmorphism cards, amber→primary gradient headline. Org's saved `brand_color` (Settings → Branding) tints the hero accent so each org's landing feels custom-branded.

### Two flows it powers

**Admin flow** — open `/b2b/{org}/assessments/{slug}`
- This URL currently renders the multi-tab `Detail.tsx`. It now renders the landing.
- `Detail.tsx` (sections, invites, results, proctoring, insights, settings tabs) moves to `/b2b/{org}/assessments/{slug}/edit`.
- After `New.tsx` finishes creating an assessment, the existing `navigate(...assessment(slug))` already lands users here — no change to creation flow, just nicer destination.
- Sticky bar shows: **Edit · Take preview · Copy invite link · Live monitor**, plus a primary **Publish / Archive** action based on status. Draft-only "What's missing" checklist (no sections, no questions, no schedule) shows inline so admins know exactly what to fix before publishing.

**Candidate flow** — open `/assessments/join/{token}`
- Currently auto-claims and redirects. New behaviour: render the landing with a small "You've been invited" header showing the invited email, **without consuming the invite**.
- Primary CTA "Start assessment" then runs the existing `claimInvite(token)` and forwards to `/assessments/{attemptId}/lobby` — exactly the current behaviour, just gated behind an informed click.
- If unauthenticated, the page still renders (read-only) so candidates can see what they're signing up for; the Start button prompts login first (preserving the existing `post_login_redirect` flow).

### What's on the page (data sources)

All data is read-only on the landing; no edits happen here.

| Section | Source |
|---|---|
| Org name, logo, brand colour | `organizations` |
| Assessment title, description, duration, max_attempts, proctoring_enabled, proctoring_config, show_results_to_candidate, starts_at, ends_at, status | `assessments` |
| Sections list with per-section duration + question count | `assessment_sections` + `assessment_section_questions` (count only) |
| Pass mark, retake default, auto-release | already on assessment row (falls back to org defaults) |
| Live "opens in / closes in" countdown | computed client-side from `starts_at`/`ends_at` |
| **Admin-only:** invite count, attempts started, attempts submitted | re-use `useDashboardStats` / `useAttempts` (already exist) |

### Technical details

**New files**
- `src/b2b/components/assessment/AssessmentLandingHero.tsx` — hero card (org chip, title, gradient, stat row).
- `src/b2b/components/assessment/AssessmentLandingSections.tsx` — "What you'll do" with sections + question-type icons.
- `src/b2b/components/assessment/AssessmentLandingIntegrity.tsx` — human-readable summary of `proctoring_config` (re-uses existing `proctoringConfig.ts` helpers).
- `src/b2b/components/assessment/AssessmentLandingChecklist.tsx` — "What you'll need" derived from proctoring flags.
- `src/b2b/components/assessment/AssessmentLandingAfterSubmit.tsx` — small card built from `show_results_to_candidate`, retake, auto-release.
- `src/b2b/components/assessment/AssessmentLandingCountdown.tsx` — schedule chip with live countdown.
- `src/b2b/components/assessment/AssessmentLandingStickyBar.tsx` — sticky bottom CTA bar, takes `mode` and slots.
- `src/b2b/pages/assessments/Landing.tsx` — admin-mode container, fetches via existing `useAssessment` + `useSections` + a new lightweight `useSectionQuestionCounts` hook.
- `src/assessments/pages/InviteLanding.tsx` — candidate-mode container at `/assessments/join/:token`. Calls a new RPC for read-only preview, renders shared components, button runs existing `claimInvite`.

**Edited files**
- `src/App.tsx` — change `/b2b/.../assessments/:id` to render the new `Landing`; add `/edit` route for existing `Detail.tsx`; swap `/assessments/join/:token` to `InviteLanding`.
- `src/b2b/pages/assessments/Detail.tsx` — update the "Back" button and Manage redirects to point to the new `/edit` route.
- `src/lib/routing/paths.ts` — add `paths.b2b.assessmentEdit(...)` and update internal callers that used to point at `/b2b/assessments/:id` for editing (Detail.tsx itself, breadcrumbs, list row link stays at landing).

**Migration**
- New SECURITY DEFINER RPC `public.preview_assessment_invite(_token text)` returning a single JSON row: org `{name, logo_url, brand_color}`, assessment summary (no answer keys), sections array with `{title, duration_min, question_count}`, schedule window, invited email (if invite is single-use), and a discriminator `{ status: 'ok' | 'expired' | 'invalid' | 'wrong_email' }`. Returns no candidate-secret data and consumes nothing — the existing `claim_invite` RPC remains the only side-effect path. `GRANT EXECUTE … TO anon, authenticated`.

**Out of scope (kept untouched)**
- Player, lobby preflight, proctoring runtime — unchanged.
- Existing Detail tabs (sections/invites/results/etc.) — kept as-is, only moved to `/edit`.
- Brand-colour custom theming beyond a single accent on the hero — full per-org theming is a follow-up.
- Edits to `New.tsx` are not needed; it already navigates to the assessment URL after creation, which now renders the landing automatically.
