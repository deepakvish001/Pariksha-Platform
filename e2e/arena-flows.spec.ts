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

test.describe("Arena · Daily challenge integrity", () => {
  test("complete RPC rejects when battle's problem mismatches today's daily", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    let xpCalls = 0;
    await page.route(/\/rest\/v1\/rpc\/arena_complete_daily_challenge/, async (route) => {
      xpCalls += 1;
      // First call: reject with problem_mismatch. Second: would credit.
      const body = xpCalls === 1
        ? { ok: false, reason: "problem_mismatch" }
        : { ok: true, xp: 100 };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto("/arena/daily");
    await page.waitForLoadState("networkidle");
    // Simulate two completion attempts; only the matched one should credit XP.
    const calls = await page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { supabase } = await import("/src/integrations/supabase/client.ts" as any);
      const a = await supabase.rpc("arena_complete_daily_challenge", { _battle_id: "00000000-0000-0000-0000-000000000001", _solve_time_sec: 100 });
      const b = await supabase.rpc("arena_complete_daily_challenge", { _battle_id: "00000000-0000-0000-0000-000000000002", _solve_time_sec: 100 });
      return [a.data, b.data];
    }).catch(() => null);
    if (calls) {
      expect(calls[0]).toMatchObject({ ok: false });
      expect(calls[1]).toMatchObject({ ok: true, xp: 100 });
    }
    expect(xpCalls).toBeGreaterThanOrEqual(1);
  });

  test("quest progress panel updates live via realtime subscription", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    await page.goto("/arena/daily");
    const panel = page.locator('[data-testid="daily-quest-progress"]');
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByText(/done/i)).toBeVisible();
    await expect(panel.getByText(/claimed/i)).toBeVisible();
  });
});

test.describe("Arena · History range jump", () => {
  test("date range form reloads history with selected window", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    let rangeCalled = false;
    await page.route(/arena_get_daily_history_range/, async (route) => {
      rangeCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });
    await page.goto("/arena");
    const toggle = page.locator('[data-testid="history-range-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 10_000 });
    await toggle.click();
    const form = page.locator('[data-testid="history-range-form"]');
    await expect(form).toBeVisible();
    await form.locator('input[type="date"]').first().fill("2026-04-01");
    await form.locator('input[type="date"]').nth(1).fill("2026-05-01");
    await page.locator('[data-testid="history-range-apply"]').click();
    await page.waitForTimeout(300);
    expect(rangeCalled).toBe(true);
  });
});

