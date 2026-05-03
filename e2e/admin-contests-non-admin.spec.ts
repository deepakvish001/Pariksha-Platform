import { test, expect } from "@playwright/test";

/**
 * Non-admin access to /admin/contests must be blocked. Because /admin/* is a
 * client-side gated SPA route (the static HTML is always served 200 OK), we
 * assert the *effective* denial:
 *  - The user is redirected away from /admin/* (or the network returned a
 *    non-2xx for the navigation), AND
 *  - The rendered page either lands on /login (preferred) or shows the exact
 *    user-friendly denial copy.
 */
const FRIENDLY_DENIAL = /^(Sign in to continue|Access denied|Admin access required|You don't have permission)/i;

test("non-admin navigating to /admin/contests is redirected or shown denial copy", async ({ page }) => {
  const response = await page.goto("/admin/contests", { waitUntil: "networkidle" });

  // The HTTP layer for SPA routes typically returns 200 (index.html). A
  // 403/redirect at the network layer is also acceptable — assert one of
  // the three valid outcomes.
  if (response) {
    const status = response.status();
    const ok2xx = status >= 200 && status < 300;
    const redirected = status >= 300 && status < 400;
    const forbidden = status === 401 || status === 403;
    expect(ok2xx || redirected || forbidden).toBeTruthy();
  }

  const path = new URL(page.url()).pathname;
  const stillOnAdmin = /^\/admin(\/|$)/.test(path);

  if (stillOnAdmin) {
    // Must show the friendly denial copy with the expected wording.
    await expect(
      page.getByText(FRIENDLY_DENIAL).first(),
    ).toBeVisible({ timeout: 5_000 });
  } else {
    // Redirected — must land on /login, /auth, or the marketing root.
    expect(path).toMatch(/^\/(login|auth|)$/);
  }

  // The admin Contests management surface must NEVER render for a non-admin.
  await expect(page.getByRole("button", { name: /new contest|create contest/i })).toHaveCount(0);
  await expect(page.locator("input[name='title']")).toHaveCount(0);
});

test("nested /admin/contests/* routes also deny non-admins", async ({ page }) => {
  const segments = [
    "new",
    "00000000-0000-0000-0000-000000000000/registrations",
    "00000000-0000-0000-0000-000000000000/leaderboard",
  ];
  for (const seg of segments) {
    const response = await page.goto(`/admin/contests/${seg}`, { waitUntil: "networkidle" });
    if (response) {
      const s = response.status();
      expect(s < 500).toBeTruthy();
    }
    const onAdmin = /^\/admin\//.test(new URL(page.url()).pathname);
    if (onAdmin) {
      await expect(page.getByText(FRIENDLY_DENIAL).first()).toBeVisible({ timeout: 5_000 });
    }
    await expect(page.locator("input[name='title']")).toHaveCount(0);
  }
});
