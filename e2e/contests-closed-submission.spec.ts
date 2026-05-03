import { test, expect } from "@playwright/test";

/**
 * Closed-contest submission must be blocked at the UI level: the Submit
 * button is rendered with `disabled` (not just rejected on click) and the
 * inline error banner shows the exact server message ("Contest has ended").
 *
 * Looks for a contest in the "Past" / "Ended" / "Closed" group on /contests.
 * Skips cleanly when no closed contest is seeded in the environment.
 */
test("closed contest disables Submit and shows the server's 'Contest has ended' message", async ({ page }) => {
  await page.goto("/contests");

  const pastHeading = page.getByRole("heading", { name: /past|ended|closed/i }).first();
  if (!(await pastHeading.isVisible().catch(() => false))) {
    test.skip(true, "No closed contests available in this environment");
  }
  const closedLink = pastHeading
    .locator("xpath=following::a[contains(@href, '/contests/')]")
    .first();
  if (!(await closedLink.isVisible().catch(() => false))) {
    test.skip(true, "Closed section has no contest links");
  }
  await closedLink.click();

  const problemLink = page.locator("a[href*='/library/problems/']").first();
  if (!(await problemLink.isVisible().catch(() => false))) {
    test.skip(true, "Closed contest has no problems linked");
  }
  await problemLink.click();

  const submit = page.locator("[data-testid='contest-submit-button']");
  await expect(submit).toBeVisible({ timeout: 10_000 });

  // Pre-validation runs on mount; wait for the Submit button to enter the
  // disabled state because the contest is closed.
  await expect(submit).toBeDisabled({ timeout: 10_000 });

  // Inline banner must carry the exact server message for the `closed` code.
  const message = page.locator("[data-testid='contest-submit-error-message']");
  await expect(message).toHaveText(/Contest has ended/i, { timeout: 10_000 });

  // Force a click anyway — disabled buttons should not trigger a submission
  // and no "accepted" confirmation should appear.
  await submit.click({ force: true }).catch(() => {});
  await expect(page.getByText(/^accepted$|submission successful/i)).toHaveCount(0);
});
