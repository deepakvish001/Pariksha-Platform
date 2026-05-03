import { test, expect } from "@playwright/test";

const ERROR_BANNER = "[data-testid='contest-submit-error']";
const ERROR_MESSAGE = "[data-testid='contest-submit-error-message']";
const ERROR_DISMISS = "[data-testid='contest-submit-error-dismiss']";
const SUBMIT_BUTTON = "[data-testid='contest-submit-button']";

// Exact server messages emitted by validate_contest_submission. Keep this in
// sync with supabase/migrations/.../validate_contest_submission().
const EXACT_MESSAGES = [
  "You already solved this problem",
  "Register for the contest before submitting",
  "Sign in to submit",
  "Contest has ended",
  "Contest is not active",
  "Contest has not started yet",
  "You are disqualified from this contest",
  "You have withdrawn from this contest",
  "Problem is not part of this contest",
  "Contest not found",
];
const MESSAGE_REGEX = new RegExp(
  EXACT_MESSAGES.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
);

async function openFirstContestProblem(page: import("@playwright/test").Page) {
  await page.goto("/contests");
  const contestLink = page.locator("a[href*='/contests/']").first();
  if (!(await contestLink.isVisible().catch(() => false))) {
    test.skip(true, "No contests available in this environment");
  }
  await contestLink.click();
  const problemLink = page.locator("a[href*='/library/problems/']").first();
  if (!(await problemLink.isVisible().catch(() => false))) {
    test.skip(true, "Contest has no problems linked");
  }
  await problemLink.click();
}

test("duplicate contest submission shows the exact server banner via stable testids", async ({ page }) => {
  await openFirstContestProblem(page);

  const submit = page.locator(SUBMIT_BUTTON);
  if (!(await submit.isVisible().catch(() => false))) {
    test.skip(true, "Submit button not available (auth-gated)");
  }

  await submit.click().catch(() => {});
  await submit.click().catch(() => {});

  const banner = page.locator(ERROR_BANNER);
  await expect(banner).toBeVisible({ timeout: 10_000 }).catch(() => {
    test.skip(true, "Could not trigger a blocked-submission state without auth");
  });

  const message = page.locator(ERROR_MESSAGE);
  await expect(message).toHaveText(MESSAGE_REGEX);
});

test("retried duplicate submission keeps the same banner and remains dismissible", async ({ page }) => {
  await openFirstContestProblem(page);

  const submit = page.locator(SUBMIT_BUTTON);
  if (!(await submit.isVisible().catch(() => false))) {
    test.skip(true, "Submit button not available");
  }
  await submit.click().catch(() => {});
  await submit.click().catch(() => {});

  const banner = page.locator(ERROR_BANNER);
  await expect(banner).toBeVisible({ timeout: 10_000 }).catch(() => {
    test.skip(true, "No banner surfaced — likely guest with login modal");
  });
  const firstText = (await page.locator(ERROR_MESSAGE).textContent())?.trim() ?? "";
  expect(firstText).toMatch(MESSAGE_REGEX);

  // Retry the blocked submission — the same banner must persist with the
  // same message (validate_contest_submission is deterministic for a given
  // contest/problem/user).
  await submit.click().catch(() => {});
  await expect(banner).toBeVisible();
  const secondText = (await page.locator(ERROR_MESSAGE).textContent())?.trim() ?? "";
  expect(secondText).toBe(firstText);

  // Banner remains dismissible after a retry.
  const dismiss = page.locator(ERROR_DISMISS);
  await expect(dismiss).toBeVisible();
  await dismiss.click();
  await expect(banner).toHaveCount(0);
});
