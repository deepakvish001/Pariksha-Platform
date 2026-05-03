import { test, expect } from "@playwright/test";

/**
 * Optimistic UI spec for contest registration.
 *
 * Requires E2E_USER_EMAIL / E2E_USER_PASSWORD to be set; otherwise the spec
 * self-skips so that CI runs cleanly even without a test account.
 */
const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

test.describe("Contest registration — optimistic feedback", () => {
  test.skip(!EMAIL || !PASSWORD, "E2E_USER_EMAIL / E2E_USER_PASSWORD not set");

  test("register reflects instantly in the UI", async ({ page }) => {
    // Sign in via the standard /login route.
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel(/password/i).fill(PASSWORD!);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(?!login)/);

    await page.goto("/contests");
    const firstActive = page.locator("a[href^='/contests/']").first();
    if (!(await firstActive.isVisible().catch(() => false))) {
      test.skip(true, "No contests in this environment");
    }
    await firstActive.click();

    const registerBtn = page.getByRole("button", { name: /^register$/i });
    if (!(await registerBtn.isVisible().catch(() => false))) {
      test.skip(true, "Already registered or registration not open");
    }
    await registerBtn.click();
    // The Registered badge should appear within ~2s thanks to optimistic update.
    await expect(page.getByText(/registered/i).first()).toBeVisible({ timeout: 3_000 });
  });
});
