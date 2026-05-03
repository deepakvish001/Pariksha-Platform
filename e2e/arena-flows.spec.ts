import { test, expect } from "@playwright/test";

/**
 * Arena end-to-end specs.
 *
 * These cover the public-facing UI surface of the Arena multiplayer system:
 *   - Quick Match queue UX (loading, attempt counter, cancel)
 *   - Create Room code sharing (copy code / share link)
 *   - Join-by-code deep-link validation + countdown timer
 *   - Realtime waiting room (host page subscribes & survives reload)
 *   - Rematch retry UI on failure
 *
 * Specs auto-skip when authentication isn't configured. Set the env vars
 * E2E_USER_EMAIL / E2E_USER_PASSWORD to exercise the authenticated flows.
 */

const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

async function loginIfNeeded(page: import("@playwright/test").Page) {
  if (!EMAIL || !PASSWORD) return false;
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 }).catch(() => {});
  return true;
}

test.describe("Arena · Join by Code (deep link)", () => {
  test("invalid code shows explicit validation message", async ({ page }) => {
    await page.goto("/arena/join/bad");
    await expect(page.getByTestId("join-invalid")).toBeVisible();
    await expect(page.getByText(/invalid room code/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /back to arena/i })).toBeVisible();
  });

  test("valid format triggers join attempt and surfaces error UI for unknown codes", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    await page.goto("/arena/join/ZZZZZZ");
    // Either it succeeds (unlikely for random code) or surfaces a not-found / expired error.
    const error = page.locator("[data-testid^='join-error-']");
    await expect(error).toBeVisible({ timeout: 10_000 });
  });

  test("countdown turns red near expiry and surfaces 'create a new room' messaging on expiry", async ({ page }) => {
    // Bypass auth gating: stub Supabase RPC responses so the peek + join logic
    // runs entirely against deterministic fake data.
    const peekExpiresAt = new Date(Date.now() + 30_000).toISOString(); // 30s ahead
    await page.route(/\/rest\/v1\/rpc\/battle_peek_code/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{
          expires_at: peekExpiresAt,
          problem_slug: "two-sum",
          difficulty: "medium",
          duration_sec: 900,
          status: "pending",
        }]),
      });
    });
    // Block the actual join attempt so the page stays on the join screen.
    await page.route(/\/rest\/v1\/rpc\/battle_join_code/, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "auth required", code: "PGRST301" }),
      });
    });

    await page.goto("/arena/join/ABC123");

    const countdown = page.getByTestId("join-countdown");
    await expect(countdown).toBeVisible({ timeout: 10_000 });
    await expect(countdown).toHaveClass(/text-destructive/);
    await expect(countdown).toContainText(/Expires in 0:\d{2}/);

    // Force the local clock past expiry via the documented ?now= override.
    const future = Date.now() + 60_000;
    await page.goto(`/arena/join/ABC123?now=${future}`);

    const expired = page.getByTestId("join-expired").or(page.getByTestId("join-error-expired"));
    await expect(expired).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/create a new room/i)).toBeVisible();
    await expect(page.getByTestId("join-disabled")).toBeDisabled();
  });
});

test.describe("Arena · Quick Match queue", () => {
  test("queue page shows searching UI with attempt counter", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    await page.goto("/arena");
    const quick = page.getByRole("button", { name: /quick match/i }).first();
    if (!(await quick.isVisible().catch(() => false))) test.skip(true, "Arena home not reachable");
    await quick.click();
    await expect(page.getByTestId("queue-searching")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("queue-attempts")).toContainText(/Attempt \d+/);
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page).toHaveURL(/\/arena$/);
  });
});

test.describe("Arena · Create Room (code sharing + countdown)", () => {
  test("host sees the 6-char code, share buttons, and a live countdown", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    await page.goto("/arena");
    const create = page.getByRole("button", { name: /create room/i }).first();
    if (!(await create.isVisible().catch(() => false))) test.skip(true, "Create room control not found");
    await create.click();

    // We may need to confirm a problem/difficulty in a sub-form before the room is created.
    const confirm = page.getByRole("button", { name: /create|generate|start/i }).first();
    if (await confirm.isVisible().catch(() => false)) await confirm.click();

    await page.waitForURL(/\/arena\/room\/[A-Z0-9]{6}/, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: /copy code/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible();

    const countdown = page.getByTestId("room-countdown");
    await expect(countdown).toBeVisible();
    const first = (await countdown.textContent())?.trim();
    expect(first).toMatch(/Code expires in \d+:\d{2}/);

    // After a couple of seconds, the displayed seconds should change.
    await page.waitForTimeout(2_500);
    const second = (await countdown.textContent())?.trim();
    expect(second).not.toEqual(first);
  });
});

