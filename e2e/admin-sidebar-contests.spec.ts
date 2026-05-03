import { test, expect } from "@playwright/test";

/**
 * Verifies the Admin sidebar's active-link behavior for the Contests section
 * and its dynamic sub-nav. Runs unauthenticated — the AdminRoute guard
 * normally redirects guests, so this spec skips when the admin shell does
 * not render. When seeded with an admin session it asserts:
 *  - /admin/contests highlights "Contests" + "All contests" sub-item.
 *  - /admin/contests/new highlights the "New contest" sub-item only (not "All").
 *  - /admin/contests/:id/edit|/registrations|/leaderboard highlight their
 *    respective sub-items, plus the parent Contests entry.
 */

const PARENT = "[data-testid='admin-nav-contests']";
const SUBNAV = "[data-testid='admin-subnav-contests']";
const SUB_ALL = "[data-testid='admin-nav-contests-all']";
const SUB_NEW = "[data-testid='admin-nav-contests-new']";
const SUB_EDIT = "[data-testid='admin-nav-contests-edit']";
const SUB_REG = "[data-testid='admin-nav-contests-registrations']";
const SUB_LB = "[data-testid='admin-nav-contests-leaderboard']";

const ACTIVE_CLASS = /text-primary/;

async function expectAdminShellOrSkip(page: import("@playwright/test").Page) {
  const parent = page.locator(PARENT);
  if (!(await parent.isVisible({ timeout: 4_000 }).catch(() => false))) {
    test.skip(true, "Admin sidebar not rendered (likely unauthenticated)");
  }
}

test("Contests parent + 'All contests' sub-item are active on /admin/contests", async ({ page }) => {
  await page.goto("/admin/contests");
  await expectAdminShellOrSkip(page);

  await expect(page.locator(PARENT)).toHaveClass(ACTIVE_CLASS);
  await expect(page.locator(SUBNAV)).toBeVisible();
  await expect(page.locator(SUB_ALL)).toHaveClass(ACTIVE_CLASS);
  await expect(page.locator(SUB_NEW)).not.toHaveClass(ACTIVE_CLASS);
});

test("'New contest' sub-item is the only sub-item active on /admin/contests/new", async ({ page }) => {
  await page.goto("/admin/contests/new");
  await expectAdminShellOrSkip(page);

  await expect(page.locator(PARENT)).toHaveClass(ACTIVE_CLASS);
  await expect(page.locator(SUB_NEW)).toHaveClass(ACTIVE_CLASS);
  await expect(page.locator(SUB_ALL)).not.toHaveClass(ACTIVE_CLASS);
});

test("Edit/Registrations/Leaderboard sub-items highlight on their dynamic routes", async ({ page }) => {
  const id = "00000000-0000-0000-0000-000000000000";
  const cases: Array<{ path: string; activeSelector: string; otherSubs: string[] }> = [
    { path: `/admin/contests/${id}/edit`, activeSelector: SUB_EDIT, otherSubs: [SUB_REG, SUB_LB, SUB_ALL, SUB_NEW] },
    { path: `/admin/contests/${id}/registrations`, activeSelector: SUB_REG, otherSubs: [SUB_EDIT, SUB_LB, SUB_ALL, SUB_NEW] },
    { path: `/admin/contests/${id}/leaderboard`, activeSelector: SUB_LB, otherSubs: [SUB_EDIT, SUB_REG, SUB_ALL, SUB_NEW] },
  ];

  for (const c of cases) {
    await page.goto(c.path);
    await expectAdminShellOrSkip(page);
    await expect(page.locator(PARENT)).toHaveClass(ACTIVE_CLASS);
    await expect(page.locator(c.activeSelector)).toHaveClass(ACTIVE_CLASS);
    for (const other of c.otherSubs) {
      await expect(page.locator(other)).not.toHaveClass(ACTIVE_CLASS);
    }
  }
});
