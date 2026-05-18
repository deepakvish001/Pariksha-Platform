## Goal

Deliver a simple, neat, industry-level UI for:
1. **Org Dashboard** (owner + admin overview)
2. **Assessments**: list → detail (analytics) → manage (builder)
3. **Attempt Detail** (per-candidate review)
4. **Student Test Flow**: welcome → system check → identity & proctor → consent → in-test (split coding IDE) → submit → result

Visual language: keep the existing deep-black (#030305) + amber (#f59e0b) theme via semantic Tailwind tokens. No new color systems — only refine layout, hierarchy, spacing, and typography.

## Design principles (applied to every screen)

- **One purpose per screen.** Primary action top-right, secondary actions in overflow.
- **Generous whitespace, 12-col grid, max-w-7xl container.** Edge-to-edge dynamic padding (existing standard).
- **3 levels of hierarchy max**: page title → section title → card label.
- **Cards over borders.** Subtle `bg-card/40 backdrop-blur border-border/40`, 16–20px radius.
- **Numbers first.** KPI tiles show value 30–36px, label 12px muted, trend chip.
- **Status by color, not text alone**: success=emerald, warning=amber, danger=rose, neutral=muted (all semantic tokens).
- **Empty states with one CTA + illustration.** Loading = shimmer skeletons, never spinners on full page.

---

## 1. Org Dashboard (`/org/:slug` → `b2b/pages/Dashboard.tsx`)

```text
┌──────────────────────────────────────────────────────────────┐
│ Greeting · Org name                       [+ New assessment] │
├──────────────────────────────────────────────────────────────┤
│  [Active]   [Live attempts]  [Avg score]  [Flagged]          │  ← 4 KPI tiles
├───────────────────────────────┬──────────────────────────────┤
│  Recent assessments (table)   │  Live proctoring strip       │
│  name · attempts · avg · ···  │  thumbnails of in-progress   │
├───────────────────────────────┴──────────────────────────────┤
│  Activity feed (last 24h)           Quick actions card       │
└──────────────────────────────────────────────────────────────┘
```

- Role-aware: owner sees Billing/Members tiles, admin doesn't, recruiter sees only candidates pipeline. Driven by existing `useCan`.
- Trim current 849-line `Dashboard.tsx` by extracting `KpiTile`, `RecentAssessmentsTable`, `LiveProctorStrip`, `ActivityFeed` into `src/b2b/components/dashboard/`.

## 2. Assessments

### List (`assessments/List.tsx`)
- Top bar: search · status filter chips (Draft / Live / Closed) · sort · **New** button (already RBAC-gated).
- Card-row layout (not dense table): title, status pill, duration, attempts/limit, avg score, action menu.

### Detail (`assessments/Detail.tsx`)
- Header: title + status + "Manage" + "Share link".
- Tabs: **Overview** (KPIs + score histogram + section breakdown) · **Attempts** (filterable table) · **Proctoring** (flagged events) · **Settings**.

### Manage / Builder (`assessments/Manage.tsx`)
- 3-pane: left section list, center question editor, right settings/preview.
- Sticky bottom bar: Save draft · Publish.

## 3. Attempt Detail (`assessments/AttemptDetail.tsx`)

- Header: candidate name, email, score chip, time taken, integrity score.
- Left rail: question palette (correct/incorrect/flagged colors).
- Center: question + candidate's answer + correct answer diff.
- Right: proctoring timeline (events, snapshots, side-eye link) + seal verify badge.

## 4. Student Test Flow (NEW)

New route group `src/pages/test/` with stepper layout `TestFlowLayout.tsx`:

```text
[1 Welcome] — [2 System check] — [3 Identity] — [4 Consent] — [ Start ]
```

Stepper is sticky-top, minimal (numbered dots + label), progress fills in amber.

### 4.1 Welcome (`TestWelcome.tsx`)
- Centered card: assessment title, duration, sections summary table, rules bullet list, big **Continue** button.

### 4.2 System & device check (`TestSystemCheck.tsx`)
- Grid of 4 check cards: Camera · Microphone · Network speed · Browser. Each: icon, live status (checking/ok/fail), retry button. Continue disabled until all pass.

### 4.3 Identity & proctor setup (`TestIdentity.tsx`)
- Two panels: ID photo capture (with overlay frame) + selfie capture. Then "Pair side-eye phone" → existing QR pair (`SideEyeMobile`) inline.

### 4.4 Consent & honor code (`TestConsent.tsx`)
- Scrollable rules, three explicit checkboxes (no AI tools / no second person / accept recording), type-to-sign full name, **Start Test** primary button.

### 4.5 In-test — Split coding IDE (`TestRunner.tsx`)
```text
┌────────────────────────────────────────────────────────────────┐
│ Q 3 / 12 · ⏱ 47:12     [Palette ▾]  [Flag] [Save] [Submit]     │
├──────────────────────────┬─────────────────────────────────────┤
│  Problem statement       │  Monaco editor (language switcher)  │
│  • Description           │  ────────────────────────────────── │
│  • Examples              │  Console / Test cases / Output tabs │
│  • Constraints           │                                     │
└──────────────────────────┴─────────────────────────────────────┘
```
- Resizable split (existing pattern in `ContestPlayProblem`).
- Question palette is a slide-over from the right (not always-on rail) for focus mode.
- Tiny proctor pip bottom-right (self-cam + side-eye dot).
- Auto-save indicator next to timer.

### 4.6 Submit confirmation (`TestSubmit.tsx`)
- Summary: answered/unanswered/flagged counts, time remaining warning, **Submit final** with typed confirmation.

### 4.7 Post-submit (`TestComplete.tsx`)
- Calm success screen: "Submitted at HH:MM", next steps, link to candidate dashboard. No score unless org allows instant results.

## Routing

- `/test/:attemptId/welcome | check | identity | consent | run | submit | done` under `TestFlowLayout`.
- Guard: must be authenticated candidate with valid live attempt; redirects back to last incomplete step on refresh (localStorage).

## Component library additions (`src/b2b/components/ui/`)

- `KpiTile`, `StatusPill`, `SectionCard`, `EmptyState`, `StepperHeader`, `DeviceCheckCard`, `CaptureFrame`, `SplitPane`, `QuestionPalette`.

## Files to create

- `src/b2b/components/dashboard/{KpiTile,RecentAssessmentsTable,LiveProctorStrip,ActivityFeed}.tsx`
- `src/b2b/components/ui/{StatusPill,SectionCard,EmptyState,StepperHeader}.tsx`
- `src/pages/test/TestFlowLayout.tsx`
- `src/pages/test/{TestWelcome,TestSystemCheck,TestIdentity,TestConsent,TestRunner,TestSubmit,TestComplete}.tsx`
- `src/components/test/{DeviceCheckCard,CaptureFrame,SplitPane,QuestionPalette,ProctorPip}.tsx`

## Files to edit

- `src/b2b/pages/Dashboard.tsx` — slim down, use new components, role-aware tiles.
- `src/b2b/pages/assessments/List.tsx` — card rows + filter chips.
- `src/b2b/pages/assessments/Detail.tsx` — tabbed analytics layout.
- `src/b2b/pages/assessments/Manage.tsx` — 3-pane builder.
- `src/b2b/pages/assessments/AttemptDetail.tsx` — palette + diff + proctor timeline.
- `src/App.tsx` — register `/test/:attemptId/*` routes.

## Out of scope (this pass)

- No new business logic, no DB schema changes, no scoring rules changes.
- Existing zero-trust hooks (`useBehavioralBaseline`, `useZeroTrustWatcher`, side-eye) are reused as-is.
- Builder backend untouched; only the editing surface UI is reshaped.

## Validation

- Visual QA on desktop (1440), laptop (1280), tablet (820), mobile (390).
- RBAC matrix: render dashboard as owner / admin / proctor / recruiter / viewer — confirm tiles & actions hide correctly via `useCan`.
- Student flow: walk all 7 steps; refresh on each to confirm step persistence.
- Run existing test suite; add smoke tests for `TestFlowLayout` step guard.