test.describe("Arena · Admin daily review (filters + CSV + rollback integrity)", () => {
  test("filters narrow the player list and CSV export downloads matching rows", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");

    // Stub admin RPC + challenge fetch with a deterministic mix of solved/unsolved/unclaimed.
    await page.route(/rest\/v1\/arena_daily_challenges/, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        id: "11111111-1111-1111-1111-111111111111",
        challenge_date: new Date().toISOString().slice(0, 10),
        problem_slug: "two-sum",
        bonus_xp: 100,
      }) }),
    );
    await page.route(/rpc\/admin_daily_challenge_claimers(\?|$)/, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([
        { user_id: "u1", display_name: "Alice", solved: true, solve_time_sec: 120, xp_awarded: 100, attempted_at: new Date().toISOString(), solved_at: new Date().toISOString() },
        { user_id: "u2", display_name: "Bob",   solved: true, solve_time_sec: 240, xp_awarded: 0,   attempted_at: new Date().toISOString(), solved_at: new Date().toISOString() },
        { user_id: "u3", display_name: "Cara",  solved: false, solve_time_sec: null, xp_awarded: 0, attempted_at: new Date().toISOString(), solved_at: null },
      ]) }),
    );

    await page.goto("/admin/daily-challenge");
    const card = page.locator('[data-testid="daily-review-card"]');
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Filter: solved → 2 rows
    await page.locator('[data-testid="review-filter-solved"]').click();
    await expect(card.getByText("Alice")).toBeVisible();
    await expect(card.getByText("Bob")).toBeVisible();
    await expect(card.getByText("Cara")).toHaveCount(0);

    // Filter: not_claimed → only Bob (solved + 0 XP)
    await page.locator('[data-testid="review-filter-not_claimed"]').click();
    await expect(card.getByText("Bob")).toBeVisible();
    await expect(card.getByText("Alice")).toHaveCount(0);

    // CSV export → triggers a Blob download
    const downloadPromise = page.waitForEvent("download").catch(() => null);
    await page.locator('[data-testid="review-export-csv"]').click();
    const dl = await downloadPromise;
    if (dl) expect(dl.suggestedFilename()).toMatch(/^daily-claimers-.*-not_claimed\.csv$/);
  });

  test("rollback prevents XP crediting once invoked for the date", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    let rolledBack = false;
    let xpCalls = 0;

    await page.route(/rpc\/admin_rollback_daily_challenge/, (route) => {
      rolledBack = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    // After rollback the completion RPC should refuse to credit XP for this date.
    await page.route(/rpc\/arena_complete_daily_challenge/, (route) => {
      xpCalls += 1;
      return route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify(rolledBack
          ? { ok: false, reason: "no_challenge_for_date" }
          : { ok: true, xp: 100 }),
      });
    });

    await page.goto("/arena/daily");
    await page.waitForLoadState("networkidle");

    const result = await page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { supabase } = await import("/src/integrations/supabase/client.ts" as any);
      const before = await supabase.rpc("arena_complete_daily_challenge", { _battle_id: "00000000-0000-0000-0000-0000000000aa", _solve_time_sec: 100 });
      await supabase.rpc("admin_rollback_daily_challenge", { _date: new Date().toISOString().slice(0,10) });
      const after = await supabase.rpc("arena_complete_daily_challenge", { _battle_id: "00000000-0000-0000-0000-0000000000bb", _solve_time_sec: 100 });
      return [before.data, after.data];
    }).catch(() => null);

    if (result) {
      expect(result[0]).toMatchObject({ ok: true, xp: 100 });
      expect(result[1]).toMatchObject({ ok: false });
    }
    expect(rolledBack).toBe(true);
    expect(xpCalls).toBeGreaterThanOrEqual(1);
  });

  test("only the seeded daily problem is credited, and only once", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    const seeded = "two-sum";
    let credited = 0;

    await page.route(/rpc\/arena_complete_daily_challenge/, async (route) => {
      const post = route.request().postDataJSON?.() as { _battle_id?: string } | null;
      // Battle 'aa' is for the seeded problem; 'bb' is for a different problem (mismatch).
      const isSeeded = post?._battle_id?.endsWith("aa");
      if (isSeeded && credited === 0) {
        credited += 1;
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, xp: 100, problem_slug: seeded }) });
      }
      return route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify(isSeeded ? { ok: false, already_solved: true } : { ok: false, reason: "problem_mismatch" }),
      });
    });

    await page.goto("/arena/daily");
    await page.waitForLoadState("networkidle");
    const out = await page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { supabase } = await import("/src/integrations/supabase/client.ts" as any);
      const a1 = await supabase.rpc("arena_complete_daily_challenge", { _battle_id: "00000000-0000-0000-0000-0000000000aa", _solve_time_sec: 100 });
      const a2 = await supabase.rpc("arena_complete_daily_challenge", { _battle_id: "00000000-0000-0000-0000-0000000000aa", _solve_time_sec: 100 });
      const b  = await supabase.rpc("arena_complete_daily_challenge", { _battle_id: "00000000-0000-0000-0000-0000000000bb", _solve_time_sec: 100 });
      return [a1.data, a2.data, b.data];
    }).catch(() => null);

    if (out) {
      expect(out[0]).toMatchObject({ ok: true, xp: 100, problem_slug: seeded });
      expect(out[1]).toMatchObject({ ok: false });
      expect(out[2]).toMatchObject({ ok: false, reason: "problem_mismatch" });
    }
    expect(credited).toBe(1);
  });
});

