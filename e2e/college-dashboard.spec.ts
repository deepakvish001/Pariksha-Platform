import { test, expect } from "@playwright/test";

/**
 * Smoke E2E for the B2B college dashboard.
 *
 * The dashboard is auth-gated: an unauthenticated visit redirects to the
 * onboarding/auth flow. These tests verify the route is reachable and either
 * renders the dashboard (when a session exists) or a sensible redirect — they
 * never silently pass on a blank page.
 */

const DASHBOARD_PATH = "/b2b/dashboard";

test.describe("College dashboard", () => {
  test("dashboard route is reachable and never blank", async ({ page }) => {
    const response = await page.goto(DASHBOARD_PATH);
    expect(response?.status() ?? 200).toBeLessThan(500);

    // The app should resolve to either the dashboard, onboarding, or auth.
    await page.waitForURL(/\/(b2b|colleges|companies|auth|login)/, {
      timeout: 15_000,
    });

    // The page body must render something — not a blank white screen.
    const bodyText = (await page.locator("body").innerText()).trim();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("dashboard surface renders KPI/sections when a session is present", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_PATH);

    // If we landed on auth/onboarding (no test session), skip the deep checks.
    await page.waitForLoadState("networkidle").catch(() => {});
    const url = page.url();
    if (!/\/(b2b|colleges|companies)\//.test(url) || /onboarding/.test(url)) {
      test.skip(true, "No authenticated B2B session available in this env");
    }

    // KPI labels are stable across orgs.
    await expect(
      page.getByText(/assessments/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/candidates invited/i).first()).toBeVisible();
    await expect(page.getByText(/submissions/i).first()).toBeVisible();
    await expect(page.getByText(/avg integrity/i).first()).toBeVisible();

    // Chart + recent assessments sections.
    await expect(
      page.getByRole("heading", { name: /submission activity/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /recent assessments/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /top invite channels/i }),
    ).toBeVisible();
  });

  test("header action buttons are present and clickable", async ({ page }) => {
    await page.goto(DASHBOARD_PATH);
    await page.waitForLoadState("networkidle").catch(() => {});
    const url = page.url();
    if (!/\/(b2b|colleges|companies)\//.test(url) || /onboarding/.test(url)) {
      test.skip(true, "No authenticated B2B session available in this env");
    }

    const newBtn = page.getByRole("button", { name: /new assessment/i });
    await expect(newBtn).toBeVisible();
    await newBtn.click();
    await expect(page).toHaveURL(/\/assessments\/new$/);
  });
});
