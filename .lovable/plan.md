## Placement Report Dashboard — Plan

A new B2B surface at `/colleges/:slug/placements` (and `/companies/:slug/placements` for parity) that turns Parikshaa's existing assessment data into a full **placement intelligence** dashboard, similar in spirit to Superset/Looker but purpose-built for college TPOs and leadership.

### 1. Audience & layout

Role-based shell on a single route. The current user's `org_members.role` (already in the schema) decides the default view; a small toggle lets them switch.

```text
┌─ Placement Report ────────────── [TPO] [Leadership] [Public]
├─ Global filter bar (sticky)
│   Batch • Branch/Section • Date range • Drive status •
│   CTC band • Sector • Student status   [Save view] [Reset]
├─ KPI strip (changes per view)
├─ Main grid
│   TPO:        Operational tables + funnel + drill-downs
│   Leadership: Trends + branch comparison + AI narrative
│   Public:     Highlights + top recruiters + CTC distribution
└─ AI dock (right rail)  — NL Q&A + saved insights
```

### 2. Data model (new tables under `public.`)

Existing reusable tables: `organizations`, `org_members`, `org_students`, `assessments`, `assessment_attempts`, `assessment_invites`.

New tables to add (all org-scoped with strict RLS via `has_org_role`):

- **recruiters** — `org_id`, `name`, `sector` (enum), `website`, `hq_city`, `notes`, `contacts jsonb[]`, `first_visit_year`, `last_visit_year`, `is_repeat bool`.
- **placement_drives** — `org_id`, `recruiter_id`, `title`, `role_title`, `drive_type` (on_campus / pool / off_campus / virtual), `status` (upcoming / open / closed / cancelled), `opens_at`, `closes_at`, `eligibility jsonb` (min_cgpa, allowed_branches[], max_backlogs, batch_years[]), `ctc_min`, `ctc_max`, `currency`, `location`, `bond_months`.
- **drive_eligibility** — view/materialised view that joins `org_students` × `placement_drives.eligibility` to compute the eligible pool per drive (used for funnel + shortlist screens).
- **drive_applications** — `drive_id`, `student_id`, `applied_at`, `stage` (applied / shortlisted / round_n / offered / rejected / withdrew), `current_round`, `last_event_at`, `notes`.
- **placement_offers** — `drive_id`, `student_id`, `recruiter_id`, `offered_at`, `accepted_at`, `declined_at`, `ctc`, `currency`, `role_title`, `location`, `offer_type` (intern / fte / ppo), `is_dream_offer bool`.
- **placement_views** — saved filter sets per user (`org_id`, `user_id`, `name`, `filters jsonb`, `is_shared bool`).
- **placement_ai_runs** — append-only log of AI Q&A and narrative generations (`org_id`, `user_id`, `kind`, `prompt`, `response`, `filters jsonb`, `tokens`, `cost_cents`).
- **placement_snapshots** — nightly materialised aggregates per `(org_id, batch_year, branch)`: `placed_count`, `multi_offer_count`, `avg_ctc`, `median_ctc`, `top_ctc`, `dream_offers`, `total_eligible`. Powers fast leadership charts and the public report.

Indexes on `(org_id, batch_year, branch)`, `(drive_id, stage)`, `(student_id, accepted_at)`. Triggers to flip `is_repeat` on `recruiters` when a second drive lands.

### 3. Filter system (URL-persisted, shareable)

A single `PlacementFilters` context that mirrors to `useSearchParams`. Every chart, KPI, table, and AI call reads from this single source:

- Multi-select: branch, section, batch year, drive status, sector, student status (placed / unplaced / multi_offer / accepted / declined).
- Range: date range (drive close date or offer date — toggle), CTC band slider, CGPA band.
- Free-text: recruiter name (with combobox autocomplete from `recruiters`).
- Save current filter set → `placement_views` row → appears in a "Saved views" dropdown, shareable via URL `?view=<id>`.

Server-side filtering done in a single `rpc('placement_overview', filters jsonb)` function that returns a typed payload of all KPI/series data the page needs in one round-trip — keeps the UI fast and the SQL central.

### 4. KPIs & visuals (Recharts; same theme tokens as existing b2b cards)

TPO view:
- KPIs: Eligible / Applied / Shortlisted / Offered / Accepted (5-stage funnel), Placement %, Multi-offer %, Avg & Median CTC, Highest CTC, Dream-offer count.
- Tables: Live drives (with stage funnel mini-bars), Pending shortlists, Unplaced eligible students, Open offer decisions.
- Drill-down: clicking a KPI or chart segment writes to filter context and reveals the underlying row list with bulk actions (email students, export CSV).

Leadership view:
- Year-over-year placement % line, branch comparison bar, CTC distribution histogram, sector mix donut, top-10 recruiters table, "Where we slipped" panel auto-filled by the AI narrative.

Public/shareable report at `/colleges/:slug/placements/public`:
- Pre-rendered from `placement_snapshots`, no auth, JSON-LD `Dataset` schema for SEO. Org admin toggles which batches/sections are public from Settings.

