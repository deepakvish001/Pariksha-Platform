# Second Eye → Industry-Grade for College Adoption

To make Second Eye trustworthy enough for every college to deploy at scale (placement drives, semester exams, hackathons), we need to harden it across **trust, governance, reliability, compliance, and operations**. The system already does live proctoring, evidence chains, integrity reports, audit logs, exports and pause/resume. This plan layers the missing pieces that institutions specifically demand before signing off.

---

## 1. Institutional Trust & Identity

- **Institution accounts**: new `institutions` + `institution_members` tables. Each contest owned by an institution; admins inherit role from membership.
- **SSO via SAML / Google Workspace** for college admins (already supported in Lovable Cloud — wire UI).
- **Verified candidate identity**: pre-contest ID-card capture + face match (Lovable AI vision) stored in `contest_identity_verifications`. Match score gates entry.
- **Public verification page** `/verify/:reportId`: anyone (recruiter, HoD, parent) can paste a report ID and see hash-chain status + signed PDF without logging in.

## 2. Governance, RBAC & Two-Person Rule

- Extend `app_role`: `proctor_viewer`, `proctor_reviewer`, `proctor_admin`, `institution_admin`.
- Server-side `has_role()` checks in every SideEye edge function (`pause`, `verify-chain`, `report`, `repair`, future `erase`, `evidence-pack`).
- **Two-person approval** for destructive actions (delete evidence, expunge chain, override DQ, mass review). New `sideeye_admin_approvals` table; UI dialog blocks until a second admin confirms.
- Harden `admin_audit_log`: add `ip`, `user_agent`, `actor_role`, `prev_hash` (its own tamper chain).

## 3. Compliance & Data Lifecycle (DPDP / GDPR ready)

- **Consent ledger**: `contest_sideeye_consents` records the exact consent text version, timestamp, IP, user-agent. Surfaced in integrity PDF.
- **Retention policy**: `retention_days` on `contests`. Daily cron purges raw frames/recordings past retention; chain + reports retained forever.
- **Right-to-erasure**: `contest-sideeye-erase-subject` edge function scrubs PII while keeping aggregate audit trail intact.
- **Region pinning**: `data_region` on contests; storage routed accordingly.
- **DPA-ready exports**: one-click "Compliance bundle" = consent records + retention policy + audit chain proof.

## 4. Reliability, Scale & Idempotency

- **Idempotency keys** on `frame-analyze`, `report`, `verify-chain`, `pause`; new `sideeye_idempotency` table dedupes retries under flaky college Wi-Fi.
- **Dead-letter queue** `sideeye_failed_analyses` with retry counter; hourly cron retries up to 5x then alerts.
- **Adaptive sampling**: when frame queue depth high, mobile cuts cadence 15s → 30s automatically (server flag pulled by `SideEyeMobile`).
- **Backpressure-aware exports**: existing streaming exports already paginate; add resume-from-cursor so a dropped export can be continued.

## 5. Detection Quality (fewer false positives)

- **Calibration capture**: 60s pre-contest baseline (room layout + face) per candidate. Subsequent flags compared against baseline → static posters or family photos no longer trigger "extra person".
- **Confidence bands** on every finding (`low|med|high`); bulk-review hides `low` by default; integrity PDF only includes `med`+.
- **Cross-signal fusion**: combine SideEye + primary webcam + screen analyses into one `unified_risk_score` per candidate with drill-down.
- **Reviewer feedback loop**: marking a finding as false-positive writes to `sideeye_review_feedback`; weekly cron rolls up FP-rate per finding type to tune thresholds.

## 6. Live Operations Console for Proctors

- **Multi-contest console** `/admin/sideeye`: severity heatmap across every active session, so one proctor supervises many rooms.
- **Live anomaly ticker** with audible alert (already present) + per-admin mute persistence.
- **Saved views** in audit log (filters + columns + sort) shareable across the team via `sideeye_admin_views`.
- **Keyboard-first review**: `j/k` rows, `r` review, `e` edit note, `x` mark FP, `?` help.
- **Chain-break diff view**: side-by-side expected vs actual hash + previous valid frame thumbnail + uploader IP.
- **HR/Placement dispute pack**: one-click ZIP = filtered audit CSV + integrity PDF + 7-day signed evidence URLs (new `contest-sideeye-evidence-pack` function).

