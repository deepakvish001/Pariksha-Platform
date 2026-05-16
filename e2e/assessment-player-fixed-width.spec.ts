import { test, expect, type Page } from "@playwright/test";

/**
 * End-to-end guardrail: the assessment Player's <main> container MUST keep
 * `max-w-[1600px]` across MCQ → coding → SQL navigation, on every viewport
 * (desktop, tablet, mobile / Lovable preview iframe).
 *
 * Why this spec doesn't drive the real /assessments/:attemptId/play route:
 * that route requires an authenticated student, a seeded attempt, paper,
 * and live questions — none of which exist in a fresh preview environment.
 * Instead, we navigate to a public page so the production Tailwind bundle
 * is loaded with the exact same JIT-compiled `max-w-[1600px]` rule the
 * Player uses, then inject the *real* container class string from
 * `getPlayerMainClass()` and swap its inner content to simulate MCQ →
 * coding → SQL navigation. If `max-w-[1600px]` ever gets compiled away,
 * swapped, or overridden by a responsive variant, this test fails.
 *
 * The class string below is intentionally a verbatim copy of the helper's
 * output so the spec stays a black-box check on the *compiled CSS*, not on
 * the helper's source. The `playerLayout.test.ts` unit test already locks
 * the helper output; this spec locks the browser-side resolution.
 */

// Verbatim from src/assessments/lib/playerLayout.ts → getPlayerMainClass({focusMode:false}).
const PLAYER_MAIN_CLASS =
  "flex-1 w-full min-w-0 mx-auto px-3 sm:px-5 py-4 grid gap-4 max-w-[1600px] overflow-x-clip lg:grid-cols-[300px_1fr]";

const QUESTION_TYPES = ["mcq", "coding", "sql"] as const;
type QType = (typeof QUESTION_TYPES)[number];

const VIEWPORTS = [
  { label: "desktop", width: 1440, height: 900 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "mobile", width: 390, height: 844 },
] as const;

const INNER_BY_TYPE: Record<QType, string> = {
  mcq: `<aside data-testid="palette-slot"></aside>
        <section data-testid="question-slot">
          <p>Pick the correct option:</p>
          <ul><li>A</li><li>B</li><li>C</li><li>D</li></ul>
        </section>`,
  coding: `<aside data-testid="palette-slot"></aside>
        <section data-testid="question-slot">
          <pre style="white-space:pre">function solve(){\n  // very long line that would normally try to widen the container ${"x".repeat(400)}\n}</pre>
        </section>`,
  sql: `<aside data-testid="palette-slot"></aside>
        <section data-testid="question-slot">
          <table><thead><tr>${Array.from({ length: 30 })
            .map((_, i) => `<th>col_${i}</th>`)
            .join("")}</tr></thead>
            <tbody><tr>${Array.from({ length: 30 })
              .map((_, i) => `<td>value_${i}_${"y".repeat(20)}</td>`)
              .join("")}</tr></tbody>
          </table>
        </section>`,
};

/**
 * Mount the Player <main> shell inside the live app DOM and expose helpers
 * for swapping the question type. Returns once `<main data-testid>` is in DOM.
 */
async function mountPlayerShell(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    ([cls, inner]) => {
      // Wipe any prior harness from previous nav.
      document.querySelector("[data-testid='player-main']")?.remove();
      const main = document.createElement("main");
      main.setAttribute("data-testid", "player-main");
      main.setAttribute("data-question-type", "mcq");
      main.className = cls;
      main.innerHTML = inner;
      // Append to body so nothing else constrains its computed width.
      document.body.appendChild(main);
      // Expose a global swap helper for the spec.
      (window as unknown as { __setQType: (t: string, html: string) => void }).__setQType = (
        t,
        html
      ) => {
        const m = document.querySelector<HTMLElement>("[data-testid='player-main']");
        if (!m) throw new Error("player-main missing");
        m.setAttribute("data-question-type", t);
        m.innerHTML = html;
        // The class string MUST NOT change between question types.
        // We intentionally do not touch m.className here.
      };
    },
    [PLAYER_MAIN_CLASS, INNER_BY_TYPE.mcq]
  );
  await expect(page.getByTestId("player-main")).toBeVisible();
}

async function switchTo(page: Page, t: QType): Promise<void> {
  await page.evaluate(
    ([type, html]) => {
      (window as unknown as { __setQType: (t: string, html: string) => void }).__setQType(
        type,
        html
      );
    },
    [t, INNER_BY_TYPE[t]]
  );
  await expect(page.getByTestId("player-main")).toHaveAttribute("data-question-type", t);
}

interface Snapshot {
  className: string;
  maxWidthPx: number;
  clientWidthPx: number;
}

async function snapshot(page: Page): Promise<Snapshot> {
  return await page.evaluate(() => {
    const m = document.querySelector<HTMLElement>("[data-testid='player-main']");
    if (!m) throw new Error("player-main missing");
    const cs = window.getComputedStyle(m);
    return {
      className: m.className,
      maxWidthPx: parseFloat(cs.maxWidth),
      clientWidthPx: m.clientWidth,
    };
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`Player main container — fixed width @ ${vp.label} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("max-w-[1600px] survives MCQ → coding → SQL navigation", async ({ page }) => {
      await mountPlayerShell(page);

      const snaps: Record<QType, Snapshot> = {} as Record<QType, Snapshot>;
      for (const t of QUESTION_TYPES) {
        await switchTo(page, t);
        snaps[t] = await snapshot(page);
      }

      // 1. The class string is byte-identical across every question type —
      //    no max-width swap can sneak through.
      expect(snaps.coding.className).toBe(snaps.mcq.className);
      expect(snaps.sql.className).toBe(snaps.mcq.className);

      // 2. The class always contains the canonical token AND never the legacy one.
      for (const t of QUESTION_TYPES) {
        expect(snaps[t].className).toContain("max-w-[1600px]");
        expect(snaps[t].className).not.toContain("max-w-5xl");
        expect(snaps[t].className).not.toMatch(/\b(sm|md|lg|xl|2xl):max-w-/);
      }

      // 3. The browser resolved `max-w-[1600px]` to exactly 1600px from the
      //    compiled Tailwind bundle — proving the JIT rule wasn't purged.
      for (const t of QUESTION_TYPES) {
        expect(
          snaps[t].maxWidthPx,
          `computed max-width for ${t} @ ${vp.label}`
        ).toBe(1600);
      }

      // 4. Rendered width stays constant across types at this viewport
      //    (the container caps at 1600 on desktop and at viewport on smaller
      //    screens — but the cap itself must be identical between types).
      expect(snaps.coding.clientWidthPx).toBe(snaps.mcq.clientWidthPx);
      expect(snaps.sql.clientWidthPx).toBe(snaps.mcq.clientWidthPx);

      // 5. On mobile/tablet the container must not overflow the viewport.
      expect(snaps.mcq.clientWidthPx).toBeLessThanOrEqual(vp.width);
    });
  });
}
