# End-to-end tests (Playwright)

These specs validate the contest system across realtime sync, optimistic
mutation feedback, and rank recomputation. They are written to be **safe to
run against any environment**: every spec self-skips when the data it needs
isn't available, so you can run them before or after the contests have any
real activity.

## First-time setup

```bash
bunx playwright install --with-deps chromium
```

## Running

```bash
# Against your local Vite dev server (auto-spawned)
bun run e2e

# Against a deployed preview
E2E_BASE_URL=https://your-preview.lovable.app bun run e2e
```

## Authenticated specs

Specs that require a logged-in user read credentials from env vars and skip
when they aren't set:

```bash
E2E_USER_EMAIL=you@example.com \
E2E_USER_PASSWORD=••• \
bun run e2e
```

## What each spec covers

| File | Focus |
|---|---|
| `contests-list.spec.ts` | Public list renders, status badges, navigation |
| `contests-realtime.spec.ts` | Multi-tab realtime sync (leaderboard updates without reload) |
| `contests-optimistic.spec.ts` | Register → instant UI update, no flicker on rollback |
| `contests-rank-recompute.spec.ts` | After a submission verdict changes, rank re-orders |