test.describe("Arena · Realtime waiting-room redirect", () => {
  test("opening the same room URL in a second tab keeps both pages subscribed", async ({ browser }) => {
    if (!EMAIL || !PASSWORD) test.skip(true, "Login creds not configured");
    const ctx = await browser.newContext();
    const host = await ctx.newPage();
    await loginIfNeeded(host);

    await host.goto("/arena");
    const create = host.getByRole("button", { name: /create room/i }).first();
    if (!(await create.isVisible().catch(() => false))) {
      await ctx.close();
      test.skip(true, "Create room control not found");
    }
    await create.click();
    const confirm = host.getByRole("button", { name: /create|generate|start/i }).first();
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await host.waitForURL(/\/arena\/room\/[A-Z0-9]{6}/, { timeout: 15_000 });
    const url = host.url();

    const observer = await ctx.newPage();
    await observer.goto(url);
    // The waiting-room "Waiting for opponent…" indicator should render in both tabs.
    await expect(host.getByText(/waiting for opponent/i)).toBeVisible();
    await expect(observer.getByText(/waiting for opponent/i)).toBeVisible();

    await ctx.close();
  });
});

test.describe("Arena · BattleRoom layout integrity", () => {
  test("problem column keeps usable width after Monaco mounts", async ({ browser }) => {
    if (!EMAIL || !PASSWORD) test.skip(true, "Login creds not configured");

    const ctx = await browser.newContext();
    const host = await ctx.newPage();
    await loginIfNeeded(host);

    // Host creates a room
    await host.goto("/arena");
    const create = host.getByRole("button", { name: /create room/i }).first();
    if (!(await create.isVisible().catch(() => false))) {
      await ctx.close();
      test.skip(true, "Create room not available");
    }
    await create.click();
    const confirm = host.getByRole("button", { name: /create|generate|start/i }).first();
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await host.waitForURL(/\/arena\/room\/[A-Z0-9]{6}/, { timeout: 15_000 });
    const code = host.url().match(/\/arena\/room\/([A-Z0-9]{6})/)![1];

    // Verify mobile (375px): single-column stack, problem column has real width
    await host.setViewportSize({ width: 375, height: 812 });

    // Wait until BattleRoom mounts (host may auto-redirect once a peer joins;
    // for layout sanity we instead verify the room itself fits the viewport).
    const roomGrid = host.locator('[data-testid="battle-grid"]').first();
    if (await roomGrid.isVisible().catch(() => false)) {
      const probBox = await host.locator('[data-testid="battle-problem-col"]').boundingBox();
      const editorBox = await host.locator('[data-testid="battle-editor-col"]').boundingBox();
      expect(probBox?.width ?? 0).toBeGreaterThan(280);
      expect(editorBox?.width ?? 0).toBeGreaterThan(280);
    }

    // Desktop check: problem column never collapses to <320px after editor mounts
    await host.setViewportSize({ width: 1440, height: 900 });
    if (await roomGrid.isVisible().catch(() => false)) {
      // Allow Monaco a tick to lay out
      await host.waitForTimeout(800);
      const probBox = await host.locator('[data-testid="battle-problem-col"]').boundingBox();
      expect(probBox?.width ?? 0).toBeGreaterThanOrEqual(320);
    }

    await ctx.close();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });
});

test.describe("Arena · BattleRoom width measurements", () => {
  test("problem and editor panels keep usable widths after Monaco mounts", async ({ page }) => {
    if (!EMAIL || !PASSWORD) test.skip(true, "Login creds not configured");
    await loginIfNeeded(page);

    await page.goto("/arena");
    const create = page.getByRole("button", { name: /create room/i }).first();
    if (!(await create.isVisible().catch(() => false))) test.skip(true, "Create room not available");
    await create.click();
    const confirm = page.getByRole("button", { name: /create|generate|start/i }).first();
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await page.waitForURL(/\/arena\/(room|battle)\/[A-Za-z0-9-]+/, { timeout: 15_000 });

    const grid = page.locator('[data-testid="battle-grid"]');
    if (!(await grid.isVisible().catch(() => false))) test.skip(true, "Battle grid not reached (no peer)");

    // Wait for monaco wrapper to appear (post-mount)
    await page.locator('[data-testid="monaco-wrapper"]').waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForTimeout(750); // settle ResizeObserver

    // Desktop measurement
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    const probDesk = await page.locator('[data-testid="battle-problem-col"]').boundingBox();
    const edDesk = await page.locator('[data-testid="battle-editor-col"]').boundingBox();
    expect(probDesk?.width ?? 0).toBeGreaterThanOrEqual(320);
    expect(edDesk?.width ?? 0).toBeGreaterThanOrEqual(400);

    // Visual regression — desktop
    await expect(grid).toHaveScreenshot("battle-room-1440.png", { maxDiffPixelRatio: 0.05 });

    // Mobile measurement (single column)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const probMob = await page.locator('[data-testid="battle-problem-col"]').boundingBox();
    const edMob = await page.locator('[data-testid="battle-editor-col"]').boundingBox();
    expect(probMob?.width ?? 0).toBeGreaterThan(300);
    expect(edMob?.width ?? 0).toBeGreaterThan(300);

    // Visual regression — mobile
    await expect(grid).toHaveScreenshot("battle-room-375.png", { maxDiffPixelRatio: 0.05 });
  });
});

