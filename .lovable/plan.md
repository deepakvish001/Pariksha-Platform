## Goal

Turn the Team page into a real teacher-management workspace where Owners/Admins can:

1. Add a specific teacher by email and send them a unique join link (only that email can use it).
2. Pick exactly which capabilities each teacher gets (custom checkboxes, not just a role).
3. Manage, revoke, and audit access from one screen.

---

## What changes for the user

**New Team page sections**
- **Members** — current list, now showing each person's resolved capabilities as small chips, with an "Edit access" button per row.
- **Pending invites** — email, who invited them, expires-in countdown, "Copy link", "Resend", "Revoke".
- **Invite a teacher** dialog — email field + capability checkboxes grouped by area (Assessments, Question Bank, Proctoring, Results, Members, Org settings). Optional "Preset" dropdown (Admin / Proctor / Recruiter / Viewer / Custom) that pre-fills the boxes; user can tweak afterward.

**Per-teacher custom capabilities**
- Replaces the "role only" model with a stored list of capability keys per member (role still kept as a label/preset for display).
- "Edit access" reuses the same checkbox grid; saving updates the member's capabilities immediately and invalidates the cached permission query so the UI reflects it on next navigation.

**Targeted, single-use join link**
- Invite stores: `org_id`, `email` (lower-cased), `capabilities[]`, `role_preset`, `inviter_id`, `token`, `expires_at` (default 7 days), `revoked`, `accepted_at`, `accepted_by`.
- Link format: `/b2b/join/:token`.
- Acceptance rule: the signed-in user's email must equal `invite.email` (case-insensitive). If not, show "This invite was sent to another email. Sign in with that address." No one else can consume it. Once accepted, token is burned (`accepted_at` set, link 410s).

**Who can do what**
- Only Owners and Admins see the "Invite a teacher", "Edit access", and "Revoke" controls (matches existing `members.invite` / `members.removeOrEdit` capabilities). Promote-to-Owner stays Owner-only.

---

## Technical section

**DB migration (new tool call)**
- New table `org_member_capabilities` — `id, org_id, member_id (fk org_members), capability text, created_at`. Unique `(member_id, capability)`. RLS: select if `useMyOrgRole(org_id)` returns any role; insert/delete only if caller has `members.removeOrEdit` (security-definer helper).
- Extend `b2b_org_invites`: add `capabilities text[] not null default '{}'`, `role_preset text`, `accepted_at timestamptz`, `accepted_by uuid`. Keep existing columns.
- RPC `accept_b2b_org_invite(_token text)` — SECURITY DEFINER. Validates: not revoked, not expired, not already accepted, `auth.email() = invite.email`. Inserts/updates `org_members` with `role = role_preset` (default `viewer`), bulk-inserts `org_member_capabilities` rows, marks invite accepted.
- RPC `create_b2b_org_invite(_org_id, _email, _capabilities text[], _role_preset text)` — SECURITY DEFINER. Checks caller has `members.invite` cap; inserts row; returns token.
- RPC `set_member_capabilities(_member_id uuid, _capabilities text[])` — SECURITY DEFINER. Checks caller has `members.removeOrEdit`; replaces capability rows atomically.

**Capability resolution (frontend)**
- New hook `useMyOrgCapabilities(orgId)` — queries `org_member_capabilities` for the current member; cached with the existing `staleTime: Infinity` pattern from `useOrg.ts`.
- Update `useCan(orgId, cap)`:
  - If the member has any rows in `org_member_capabilities`, allow when `cap` is in that set.
  - Otherwise fall back to the existing `CAPABILITY_MATRIX[role]` (keeps every current member working without backfill).
- Invalidate both `b2b/my-org-role` and `b2b/my-capabilities` queries on edits.

**New / changed files**
- `src/b2b/hooks/useOrgInvites.ts` — `useOrgInvites`, `useCreateOrgInvite`, `useRevokeOrgInvite`, `useResendOrgInvite` (calls existing transactional email function with the join URL).
- `src/b2b/hooks/useMemberCapabilities.ts` — `useMemberCapabilities(memberId)`, `useSetMemberCapabilities()`.
- `src/b2b/hooks/usePermissions.ts` — extend `useCan` as above; export `ALL_CAPABILITIES` grouped for the checkbox UI; add `useMyOrgCapabilities`.
- `src/b2b/pages/Team.tsx` — add Pending Invites card, Invite dialog, Edit Access dialog, capability chips per member.
- `src/b2b/components/team/InviteTeacherDialog.tsx`, `EditMemberAccessDialog.tsx`, `CapabilityCheckboxGrid.tsx` — new presentational components.
- `src/b2b/pages/JoinOrg.tsx` + route `/b2b/join/:token` — accept flow; if not signed in, redirect to login with `redirect=` back to itself; on success, navigate to `/b2b` workspace and toast.
- Edge function (existing `send-transactional-email` or a small new `send-org-invite-email`) — sends the join link to `invite.email`. Reuses Lovable email infrastructure already configured for the project.

**Layout / look**
- Matches existing `b2b-card` styling and the gradient page title pattern already used in `Team.tsx`. Capability chips reuse `Badge variant="outline"`. Dialog uses the same shadcn primitives already imported elsewhere in `/b2b`.

---

## Out of scope (call out, don't build)

- Scoping to specific assessments/classes (you chose pure capability checkboxes — no per-resource ACL this round).
- Bulk teacher CSV import (can be added later mirroring `assessment_invites` bulk flow).
- Audit log surfacing (rows are written but no UI tab yet).
