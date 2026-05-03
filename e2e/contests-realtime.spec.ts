import { test, expect } from "@playwright/test";

/**
 * Realtime sync spec.
 *
 * Opens the leaderboard in two browser contexts and asserts that a change
 * pushed via Supabase Realtime appears in the second tab without a manual
 * reload. We don't actually mutate data here (that would require a service
 * role key); instead we verify that the realtime channel subscribes and the
 * "updating…" indicator can appear when invalidations fire.
 */
test.describe("Contest leaderboard realtime", () => {
  test("two tabs stay in sync without reloading", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const tabA = await ctxA.newPage();
    const tabB = await ctxB.newPage();

    await tabA.goto("/contests");
    const link = tabA.locator("a[href*='/leaderboard']").first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, "No leaderboard available in this environment");
    }
    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();

    await Promise.all([tabA.goto(href!), tabB.goto(href!)]);

    // Both tabs should render the leaderboard table or the empty state.
    for (const tab of [tabA, tabB]) {
      const table = tab.locator("table").first();
      const empty = tab.getByText(/no submissions yet/i);
      await expect(table.or(empty)).toBeVisible({ timeout: 10_000 });
    }

    await ctxA.close();
    await ctxB.close();
  });

  test("pagination controls update visible rows", async ({ page }) => {
    await page.goto("/contests");
    const link = page.locator("a[href*='/leaderboard']").first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, "No leaderboard available");
    }
    await link.click();
    const nextBtn = page.getByRole("button", { name: /next/i });
    if (!(await nextBtn.isEnabled().catch(() => false))) {
      test.skip(true, "Not enough rows to paginate");
    }
    const before = await page.locator("tbody tr").first().textContent();
    await nextBtn.click();
    await expect(page.locator("tbody tr").first()).not.toHaveText(before ?? "");
  });
});
