import { test, expect } from "@playwright/test";

/**
 * Submitting to a CLOSED contest must surface the exact server message from
 * `validate_contest_submission` ("Contest has ended") and block the submit.
 *
 * We look for a contest section labeled "Past" / "Ended" / "Closed" on the
 * /contests list. If none exists in the current environment we skip — the
 * assertion logic still runs as soon as a closed contest is seeded.
 */
test("submitting to a closed contest is blocked with the server message", async ({ page }) => {
  await page.goto("/contests");

  // Find a closed/past contest card. The list groups contests by lifecycle.
  const pastSection = page.getByRole("heading", { name: /past|ended|closed/i }).first();
  if (!(await pastSection.isVisible().catch(() => false))) {
    test.skip(true, "No closed contests in this environment");
  }
  const closedCard = pastSection.locator("xpath=following::a[contains(@href, '/contests/')]").first();
  if (!(await closedCard.isVisible().catch(() => false))) {
    test.skip(true, "Closed section has no contest links");
  }
  await closedCard.click();

  const problemLink = page.locator("a[href*='/library/problems/']").first();
  if (!(await problemLink.isVisible().catch(() => false))) {
    test.skip(true, "Closed contest has no problems linked");
  }
  await problemLink.click();

  const submit = page.getByRole("button", { name: /^submit/i }).first();
  if (!(await submit.isVisible().catch(() => false))) {
    test.skip(true, "Submit button not visible (likely auth-gated)");
  }

  await submit.click().catch(() => {});

  // Exact message from validate_contest_submission for the `closed` code.
  const banner = page.locator("[role='alert']").filter({ hasText: /Contest has ended/i });
  const toast = page.getByText(/Contest has ended/i);
  await expect(banner.or(toast).first()).toBeVisible({ timeout: 10_000 });

  // Submit must not have triggered a navigation to a "submission accepted" UI.
  await expect(page.getByText(/accepted|submission successful/i)).toHaveCount(0);
});
