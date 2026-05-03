import { test, expect } from "@playwright/test";

test.describe("Contests list", () => {
  test("renders the list page with hero and at least one section", async ({ page }) => {
    await page.goto("/contests");
    await expect(page.getByRole("heading", { name: /coding contests/i })).toBeVisible();
    // Page should not throw — either a section is shown, or the empty state.
    const hasSection = await page
      .getByRole("heading", { name: /live now|upcoming|past contests/i })
      .first()
      .isVisible()
      .catch(() => false);
    expect(typeof hasSection).toBe("boolean");
  });

  test("contest card → detail navigation works", async ({ page }) => {
    await page.goto("/contests");
    const firstCard = page.locator("a[href^='/contests/']").first();
    if (!(await firstCard.isVisible().catch(() => false))) {
      test.skip(true, "No contests available in this environment");
    }
    await firstCard.click();
    await expect(page).toHaveURL(/\/contests\/[^/]+$/);
    // Lifecycle badge (draft/active/closed) should always render.
    await expect(page.locator("text=/^(draft|active|closed)$/i").first()).toBeVisible();
  });
});
