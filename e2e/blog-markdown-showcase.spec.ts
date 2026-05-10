import { test, expect } from "@playwright/test";

const POST = "/blog/markdown-showcase";

test.describe("blog markdown showcase", () => {
  test("renders callouts, code copy button, table and embed", async ({ page }) => {
    await page.goto(POST);

    // Callouts
    for (const label of ["Note", "Tip", "Warning", "Danger"]) {
      await expect(page.getByLabel(`${label} callout`)).toBeVisible();
    }

    // Code copy button (at least one)
    await expect(page.getByRole("button", { name: /copy code/i }).first()).toBeVisible();

    // YouTube embed
    const iframe = page.locator('iframe[src*="youtube.com/embed/"]').first();
    await expect(iframe).toHaveCount(1);

    // Table wrapper
    await expect(page.locator('[data-table-wrapper="true"] table')).toBeVisible();
  });

  test("TOC click sets aria-current and updates URL hash", async ({ page }) => {
    await page.goto(POST);
    const toc = page.getByRole("navigation", { name: /table of contents/i });
    const link = toc.getByRole("link", { name: "Code" });
    await link.click();
    await expect(link).toHaveAttribute("aria-current", "location");
    await expect(page).toHaveURL(/#code$/);
    await expect(page.locator("h2#code")).toBeInViewport();
  });

  test("heading anchor becomes visible on hover and copies link on click", async ({ page }) => {
    await page.goto(POST);
    const heading = page.locator("h2#tables");
    await heading.hover();
    const anchor = heading.locator("a.heading-anchor");
    await expect(anchor).toHaveCSS("opacity", "1");
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await anchor.click();
    await expect(page).toHaveURL(/#tables$/);
  });

  test("reading progress bar reaches 100% near the bottom", async ({ page }) => {
    await page.goto(POST);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Wait a frame for the scroll handler to update.
    await page.waitForTimeout(200);
    const bar = page.locator("div.fixed.top-0 > div").first();
    const width = await bar.evaluate((el) => (el as HTMLElement).style.width);
    const pct = parseFloat(width.replace("%", ""));
    expect(pct).toBeGreaterThanOrEqual(95);
  });
});
