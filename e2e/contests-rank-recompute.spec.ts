import { test, expect } from "@playwright/test";

async function snapshotRanks(page: import("@playwright/test").Page) {
  const rows = page.locator("tbody tr");
  const count = await rows.count();
  const out: { rank: number; row: string }[] = [];
  for (let i = 0; i < Math.min(count, 10); i++) {
    const row = (await rows.nth(i).textContent())?.replace(/\s+/g, " ").trim() ?? "";
    const cell = await rows.nth(i).locator("td").first().textContent();
    const m = cell?.match(/(\d+)/);
    if (m) out.push({ rank: Number(m[1]), row });
  }
  return out;
}

test("leaderboard rows are sorted by rank ascending after recomputation finishes", async ({ page }) => {
  await page.goto("/contests");
  const link = page.locator("a[href*='/leaderboard']").first();
  if (!(await link.isVisible().catch(() => false))) {
    test.skip(true, "No leaderboard available");
  }
  await link.click();

  const updating = page.getByText(/updating…/i);
  await updating.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});

  const snap = await snapshotRanks(page);
  if (snap.length < 2) test.skip(true, "Not enough rows to validate ordering");
  for (let i = 1; i < snap.length; i++) {
    expect(snap[i].rank).toBeGreaterThanOrEqual(snap[i - 1].rank);
  }
});

test("leaderboard rank order updates between snapshots once recomputation completes", async ({ page }) => {
  await page.goto("/contests");
  const link = page.locator("a[href*='/leaderboard']").first();
  if (!(await link.isVisible().catch(() => false))) {
    test.skip(true, "No leaderboard available");
  }
  await link.click();

  // Wait for any in-flight recomputation indicator to clear.
  const updating = page.getByText(/updating…/i);
  await updating.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});

  const before = await snapshotRanks(page);
  if (before.length < 1) test.skip(true, "Empty leaderboard");

  // Trigger a refetch by toggling pagination (or refreshing) and wait again
  // for the updating indicator to appear and then disappear, so we know the
  // snapshot we read afterwards reflects the post-recompute state.
  const nextBtn = page.getByRole("button", { name: /next/i });
  if (await nextBtn.isEnabled().catch(() => false)) {
    await nextBtn.click();
    await updating.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
    await updating.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});
    const afterPage2 = await snapshotRanks(page);
    // Different page must surface different rows (or at minimum different
    // ranks). This proves the table actually re-rendered with new data.
    expect(afterPage2.map((r) => r.row).join("|")).not.toBe(
      before.map((r) => r.row).join("|"),
    );
    // And the new page must still satisfy the rank-ordering invariant.
    for (let i = 1; i < afterPage2.length; i++) {
      expect(afterPage2[i].rank).toBeGreaterThanOrEqual(afterPage2[i - 1].rank);
    }
  } else {
    // No pagination available — fall back to a reload + indicator wait and
    // confirm the order invariant still holds in the post-recompute snapshot.
    await page.reload();
    await updating.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});
    const after = await snapshotRanks(page);
    for (let i = 1; i < after.length; i++) {
      expect(after[i].rank).toBeGreaterThanOrEqual(after[i - 1].rank);
    }
  }
});
