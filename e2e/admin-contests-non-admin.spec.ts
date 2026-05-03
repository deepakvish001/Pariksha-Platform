import { test, expect } from "@playwright/test";

/**
 * Non-admin access to /admin/contests must be blocked with a redirect or a
 * user-friendly access-denied message — never the admin UI itself.
 *
 * This spec runs unauthenticated (the closest non-admin state we can produce
 * from a browser without service-role credentials) and asserts:
 *  - The user is bounced off /admin/* OR sees a friendly denial message.
 *  - The admin Contests management heading and editor form never render.
 */
test.describe("/admin/contests is gated for non-admins", () => {
  const friendly = /sign in|log in|access denied|unauthorized|admin only|forbidden|not allowed|permission/i;

  test("guest is redirected or shown a friendly denial", async ({ page }) => {
    await page.goto("/admin/contests", { waitUntil: "networkidle" });

    const path = new URL(page.url()).pathname;
    const stillOnAdmin = /^\/admin(\/|$)/.test(path);

    if (stillOnAdmin) {
      await expect(page.getByText(friendly).first()).toBeVisible({ timeout: 5_000 });
    } else {
      expect(path).toMatch(/^\/(login|auth|$)/);
    }

    // The admin contests management surface must NOT be rendered.
    await expect(page.getByRole("button", { name: /new contest|create contest/i })).toHaveCount(0);
    await expect(page.locator("input[name='title']")).toHaveCount(0);
  });

  test("guest cannot reach contest editor or registrations management", async ({ page }) => {
    const ids = ["new", "00000000-0000-0000-0000-000000000000/registrations"];
    for (const segment of ids) {
      await page.goto(`/admin/contests/${segment}`, { waitUntil: "networkidle" });
      const onAdmin = /^\/admin\//.test(new URL(page.url()).pathname);
      if (onAdmin) {
        await expect(page.getByText(friendly).first()).toBeVisible({ timeout: 5_000 });
      }
      await expect(page.locator("input[name='title']")).toHaveCount(0);
    }
  });
});
