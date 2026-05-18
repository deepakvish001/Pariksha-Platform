# Role-Based Access Control for the Workspace

## Current state (what already exists)

- **Roles in DB** (`org_member_role` enum + `org_members` table):
  `owner`, `admin`, `proctor`, `recruiter`, `viewer`.
- **RLS already enforces writes**:
  - `organizations`: only owner can delete; owner+admin can update.
  - `org_members`: owner+admin can insert / update / remove members.
  - `assessments`: `can_write_org()` (owner+admin) can insert / update / delete; any member can read.
  - Proctoring evidence already gated via `useCanProctor` (owner+admin+proctor).
- **Gap**: the UI shows every nav item and every action button to every member. A `viewer` or `recruiter` sees "Delete assessment", "Invite member", "Change role" etc. and only gets blocked when the DB rejects the request. Industry standard is to **hide what you can't do** and **guard the route** in addition to the RLS.

## Proposed permission matrix

| Capability | owner | admin | proctor | recruiter | viewer |
|---|---|---|---|---|---|
| View Dashboard / Assessments / Question Bank | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create / edit / delete assessments | ✅ | ✅ | — | — | — |
| Publish / schedule assessment | ✅ | ✅ | — | — | — |
| Edit Question Bank | ✅ | ✅ | — | — | — |
| Invite / remove members | ✅ | ✅ | — | — | — |
| Change member roles | ✅ | ✅¹ | — | — | — |
| View live proctoring wall / evidence / Side-Eye | ✅ | ✅ | ✅ | — | — |
| Run AI proctoring review | ✅ | ✅ | ✅ | — | — |
| View attempt results / scores / reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download CSV / export PII | ✅ | ✅ | — | ✅ | — |
| Edit org settings (name, logo, branding) | ✅ | ✅ | — | — | — |
| Manage billing / plan | ✅ | — | — | — | — |
| Transfer ownership / delete org | ✅ | — | — | — | — |
| View audit log | ✅ | ✅ | — | — | — |

¹ Admin cannot promote anyone to `owner` and cannot demote the owner.

## Implementation plan

### 1. Central permission layer (`src/b2b/hooks/usePermissions.ts`)

Extend the existing hook with one source of truth:

```ts
export type Capability =
  | "assessments.write" | "assessments.publish"
  | "questionBank.write"
  | "members.invite" | "members.removeOrEdit" | "members.promoteToOwner"
  | "proctor.view" | "proctor.runAi"
  | "results.exportPii"
  | "org.editSettings" | "org.manageBilling" | "org.delete"
  | "audit.view";

const MATRIX: Record<Capability, OrgMemberRole[]> = { /* table above */ };

export function useCan(orgId?: string, cap?: Capability): { allowed: boolean; role: OrgMemberRole | null; isLoading: boolean };
```

All UI gating goes through `useCan(...)` — no scattered `role === "owner"` checks.

### 2. Route guards

New `<RequireOrgCapability cap="…">` component (mirrors `AdminRoute`):

- Wrap `/companies/:slug/team`, `/settings`, `/assessments/new`, `/assessments/:id/edit`, `/assessments/:id/manage`, billing, audit log, etc.
- On deny → redirect to the workspace dashboard with a toast "You don't have permission to view this page".

### 3. Role-aware navigation (`OrgShell.tsx`)

Add `requires?: Capability` to each nav item; filter via `useCan`. Items hidden:
- **Team** → `members.invite`
- **Settings** → `org.editSettings`
- **Billing** (when added) → `org.manageBilling`
- **Audit Log** (when added) → `audit.view`

### 4. Action-level gating

Hide / disable the actual buttons (don't only rely on RLS rejection):

- `Team.tsx`: hide "Invite", role dropdown, "Remove" for non-managers; block `owner` row from being edited by an `admin`.
- `assessments/List.tsx` & `Detail.tsx`: hide "New assessment", "Edit", "Delete", "Publish".
- `ProctoringTriagePanel`, `LiveProctorWall`, `SessionTimelinePlayer`: already use `canProctor` — migrate to `useCan(orgId, "proctor.view")`.
- `AttemptDetail`: hide "Export CSV" / PII download for `viewer`.
- `Settings.tsx`: hide "Transfer ownership" + "Delete organization" unless `owner`.

### 5. Server-side hardening (only the gaps)

The RLS we already have covers writes. Three additions:

- `org_members` UPDATE policy: block `admin` from changing a row where `role = 'owner'` and from setting `role = 'owner'`.
- New `audit_logs` table (if not present) gated to `owner` + `admin` reads.
- `is_org_billing_admin(org_id)` SQL helper used by billing endpoints / future Stripe webhooks → only `owner`.

### 6. Tests

- Extend `src/b2b/hooks/__tests__/usePermissions.test.tsx` with one assertion per (role × capability) cell of the matrix.
- Playwright: add `e2e/b2b-rbac.spec.ts` logging in as each role and asserting hidden nav items + 403-style redirect on guarded routes.

## Out of scope

- New roles or per-feature custom permissions (kept to the 5 fixed roles).
- Changing how proctoring evidence works — only renaming the hook call.
- Cross-org admin access (handled separately by the platform-level `app_role = 'admin'`).

## Files touched (preview)

- `src/b2b/hooks/usePermissions.ts` (extend)
- `src/b2b/components/RequireOrgCapability.tsx` (new)
- `src/b2b/layouts/OrgShell.tsx` (filter nav)
- `src/b2b/pages/Team.tsx`, `Settings.tsx`, `assessments/List.tsx`, `Detail.tsx`, `New.tsx`, `Manage.tsx`, `AttemptDetail.tsx`
- `src/b2b/components/ProctoringTriagePanel.tsx`, `LiveProctorWall.tsx`
- `src/App.tsx` (wrap guarded routes)
- One migration: tighten `org_members` UPDATE + add `is_org_billing_admin()`
- Tests: `usePermissions.test.tsx`, `e2e/b2b-rbac.spec.ts`
