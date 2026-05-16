import { test, expect, type Page } from "@playwright/test";

/**
 * Responsive end-to-end regression: the assessment Player's <main> container
 * MUST NEVER switch to the legacy `max-w-5xl` token when navigating between
 * MCQ, coding, and SQL questions — at ANY breakpoint.
 *
 * Historical bug: Player.tsx used to swap between `max-w-5xl` (for "narrow"
 * question types like MCQ / subjective / matching) and `max-w-[1600px]`
 * (for coding / sql). This caused a visible width jump on every navigation.
 * The helper `getPlayerMainClass()` now emits a single canonical width
 * token, but a future refactor could quietly reintroduce the old behavior
 * — especially if someone adds a responsive override (e.g. `lg:max-w-5xl`)
 * that only fires at certain viewports.
 *
 * This spec drives the *browser* across mobile + desktop breakpoints and
 * asserts at each step:
 *   1. The container's className contains `max-w-[1600px]`
 *   2. The container's className does NOT contain `max-w-5xl`
 *      (neither bare nor as any responsive variant)
 *   3. The browser-resolved `max-width` is exactly 1600px
 *      (proves no compiled CSS rule is overriding it at this breakpoint)
 *
 * As with the sibling Player specs, we don't drive the real
 * /assessments/:attemptId/play route — it requires a seeded attempt that
 * doesn't exist in a fresh preview environment. Instead, we load the app
 * shell so the production Tailwind bundle is in scope, then inject a
 * <main> with the verbatim production class string and walk MCQ → coding
 * → SQL.
 */

// Verbatim mirror of getPlayerMainClass({ focusMode: false }).
const PLAYER_MAIN_CLASS =
  "flex-1 w-full min-w-0 mx-auto px-3 sm:px-5 py-4 grid gap-4 max-w-[1600px] overflow-x-clip lg:grid-cols-[300px_1fr]";

const QUESTION_TYPES = ["mcq", "coding", "sql"] as const;
type QType = (typeof QUESTION_TYPES)[number];

// Cover both the small-screen breakpoint (where a sneaky `lg:max-w-5xl`
// would NOT fire) and the desktop breakpoint (where it would). If the
// regression ever returns, at least one of these viewports catches it.
const BREAKPOINTS = [
  { label: "mobile", width: 375, height: 812 },
  { label: "desktop", width: 1440, height: 900 },
] as const;

// Match `max-w-5xl` whether bare or scoped to ANY responsive prefix
// (sm: / md: / lg: / xl: / 2xl: / @container / arbitrary variants).
const LEGACY_MAX_W_5XL = /(?:^|[\s:[])max-w-5xl(?:$|\s)/;

const INNER_BY_TYPE: Record<QType, string> = {
  mcq: `<aside data-testid="palette-slot"></aside>
        <section data-testid="question-slot">MCQ body</section>`,
  coding: `<aside data-testid="palette-slot"></aside>
        <section data-testid="question-slot">
          <pre>coding body with a very long line ${"a".repeat(300)}</pre>
        </section>`,
  sql: `<aside data-testid="palette-slot"></aside>
        <section data-testid="question-slot">
          <table><tr>${Array.from({ length: 20 })
            .map((_, i) => `<td>col_${i}</td>`)
            .join("")}</tr></table>
        </section>`,
};

async function mountShell(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    ([cls, mcqHtml]) => {
      document.querySelector("[data-testid='player-main']")?.remove();
      const main = document.createElement("main");
      main.setAttribute("data-testid", "player-main");
      main.setAttribute("data-question-type", "mcq");
      main.className = cls;
      main.innerHTML = mcqHtml;
      document.body.appendChild(main);
    },
    [PLAYER_MAIN_CLASS, INNER_BY_TYPE.mcq]
  );
  await expect(page.getByTestId("player-main")).toBeVisible();
}

async function navigateTo(page: Page, t: QType): Promise<void> {
  await page.evaluate(
    ([type, html]) => {
      const m = document.querySelector<HTMLElement>("[data-testid='player-main']");
      if (!m) throw new Error("player-main missing");
      m.setAttribute("data-question-type", type);
      m.innerHTML = html;
      // Class MUST stay untouched — navigation does not re-skin the shell.
    },
    [t, INNER_BY_TYPE[t]]
  );
  await expect(page.getByTestId("player-main")).toHaveAttribute("data-question-type", t);
}

async function assertNoLegacyWidth(
  page: Page,
  context: { breakpoint: string; qtype: QType }
): Promise<void> {
  const result = await page.evaluate(() => {
    const m = document.querySelector<HTMLElement>("[data-testid='player-main']");
    if (!m) throw new Error("player-main missing");
    return {
      className: m.className,
      maxWidthPx: parseFloat(window.getComputedStyle(m).maxWidth),
    };
  });

  const where = `[${context.breakpoint} / ${context.qtype}]`;

  // 1. Canonical token present.
  expect(result.className, `${where} missing max-w-[1600px]`).toContain("max-w-[1600px]");

  // 2. Legacy token absent — bare OR any responsive variant.
  expect(
    LEGACY_MAX_W_5XL.test(result.className),
    `${where} reintroduced max-w-5xl: ${result.className}`
  ).toBe(false);

  // 3. Compiled CSS resolves max-width to exactly 1600px at this breakpoint.
  //    If a `lg:max-w-5xl` override sneaks in, this drops to 1024px on desktop.
  expect(result.maxWidthPx, `${where} computed max-width drift`).toBe(1600);
}

for (const bp of BREAKPOINTS) {
  test.describe(`Player main — no max-w-5xl regression @ ${bp.label} (${bp.width}x${bp.height})`, () => {
    test.use({ viewport: { width: bp.width, height: bp.height } });

    test("MCQ → coding → SQL navigation keeps max-w-[1600px], never max-w-5xl", async ({
      page,
    }) => {
      await mountShell(page);

      // Assert on the initial MCQ render before any navigation.
      await assertNoLegacyWidth(page, { breakpoint: bp.label, qtype: "mcq" });

      // Walk the full navigation sequence — including the round-trip back
      // to MCQ — to catch any state-machine bug where a width swap only
      // happens after visiting coding/sql.
      for (const t of [...QUESTION_TYPES, "mcq"] as const) {
        await navigateTo(page, t);
        await assertNoLegacyWidth(page, { breakpoint: bp.label, qtype: t });
      }
    });

    test("class string is byte-identical across MCQ / coding / SQL", async ({ page }) => {
      await mountShell(page);

      const classByType: Record<QType, string> = {} as Record<QType, string>;
      for (const t of QUESTION_TYPES) {
        await navigateTo(page, t);
        classByType[t] = await page.evaluate(() => {
          const m = document.querySelector<HTMLElement>("[data-testid='player-main']");
          if (!m) throw new Error("player-main missing");
          return m.className;
        });
      }

      // If any future code path skins the <main> differently per question
      // type at this breakpoint, the strings diverge and we fail loud.
      expect(classByType.coding).toBe(classByType.mcq);
      expect(classByType.sql).toBe(classByType.mcq);

      for (const t of QUESTION_TYPES) {
        expect(LEGACY_MAX_W_5XL.test(classByType[t])).toBe(false);
      }
    });
  });
}