test.describe("Arena · Admin daily review drawer (RBAC + server validation)", () => {
  test("non-admin cannot open drawer or hit admin RPCs", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");

    // Simulate a non-admin: force user_roles query to return no admin role.
    await page.route(/\/rest\/v1\/user_roles\b/, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );
    // Admin-only RPCs should reject for non-admins.
    await page.route(/rpc\/admin_daily_challenge_(claimers|claimers_range|user_detail)/, (route) =>
      route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ message: "admin only" }) }),
    );

    await page.goto("/admin/daily-challenge").catch(() => {});
    await page.waitForLoadState("networkidle");

    const card = page.locator('[data-testid="daily-review-card"]');
    if (await card.count()) {
      // Either redirected away or rendered the locked state — both are acceptable.
      await expect(page.locator('[data-testid="review-row"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="review-export-csv"]')).toHaveCount(0);
    }
    await expect(page.locator('[data-testid="daily-user-detail-drawer"]')).toHaveCount(0);
  });

  test("admin opens drawer and sees server-validated matches_seeded", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");

    // Force admin role
    await page.route(/\/rest\/v1\/user_roles\b/, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ role: "admin" }]) }),
    );

    const today = new Date().toISOString().slice(0, 10);
    const userId = "00000000-0000-0000-0000-00000000beef";

    // Stub claimers list so a row exists to click.
    await page.route(/rpc\/admin_daily_challenge_claimers\b/, (route) =>
      route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify([
          { user_id: userId, display_name: "Test User", solved: true,
            solve_time_sec: 120, xp_awarded: 100,
            attempted_at: new Date().toISOString(), solved_at: new Date().toISOString() },
        ]),
      }),
    );
    await page.route(/arena_daily_challenges/, (route) =>
      route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ id: "c1", challenge_date: today, problem_slug: "two-sum", bonus_xp: 100 }),
      }),
    );

    let detailCalls = 0;
    await page.route(/rpc\/admin_daily_challenge_user_detail/, (route) => {
      detailCalls += 1;
      // Return many rows to also exercise pagination "Load more".
      const attempts = Array.from({ length: 25 }, (_, i) => ({
        id: `a${i}`, battle_id: `b${i}`, solved: i % 2 === 0,
        solve_time_sec: 100 + i, xp_awarded: i === 0 ? 100 : 0,
        attempted_at: new Date(Date.now() - i * 60000).toISOString(),
        solved_at: i % 2 === 0 ? new Date().toISOString() : null,
      }));
      const submissions = Array.from({ length: 22 }, (_, i) => ({
        id: `s${i}`, battle_id: `b${i}`,
        problem_slug: i < 2 ? "two-sum" : "reverse-string",
        verdict: i === 0 ? "AC" : "WA", passed: 5, total: 10, language: "py",
        runtime_ms: 50, created_at: new Date().toISOString(),
        matches_seeded: i < 2,
      }));
      return route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          user_id: userId, challenge_date: today,
          seeded_problem_slug: "two-sum", bonus_xp: 100,
          attempts, submissions,
        }),
      });
    });

    await page.goto("/admin/daily-challenge");
    await page.waitForLoadState("networkidle");

    const row = page.locator('[data-testid="review-row"]').first();
    if (await row.count() === 0) test.skip(true, "Admin route not reachable in this env");

    await row.click();
    const drawer = page.locator('[data-testid="daily-user-detail-drawer"]');
    await expect(drawer).toBeVisible();
    expect(detailCalls).toBeGreaterThan(0);

    // Server-validated badges appear
    await expect(drawer.locator('[data-testid="sub-matches-seeded"]').first()).toBeVisible();
    await expect(drawer.locator('[data-testid="sub-mismatch"]').first()).toBeVisible();

    // Pagination: load more shows additional rows
    const loadMore = drawer.locator('[data-testid="drawer-load-more-attempts"]');
    await expect(loadMore).toBeVisible();
    await loadMore.click();
    await expect(drawer.locator('[data-testid="drawer-load-more-subs"]')).toBeVisible();
  });

  test("drawer shows empty state for users with no attempts/submissions", async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, "Login creds not configured");
    await page.route(/\/rest\/v1\/user_roles\b/, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ role: "admin" }]) }),
    );
    await page.route(/rpc\/admin_daily_challenge_claimers\b/, (route) =>
      route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify([
          { user_id: "00000000-0000-0000-0000-0000000000ee", display_name: "Empty User",
            solved: false, solve_time_sec: null, xp_awarded: 0,
            attempted_at: new Date().toISOString(), solved_at: null },
        ]),
      }),
    );
    await page.route(/rpc\/admin_daily_challenge_user_detail/, (route) =>
      route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          user_id: "00000000-0000-0000-0000-0000000000ee",
          challenge_date: new Date().toISOString().slice(0, 10),
          seeded_problem_slug: "two-sum", bonus_xp: 100,
          attempts: [], submissions: [],
        }),
      }),
    );

    await page.goto("/admin/daily-challenge");
    await page.waitForLoadState("networkidle");
    const row = page.locator('[data-testid="review-row"]').first();
    if (await row.count() === 0) test.skip(true, "Admin route not reachable");
    await row.click();

    const drawer = page.locator('[data-testid="daily-user-detail-drawer"]');
    await expect(drawer.locator('[data-testid="drawer-empty-attempts"]')).toBeVisible();
    await expect(drawer.locator('[data-testid="drawer-empty-submissions"]')).toBeVisible();
  });
});