### 5. AI layer (Lovable AI Gateway, server-side only)

All AI calls live in **Supabase Edge Functions** with `LOVABLE_API_KEY`. Default model `google/gemini-3-flash-preview`; switch to `google/gemini-2.5-pro` for the weekly narrative.

a. **NL Q&A** — `placement-ai-query` edge function. AI SDK `streamText` + tool calling:
   - Tool `get_overview(filters)` → calls `rpc('placement_overview', …)`.
   - Tool `list_students(filters, limit)` → returns minimal student rows (PII-safe).
   - Tool `compare_branches(batch_year)`.
   - Tool `recruiter_history(recruiter_id)`.
   - The model translates "how did CSE 2025 do vs 2024" into the right tool calls, then formats a markdown answer. Renders in the AI dock with chart suggestions (model returns optional `{chart: 'bar', x:'branch', y:'placed_pct'}` JSON via `Output.object`).

b. **Weekly narrative** — `placement-ai-digest` edge function, scheduled via `pg_cron` Mondays 06:00 IST. Pulls last 7 days of drives/offers, asks the model for a TPO-ready summary with sections: Wins / Risks / Branches falling behind / Recruiter follow-ups. Stored in `placement_ai_runs` and emailed via existing Resend setup; also pinned to the dashboard.

c. **At-risk unplaced** — `placement-ai-atrisk` edge function. Hybrid score:
   - Deterministic: low assessment readiness (existing `assessment_attempts`), low applications-per-eligible, no shortlists in 30 days, CGPA vs. recruiter floor gap.
   - AI re-ranks the top 200 and produces a 1-line "why" + a suggested intervention per student (mock interview, specific roadmap, recruiter to target). Output via `Output.object` with a strict schema, stored as a `at_risk_snapshot` row refreshed nightly.

d. **Recruiter outreach drafts** — modal on any recruiter row. Edge function pulls recruiter history + current open roles, generates a personalised email (subject + body) using past hiring patterns. User edits → "Copy" or "Send via Resend".

All AI runs logged to `placement_ai_runs` for audit, cost, and rate-limit telemetry. 429 and 402 surfaced as toasts.

### 6. Routing, navigation, access

- New route: `src/b2b/pages/placements/PlacementsDashboard.tsx`, nested under `OrgShell`.
- Sub-routes: `/recruiters`, `/drives`, `/drives/:id`, `/offers`, `/reports/:viewId`, `/public` (no auth).
- Sidebar: add a **Placements** group with icons (Briefcase, Building2, Trophy, Sparkles for AI dock).
- RLS: every new table follows the existing `has_org_role(auth.uid(), org_id, role)` pattern. Public report uses an `is_public` flag on `placement_snapshots` and a SECURITY DEFINER view that strips PII.

### 7. Imports & data entry

- Drive / offer entry modal (Sheet + react-hook-form + zod).
- CSV importer for legacy years: `placement-import` edge function parses CSV → maps to `org_students`, `placement_offers`, `recruiters` with a dry-run preview.
- Webhook intake at `placement-webhook-in` so colleges can push from their ERP.

### 8. Build order (incremental, each shippable)

1. **Schema + RLS** — new tables, `rpc placement_overview`, snapshot job.
2. **Filter context + URL sync + saved views** — wired to a stub `placement_overview` that returns mock data.
3. **TPO dashboard** — KPI strip, funnel, live drives table, drill-downs.
4. **Recruiter directory + drive/offer CRUD + CSV import.**
5. **Leadership view + public report + JSON-LD SEO.**
6. **AI dock — NL Q&A** (tool-calling, streaming, chart hinting).
7. **Weekly narrative** (cron + email + pinned card).
8. **At-risk predictions** (deterministic score → AI re-rank → suggestions).
9. **Recruiter outreach drafts.**
10. **Analytics polish** — cost dashboards for AI usage in admin.

### Technical notes (for engineers, skip if non-technical)

- Charts: Recharts; theme tokens from `src/b2b/theme.css` so dark-mode is automatic.
- Tables: TanStack Table; reuse `Responsive table` pattern from project memory (no horizontal scroll).
- Forms: react-hook-form + zod; existing Sheet pattern.
- AI SDK: `@ai-sdk/openai-compatible` + `ai`, gateway at `https://ai.gateway.lovable.dev/v1`, `Lovable-API-Key` header. `streamText` with `stopWhen: stepCountIs(50)`; structured outputs via `Output.object`.
- Embeddings (optional, phase 2): index drive descriptions and recruiter notes with `google/gemini-embedding-001` + pgvector(3072) for semantic recruiter search ("companies that hire similar to Razorpay").
- Realtime: subscribe drives/offers via `supabase_realtime` so the funnel updates live during drive day.
- i18n: every label through `useTranslation()`, locale JSON under `src/i18n/locales`.
- Memory: add a new project memory `features/placements/system` once shipped.

This plan keeps everything inside the existing org/auth model, reuses your assessment data for "readiness", and layers a focused AI surface on top instead of a generic chatbot.