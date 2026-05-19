# Internal Student Placement Profile — Enhanced

The page already exists at `src/b2b/pages/placements/StudentPlacementProfile.tsx` (route `/b2b/placements/students/:studentId`) with a header, strengths radar, key stats, offers timeline, and Share dialog. This plan **augments** it with three things the user asked for:

1. **Computed score breakdown** — show how the 0–100 score was built.
2. **Resume link** — pull the linked user's resume and surface View / Download.
3. **HR-ready highlights** — auto-generated, copy-paste-ready bullets for placement coordinators sending the candidate to recruiters.

Frontend-only. No DB / RPC / edge-function changes. Reuses the existing `placement_student_scores.scores` jsonb (already returns `assessment_score`, `integrity`, `engagement`, `shortlist_rate`, `offer_factor`).

## File changes

Only `src/b2b/pages/placements/StudentPlacementProfile.tsx` is edited. New sections are added below the existing header; nothing existing is removed.

## 1. Score breakdown card

A new `GlassCard` placed beside the radar (replacing the current 2-column layout with a 3-column grid on `lg`).

Columns:

```text
weight | metric          | raw % | contribution
40%    | Assessment      |  82   | 32.8
20%    | Integrity       |  95   | 19.0
15%    | Applications    |  60   |  9.0
10%    | Shortlisted     |  40   |  4.0
15%    | Offer factor    | 100   | 15.0
                                  ───────
                          Total   79.8 / 100
```

- Source: `score.scores` jsonb (already populated by `placement_recompute_scores`).
- Weights are the constants used in the RPC; hard-coded in the component as a `WEIGHTS` map so the UI stays in sync if the formula evolves.
- Each row renders the metric label, a thin progress bar (raw %), and the weighted contribution. Total at the bottom matches `score.score`.

## 2. Resume + linked-account card

Below the breakdown, a `GlassCard` showing the linked user (if `org_students.user_id` is set):

- Fetch `profiles` row via `supabase.from("profiles").select("id, full_name, avatar_url, resume_url, headline, location, github_url, linkedin_url, portfolio_url").eq("id", student.user_id).maybeSingle()`.
- Render:
  - Avatar + headline + location.
  - Social links row (GitHub / LinkedIn / Portfolio) — only if present.
  - **Resume row** — large button: `View resume` (opens `resume_url` in new tab) + `Download` (anchor with `download` attr). Falls back to `Resume not uploaded yet` empty state.
- If `student.user_id` is null, show a muted "Student has not yet activated their Byteskill account" hint instead of the card.

`profiles` already has public-read RLS on those fields (used across public profile pages), so no schema change is needed.

## 3. HR-ready highlights card

A `GlassCard` titled **HR-ready highlights** with a `Copy bullets` button (uses `navigator.clipboard.writeText`, `toast.success` on copy).

Bullets are generated client-side from the data already in scope (`student`, `score`, `offers`, optionally `applications`). Each bullet is only included if its underlying signal is meaningful:

- Top-3 rank: `Ranked #{rank_in_org} in {org.name} (top {percentile}% of placement cohort).`
- Branch rank: `#{rank_in_branch} in {branch}.`
- Assessment: `Average assessment score {avg_assessment_score}% across {assessments_taken} proctored tests.`
- Integrity: `Assessment integrity {avg_integrity}% (proctored).`
- Multi-offer: `Holds {offers_count} placement offers, including from {top_recruiter_names}.`
- Top CTC: `Highest offer ₹{top_ctc/100000}L from {recruiter}.`
- Engagement: `Applied to {applications_count} drives, shortlisted in {shortlisted_count}.`
- Branch / batch: `{branch}, batch of {batch_year}.`
- Dream offer flag if any.

The card shows them as a list with checkboxes — the user can toggle bullets in/out before copying. The Copy button copies only checked bullets, joined with `\n• ` prefix.

## 4. Drive applications mini-table (small, optional)

Pulled in same screen because HR often asks "what stage are they in for X drive?":

- `supabase.from("drive_applications").select("id, stage, current_round, last_event_at, drive:placement_drives(title, recruiter:recruiters(name))").eq("student_id", studentId).order("last_event_at", { ascending: false }).limit(10)`.
- 4-column table: Drive · Recruiter · Stage · Last update. Empty state: "No drive activity yet."

Placed at the bottom, above the existing Offers timeline.

## Layout

```text
[ Back ]
[ Header card (existing, kept as-is) ]

[ Radar           |  Score breakdown |  Key stats ]   (lg:grid-cols-3)

[ Resume + linked profile card                   ]

[ HR-ready highlights (copy bullets)             ]

[ Drive applications                              ]
[ Offers timeline (existing)                      ]
```

On `<lg`, everything stacks single-column.

## Technical Notes

- All new queries are additional `useQuery` hooks alongside the existing ones (`profile`, `applications`).
- All colors via semantic tokens (`hsl(var(--primary))`, etc.) — no hard-coded hex except the existing emerald/amber accents already in the file.
- Type the score jsonb as `Record<string, number>` and read defensively (default 0).
- Percentile calculation: needs org total — fetch `count` from `org_students` filtered by `org_id` (cheap head request). Cached per org.
- No changes to `ShareDialog`, RPC contracts, or routing.

## Out of Scope

- Editing the score formula or adding new score components.
- Recompute trigger UI (lives on Rankings tab).
- Public/HR-facing view (already covered by `PublicStudentProfile.tsx`).
- Resume upload UI for admins on behalf of students.