## 7. Observability & Status

- **Structured JSON logging** in every SideEye function (`session_id`, `actor_id`, `latency_ms`, `outcome`).
- **SLO dashboard** `/admin/contests/:id/sideeye/health`: pair-success %, time-to-pair, frame-analysis p95, chain-verify duration, TURN-relay ratio, mobile-backgrounding rate. Backed by `sideeye_metrics` materialized view (5-min refresh).
- **Synthetic monitor** (hourly cron) runs a fake pairing flow end-to-end; alerts admins if any step exceeds SLO.
- **Public status snippet** for institutions: 90-day uptime + recent incidents.

## 8. Candidate-Side Polish (trust-building)

- Clear pre-contest screen: what's recorded, why, retention period, who can view, how to request erasure. Linked from every page.
- Connection-quality dot on the candidate view too (not just admin) so they know their stream is healthy.
- "Report a problem" button posts to a `sideeye_candidate_reports` table that admins triage in the proctor console.

---

## Technical changes summary

**New tables**
`institutions`, `institution_members`, `contest_identity_verifications`, `contest_sideeye_consents`, `sideeye_admin_approvals`, `sideeye_idempotency`, `sideeye_failed_analyses`, `sideeye_metrics` (mat. view), `sideeye_admin_views`, `sideeye_review_feedback`, `sideeye_candidate_reports`.

**New columns**
- `app_role` enum: `proctor_viewer`, `proctor_reviewer`, `proctor_admin`, `institution_admin`.
- `contests`: `institution_id`, `retention_days`, `data_region`, `two_person_rule`, `calibration_required`.
- `admin_audit_log`: `ip`, `user_agent`, `actor_role`, `prev_hash`.
- SideEye finding rows: `confidence`.

**New edge functions**
`contest-sideeye-erase-subject`, `contest-sideeye-evidence-pack`, `contest-sideeye-health-metrics`, `contest-sideeye-synthetic-monitor`, `contest-identity-match`.

**Updated edge functions**
All SideEye functions get role checks via `has_role()`, structured logging, idempotency keys.

**Cron**
`sideeye-retention-purge` (daily), `sideeye-dlq-retry` (hourly), `sideeye-metrics-refresh` (5 min), `sideeye-synthetic-monitor` (hourly), `sideeye-fp-feedback-rollup` (weekly).

**Frontend**
- New routes: `/admin/sideeye` (multi-contest), `/admin/contests/:id/sideeye/health`, `/verify/:reportId`.
- New components: `SideEyeUnifiedRiskBadge`, `SideEyeChainDiff`, `SideEyeSavedViews`, `SideEyeEvidencePackButton`, `SideEyeApprovalDialog`, `SideEyeCalibrationCapture`, `SideEyeConsentScreen`, `PublicVerifyReport`.
- Updates: `SideEyeMobile.tsx` (calibration, adaptive sampling, candidate quality dot, problem report), `SideEyeAuditBulkReview.tsx` (saved views, keyboard nav, FP marking, idempotency, resume-from-cursor exports), `AdminContestProctor.tsx` (multi-contest links, two-person dialogs).

---

## Suggested rollout order

1. **Batch A — Trust foundations**: institutions + RBAC + two-person rule + audit-chain hardening + public verify page.
2. **Batch B — Compliance**: consent ledger + retention purge + right-to-erasure + identity verification.
3. **Batch C — Reliability**: idempotency + DLQ + adaptive sampling + resume-from-cursor exports.
4. **Batch D — Detection quality**: calibration + confidence bands + unified risk score + FP feedback loop.
5. **Batch E — Ops console**: multi-contest console + saved views + chain-break diff + dispute pack.
6. **Batch F — Observability**: SLO dashboard + synthetic monitor + public status snippet.

Recommend starting with **Batch A + B together** — they unlock the rest and are what colleges ask for first (RBAC, consent, retention, identity, public verifiability). No new external secrets required for A; B can use Lovable Cloud Vault for at-rest key wrapping (no user secret needed).

Reply with which batches to proceed with, or "all" to run them in order.
