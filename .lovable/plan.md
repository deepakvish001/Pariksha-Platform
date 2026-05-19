# Share Views — Capture & Display

## Already in place

The resolver (`placement-public-profile`) already records every open into `student_share_views` with `viewed_at`, sha256 `ip_hash`, `user_agent`, and `referrer`, and bumps `view_count` + `last_viewed_at` on `student_share_links`. The ShareDialog's "Recent shares" panel already shows `view_count`. So **capture is done** — this task is about making views visible to placement coordinators.

The existing resolver has one fixable issue: the view-log insert and the counter update use unawaited `.then(() => {})` chains. On Deno edge runtime, the request can return before the writes flush. Switch to `EdgeRuntime.waitUntil(...)` so the writes are guaranteed to complete.

## Changes

### 1. Edge function fix — `placement-public-profile`
- Wrap both background writes (`student_share_views` insert and `student_share_links` update) with `EdgeRuntime.waitUntil(...)` so views are reliably persisted.
- Also bump `view_count` atomically via an `increment_share_view_count(share_id uuid)` SQL function (new migration). Right now only `last_viewed_at` is touched; `view_count` is never incremented, which is why counts stay at 0 in the dialog.

### 2. Migration
- Create `public.increment_share_view_count(p_share_id uuid)` SECURITY DEFINER, search_path = public — runs `UPDATE student_share_links SET view_count = view_count + 1, last_viewed_at = now() WHERE id = p_share_id`.
- Grant EXECUTE to `service_role` (used by the edge function). No client exposure.

### 3. New page — Share Analytics
A new third tab **"Shares"** on `PlacementsDashboard` (`src/b2b/pages/placements/PlacementsDashboard.tsx`) with a self-contained component `SharesTab.tsx` at `src/b2b/pages/placements/SharesTab.tsx`.

**Table columns** (one row per `student_share_links`):
- Recipient — recruiter name / email (or "Unnamed")
- Type — Profile / Shortlist badge
- Student(s) — student name(s) joined from `org_students` (truncated, hover tooltip for shortlists)
- Created — relative time
- Expires — date + Active / Expired / Revoked badge
- Views — `view_count` with a small bar visualization
- Last viewed — relative time
- Actions — Copy link · View details · Revoke

**Filters**: search (recipient/student), type, status (Active/Expired/Revoked), date range (last 7/30/90 days).

**Details drawer** (Sheet from right): opens on "View details" and shows:
- Link metadata (token, recruiter, message, permission toggles)
- A timeline of individual view events from `student_share_views` (timestamp formatted as `MMM d, HH:mm`, masked IP hash like `a1b2c3…`, user agent short label parsed via a tiny `parseUA` helper into "Chrome on macOS", "Safari on iPhone" etc., and referrer hostname).
- Top metrics: total views, unique IP hashes, first viewed, last viewed.

### 4. Per-student rollup on `StudentPlacementProfile.tsx`
Add a small **"Share activity"** card under HR-ready highlights:
- Total shares created · total link opens · last opened (relative).
- "View all shares" button that links to the Shares tab with that student pre-filtered (URL search param `?student=<id>`).

### 5. RLS
`student_share_views` already has org-admin SELECT; verify the same `org_id` join through `student_share_links` works for both the table list (using nested select `student_share_views(count)` and an aggregated query) and the details drawer (filter by `share_id`).

## Out of scope
- Geolocation from IP (we only have hashes, by design).
- CSV export of view events (can add later if requested).
- Realtime push for new opens (poll on `useQuery` with `refetchInterval: 30s` is enough).

## Files

- `supabase/functions/placement-public-profile/index.ts` — switch to `waitUntil` + call new RPC.
- `supabase/migrations/<ts>_share_view_increment.sql` — new RPC.
- `src/b2b/pages/placements/PlacementsDashboard.tsx` — add "Shares" tab trigger + content.
- `src/b2b/pages/placements/SharesTab.tsx` — new, full list + details drawer.
- `src/b2b/pages/placements/StudentPlacementProfile.tsx` — add "Share activity" card.