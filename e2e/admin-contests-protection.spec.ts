import { test, expect } from "@playwright/test";

/**
 * Verifies that /admin/contests is gated by AdminRoute. Unauthenticated
 * visitors must NOT see the admin UI — they should be redirected to /login
 * (or another non-admin landing page).
 */
test.describe("Admin contests route protection", () => {
  test("unauthenticated visitor cannot reach /admin/contests", async ({ page }) => {
    await page.goto("/admin/contests", { waitUntil: "networkidle" });

    // Either we are bounced away from /admin/* entirely, or the page
    // explicitly tells us we don't have access.
    const url = page.url();
    const stillOnAdmin = /\/admin(\/|$)/.test(new URL(url).pathname);
    if (stillOnAdmin) {
      // If still on /admin/*, we must see an access-denied / unauthorized message.
      await expect(
        page.getByText(/sign in|log in|access denied|unauthorized|admin only|forbidden/i).first(),
      ).toBeVisible({ timeout: 5_000 });
    } else {
      // Otherwise we should have been redirected to login or home.
      expect(url).toMatch(/\/(login|auth|$)/);
    }

    // Critical: the admin "Contests" management heading must NOT be visible.
    await expect(
      page.getByRole("heading", { name: /^contests$/i, level: 1 }),
    ).toHaveCount(0);
  });

  test("nested admin contest routes are also protected", async ({ page }) => {
    for (const path of [
      "/admin/contests/new",
      "/admin/contests/00000000-0000-0000-0000-000000000000/registrations",
      "/admin/contests/00000000-0000-0000-0000-000000000000/leaderboard",
    ]) {
      await page.goto(path, { waitUntil: "networkidle" });
      const onAdmin = /\/admin\//.test(new URL(page.url()).pathname);
      if (onAdmin) {
        await expect(
          page.getByText(/sign in|log in|access denied|unauthorized|admin only/i).first(),
        ).toBeVisible({ timeout: 5_000 });
      }
      // The contest editor form should never be reachable to a guest.
      await expect(page.locator("input[name='title'], input[placeholder*='title' i]")).toHaveCount(0);
    }
  });
});
