## Goal

Turn `/b2b/settings` from a single scroll page into a proper **Settings hub** with focused sections, so admins can configure their org without hunting around — and add the controls a real college/recruiter admin actually needs.

## What's there today

Single column with three blocks:
1. Organization profile (name, logo URL, brand color, email preview)
2. Candidate join link
3. Danger zone (delete org)

That's it. No defaults, no security controls, no audit, no notifications.

## Proposed structure — tabbed Settings

Replace the single column with a left-rail sub-nav inside `/b2b/settings`:

```text
Settings
├── General          (current "Organization profile" + join link)
├── Branding & Email (logo, brand color, email sender name, preview, footer text)
├── Assessment defaults
├── Security & Access
├── Notifications
├── Integrations
├── Audit log
└── Danger zone
```

Each section is its own card; URL becomes `/b2b/settings/:section` so links are bookmarkable.

## New sections — what each one does

**General**
- Display name, slug (read-only with copy), org type, created date.
- Candidate join link with copy.
- Time zone + locale (used for scheduling + email rendering).

**Branding & Email**
- Logo, brand color (already exists, moved here).
- Sender name shown in invite emails ("From: <name> via Parikshaa").
- Custom email footer / signature (small textarea).
- "Preview invitation email" button (already exists).

**Assessment defaults**
- Default duration (minutes).
- Default proctoring profile: off / standard / strict (writes to org default that `New Assessment` reads).
- Default pass mark (%).
- Allow candidate retake by default? (toggle).
- Auto-release results to candidate? (toggle).

**Security & Access**
- Allowed candidate email domains (chip input, e.g. `@iitb.ac.in`). Empty = open.
- Require MFA for team members (toggle, owner only).
- Team session length (8h / 24h / 7d).
- "Sign out all team sessions" button.

**Notifications**
- Where to send "assessment completed" digests: email list + optional Slack/webhook URL.
- Daily summary email toggle.
- Recipients for proctoring alerts.

**Integrations**
- Resend custom domain status (read-only, "Verified / Pending").
- Webhook URL for results (with secret + "Send test event").
- SSO / SAML placeholder card ("Contact us" CTA — wiring later).

**Audit log**
- Read-only paginated list of recent org actions: member added/removed, capabilities changed, assessment published, invite revoked, settings changed. Pulled from a new `b2b_org_audit` table. Filter by actor + action type. CSV export.

**Danger zone**
- Transfer ownership (owner picks another admin → confirm by typing org name).
- Delete organization (already exists, keep guard rails).

## Quality-of-life additions across all sections

- **Unsaved-changes bar** sticky at the bottom: "You have unsaved changes — Save / Discard" (same pattern we used for the invite dialog).
- **Field-level help** with a small `?` popover next to non-obvious settings.
- **Per-section permissions** — sections the current member can't edit render as read-only with a lock chip ("Owner only").
- **Search** at the top of Settings to jump to any field (small, optional).

## Out of scope for this iteration

- Billing/plan UI (no billing infra yet).
- Full SSO/SAML implementation (placeholder card only).
- Real-time audit log streaming (paginated fetch is enough).

## Technical notes

- New route shape: `/b2b/settings/:section` rendered by `B2BSettings.tsx` with a `<SettingsSidebar />` + `<Outlet />` style internal switch (no need for nested Router routes — keeps `App.tsx` clean).
- New columns on `organizations`: `sender_name`, `email_footer`, `default_duration_min`, `default_proctoring`, `default_pass_mark`, `allow_retake_default`, `auto_release_results`, `allowed_email_domains text[]`, `require_mfa`, `team_session_minutes`, `results_webhook_url`, `results_webhook_secret`, `notify_emails text[]`, `slack_webhook_url`, `timezone`, `locale`.
- New table `b2b_org_audit (id, org_id, actor_id, action, target, metadata jsonb, created_at)` with RLS: select if member of org with `org.editSettings`, insert via SECURITY DEFINER RPC `log_org_audit`.
- Hook into existing mutations (invite create/revoke, member cap change, assessment publish, settings save) to call `log_org_audit`.
- Reuse existing `useCan(orgId, cap)` for gating; introduce one new capability `org.viewAudit` (default included in admin + owner presets).
- No changes to `OrgShell` nav — "Settings" entry stays, sub-nav lives inside the page.

## Suggested build order (one PR each)

1. Refactor page into tabbed shell with current content split into **General** and **Branding & Email**. No new fields yet.
2. Add **Assessment defaults** + DB columns + wire `New Assessment` to read them.
3. Add **Security & Access** + allowed-domains enforcement on candidate join.
4. Add **Notifications** + webhook delivery edge function.
5. Add **Audit log** table, RPC, and UI; backfill emitters in existing mutations.
6. Add **Transfer ownership** in Danger zone.

Want me to start with step 1 only, or scope a different first slice?
