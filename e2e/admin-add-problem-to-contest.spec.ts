import { test, expect } from "@playwright/test";

/**
 * Verifies the AddProblemToContestDialog flow from /admin/problems:
 * opening the dialog, picking a contest, and confirming the problem then
 * appears in that contest's Problems section in the editor.
 *
 * The admin-only test runs only when ADMIN_STORAGE_STATE points at a logged-in
 * admin storage state file; otherwise it is skipped so the suite stays green
 * in environments without admin credentials.
 */
const ADMIN_STORAGE = process.env.ADMIN_STORAGE_STATE;

test.describe("AddProblemToContestDialog", () => {
  test.skip(!ADMIN_STORAGE, "Requires ADMIN_STORAGE_STATE to authenticate as admin");
  test.use({ storageState: ADMIN_STORAGE });

  test("attaches a problem to a contest and shows it in the editor", async ({ page }) => {
    await page.goto("/admin/problems", { waitUntil: "networkidle" });

    // Find the first row with an "Add to contest" trigger.
    const trigger = page.getByRole("button", { name: /add to contest/i }).first();
    await expect(trigger).toBeVisible();

    // Capture the problem slug from the same row (the slug column is mono-text).
    const row = trigger.locator("xpath=ancestor::tr[1]");
    const slug = (await row.locator("td").nth(1).innerText()).trim();
    expect(slug.length).toBeGreaterThan(0);

    await trigger.click();

    // Dialog opens — pick the first eligible contest.
    const dialog = page.getByRole("dialog", { name: /add to contest/i });
    await expect(dialog).toBeVisible();

    const addBtn = dialog.getByRole("button", { name: /^add$/i }).first();
    await expect(addBtn).toBeEnabled();

    // Capture the contest title from its row to navigate later.
    const contestRow = addBtn.locator("xpath=ancestor::div[contains(@class,'flex')][1]");
    const contestTitle = (await contestRow.locator("div.min-w-0 .truncate").innerText()).trim();

    await addBtn.click();

    // Either dialog closes (new attach) or shows "Already in this contest" toast — both acceptable.
    await expect(page.getByText(/(added to contest|already in this contest)/i)).toBeVisible({ timeout: 8000 });

    // Navigate to the contest list and open the matching contest's editor.
    await page.goto("/admin/contests", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: new RegExp(contestTitle, "i") }).first().click();

    await expect(page.getByRole("heading", { name: /problems/i })).toBeVisible();
    await expect(page.getByTestId(`contest-problem-row-${slug}`)).toBeVisible({ timeout: 10000 });
  });
});
