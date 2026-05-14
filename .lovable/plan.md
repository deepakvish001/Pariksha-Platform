# Google Analytics + Search Console Admin Dashboard

## Feasibility verdict

**Feasible — but with one important asymmetry between the two:**

- **Google Search Console** → easy. Lovable already has a first-class **`google_search_console`** connector that proxies the Search Console API through the gateway. One OAuth click from you, no service account, no key files.
- **Google Analytics 4** → no native Lovable connector exists. We use the standard, supported path: a **Google Cloud service account** with the **GA4 Data API** enabled, key stored as a Lovable Cloud secret, called from an edge function.

Both APIs are read-only reporting APIs. Data has 24–48h latency for GA4 and 2–3 day lag for Search Console — this is a *reporting* dashboard, not a real-time monitor. Embedding Google's own UI in an iframe is **not possible** (`X-Frame-Options: DENY`), so we rebuild the views with their data APIs.

## What gets built

A new admin section at **`/admin/analytics`** with three tabs:

1. **Traffic (GA4)** — Active users, sessions, pageviews, avg engagement time, top pages, traffic sources, country breakdown, device split, 30-day trend chart.
2. **Search (GSC)** — Total clicks, impressions, CTR, avg position, top queries, top landing pages, country/device filters, 28-day trend chart.
3. **Tracking status** — Shows whether `gtag.js` is firing, last-seen events, current Measurement ID, and verification state for `parikshaa.org` in Search Console.

Plus: install the **`gtag.js`** snippet on the public site so GA4 actually receives data going forward.

## What you (the user) must do manually

These are one-time setup steps the agent cannot perform:

1. **Create a GA4 property** for `parikshaa.org` in [analytics.google.com](https://analytics.google.com) and copy the **Measurement ID** (looks like `G-XXXXXXXXXX`).
2. **Create a Google Cloud project** (or reuse one), enable the **Google Analytics Data API**, create a **service account**, download its **JSON key**.
3. In GA4 → Admin → Property Access Management, add the service account email as a **Viewer**.
4. In Search Console for `parikshaa.org`, add the same service account email as a **user** (Restricted is fine).
5. Click the **Connect Google Search Console** button I add to the dashboard onboarding screen (uses the Lovable connector, not the service account).
6. Paste the Measurement ID and the service-account JSON when the secret prompts appear.

I'll write a clear, copy-pasteable setup checklist component inside the dashboard's empty state so you don't lose track.

## Implementation plan

### Step 1 — Frontend tracking
- Add `gtag.js` to `index.html` reading `VITE_GA_MEASUREMENT_ID`.
- Create `src/lib/analytics/gtag.ts` with `pageview()` and `event()` helpers.
- Hook a route listener in `App.tsx` (or alongside `RouteSeo`) to fire `pageview` on every route change.
- Respect a simple consent flag; do not fire on `/admin/*` routes.

### Step 2 — Secrets & connectors
- `add_secret` for `GA4_MEASUREMENT_ID`, `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL` (defaults to `https://www.parikshaa.org/`).
- `standard_connectors--connect` with `connector_id: google_search_console` to provision `GOOGLE_SEARCH_CONSOLE_API_KEY`.

### Step 3 — Edge functions
Two new functions, both admin-gated (verify caller has `admin` role via `has_role` before any work):

- **`ga4-report`** — accepts `{ metric, dateRange, dimensions? }`, builds a JWT from the service-account JSON, exchanges it for a Google access token, calls `analyticsdata.googleapis.com/v1beta/properties/{id}:runReport`, returns the typed rows. Caches result for 1 hour in a new `analytics_cache` table.
- **`gsc-report`** — accepts `{ type: 'queries' | 'pages' | 'trend', dateRange }`, calls the connector gateway: `POST /webmasters/v3/sites/{siteUrl}/searchAnalytics/query`. Same 1-hour cache.

### Step 4 — Database
One small migration:
```text
analytics_cache
  cache_key text primary key
  payload   jsonb
  expires_at timestamptz
```
RLS: only `service_role` can read/write. Used by the edge functions only.

### Step 5 — Dashboard UI
- Route: `/admin/analytics` mounted inside the existing admin shell.
- Components: `TrafficOverviewCards`, `TopPagesTable`, `TrafficSourcesPie`, `TrendLineChart`, `SearchPerformanceCards`, `TopQueriesTable`, `TrackingStatusPanel`.
- Charts: **Recharts** (already in the project for other dashboards).
- Date-range picker (Last 7d / 28d / 90d / custom).
- Loading skeletons + empty state + clear setup wizard when secrets are missing.
- Admin-only guard via the existing `has_role('admin')` pattern; non-admins get a 403-style message.

### Step 6 — Sidebar entry
Add **Analytics** under the Admin Control Center sidebar group with a `BarChart3` icon, between **Reports** and **Settings & Flags**.

## Technical details

- **GA4 auth**: build a JWT (`alg: RS256`, `aud: https://oauth2.googleapis.com/token`, `scope: https://www.googleapis.com/auth/analytics.readonly`), POST to Google's token endpoint, cache the access token until expiry. Use `npm:jose` in Deno.
- **GSC auth**: handled by the Lovable gateway — just send `Authorization: Bearer ${LOVABLE_API_KEY}` and `X-Connection-Api-Key: ${GOOGLE_SEARCH_CONSOLE_API_KEY}`.
- **Caching**: write-through cache keyed by `${endpoint}:${JSON.stringify(params)}`, 1h TTL, served stale-while-revalidate on errors so a Google outage doesn't blank the dashboard.
- **Rate limiting**: enforced naturally by the cache; raw API quotas (25k/day GA4, 1.2k/min GSC) are far beyond what one admin dashboard will hit.
- **Privacy**: gtag.js sends pageviews only. No PII, no user IDs. We disable tracking entirely on `/admin/*` and on logged-in `/library/*` paths if you prefer (configurable).
- **Files touched/added (high level)**:
  - `index.html` (gtag snippet)
  - `src/lib/analytics/gtag.ts` (new)
  - `src/App.tsx` (route + pageview listener)
  - `src/pages/admin/Analytics.tsx` (new)
  - `src/components/admin/analytics/*` (new chart/table components)
  - `supabase/functions/ga4-report/index.ts` (new)
  - `supabase/functions/gsc-report/index.ts` (new)
  - One migration for `analytics_cache`
  - Admin sidebar config

## Out of scope (call out before building)

- Real-time visitor counts (requires a different API + websockets)
- Per-org / per-tenant analytics splits for B2B customers (you chose admin-only)
- Conversion funnels with custom event definitions (can be added later once `gtag.event()` calls are sprinkled through the app)
- Replacing your existing internal `lead_events` analytics — this dashboard sits alongside it