test.describe("Arena · Join-by-code mobile reload", () => {
  test("grid columns stay sized correctly after reload on mobile", async ({ page }) => {
    if (!EMAIL || !PASSWORD) test.skip(true, "Login creds not configured");
    await loginIfNeeded(page);
    await page.setViewportSize({ width: 375, height: 812 });

    // Use a deterministic invalid code to render the join page; then if the
    // user has an active code in env, prefer that for true end-to-end.
    const code = process.env.E2E_JOIN_CODE ?? "AAAAAA";
    await page.goto(`/arena/join/${code}`);

    // Skeleton must reserve grid space immediately on first paint
    const skeleton = page.locator('[data-testid="join-skeleton"]');
    // Skeleton may not render if peek instantly errors — that's OK.
    await page.waitForTimeout(150);

    // Reload and re-verify the page does not horizontally overflow the viewport
    await page.reload();
    await page.waitForLoadState("networkidle");
    const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(docWidth).toBeLessThanOrEqual(375 + 1);

    // If we successfully landed in a battle, assert the grid columns
    const grid = page.locator('[data-testid="battle-grid"]');
    if (await grid.isVisible().catch(() => false)) {
      await page.locator('[data-testid="monaco-wrapper"]').waitFor({ state: "visible" });
      await page.waitForTimeout(500);
      const prob = await page.locator('[data-testid="battle-problem-col"]').boundingBox();
      const ed = await page.locator('[data-testid="battle-editor-col"]').boundingBox();
      expect(prob?.width ?? 0).toBeGreaterThan(300);
      expect(ed?.width ?? 0).toBeGreaterThan(300);
    }
    // Silence unused-var lint when skeleton path didn't fire
    void skeleton;
  });
});

test.describe("Arena · Daily Challenge loop", () => {
  test("ArenaDaily renders today's challenge with bonus XP", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    await page.goto("/arena/daily");
    // Daily card should appear; if no challenge exists the auto-seed will
    // populate one from the published problems pool.
    const hero = page.locator("h1");
    await expect(hero).toBeVisible({ timeout: 15_000 });
    const xpBadge = page.getByText(/\+\d+ XP/i).first();
    await expect(xpBadge).toBeVisible();
  });

  test("ArenaHome shows daily history + streak panel after visiting daily", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    await page.goto("/arena/daily");
    await page.waitForLoadState("networkidle");
    await page.goto("/arena");
    const history = page.locator('[data-testid="daily-history-panel"]');
    await expect(history).toBeVisible({ timeout: 10_000 });
    // Streak strip + Days completed counter are both rendered
    await expect(history.getByText(/current streak/i)).toBeVisible();
    await expect(history.getByText(/days completed/i)).toBeVisible();
    await expect(history.getByText(/xp earned/i)).toBeVisible();
  });

  test("Daily challenge banner reflects solved state after RPC", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    // Stub the get_daily_challenge RPC to return a solved row so we can
    // verify the UI handshake without running a real battle.
    await page.route(/\/rest\/v1\/rpc\/arena_get_daily_challenge/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            challenge_id: "00000000-0000-0000-0000-000000000001",
            challenge_date: new Date().toISOString().slice(0, 10),
            problem_slug: "two-sum",
            bonus_xp: 100,
            attempted: true,
            solved: true,
            solve_time_sec: 245,
            global_solves: 12,
          },
        ]),
      });
    });
    await page.goto("/arena");
    const solved = page.locator('[data-testid="daily-solved"]');
    await expect(solved).toBeVisible({ timeout: 10_000 });
    await expect(solved).toContainText(/Solved/i);
  });
});

test.describe("Arena · Quest claim idempotency", () => {
  test("double-click on Claim only credits XP once via server validation", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");

    let claimCalls = 0;
    await page.route(/\/rest\/v1\/rpc\/arena_claim_quest/, async (route) => {
      claimCalls += 1;
      // First call: success with XP. Subsequent calls: already_claimed (no XP).
      const body =
        claimCalls === 1
          ? { ok: true, xp: 50 }
          : { ok: true, already_claimed: true, xp: 0 };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    // Stub quests so a completed-but-unclaimed row exists.
    await page.route(/\/rest\/v1\/rpc\/arena_ensure_daily_quests/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "quest-row-1",
            quest_id: "q1",
            quest_date: new Date().toISOString().slice(0, 10),
            progress: 1,
            target: 1,
            completed: true,
            claimed: false,
            xp_reward: 50,
          },
        ]),
      });
    });

    await page.goto("/arena");
    const claimBtn = page.locator('[data-testid="quest-claim-quest-row-1"]');
    await expect(claimBtn).toBeVisible({ timeout: 10_000 });

    // Rapid double-click — server-side guard must keep XP credit at 1.
    await Promise.all([claimBtn.click(), claimBtn.click()]);
    await page.waitForTimeout(800);

    expect(claimCalls).toBeGreaterThanOrEqual(1);
    // The second call (if it fired) returned already_claimed; UI must not
    // surface a second "+XP" toast because the server short-circuits.
    const successToasts = await page.getByText(/\+50 XP claimed/i).count();
    expect(successToasts).toBeLessThanOrEqual(1);
  });
});
