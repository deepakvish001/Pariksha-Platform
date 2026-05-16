import { test, expect, type Page } from "@playwright/test";

/**
 * End-to-end assertion: the sidebar grid track (`lg:grid-cols-[240px_1fr]`)
 * toggles ONLY with `focusMode`, while the width tokens of the Player <main>
 * container (`max-w-[1600px]` + `w-full` + `min-w-0` + `overflow-x-clip`)
 * stay byte-identical across every question type AND across both focus
 * modes.
 *
 * In other words, this spec proves two orthogonal invariants in the browser:
 *
 *   1. Width axis     — never changes (question type ⊥ focus mode)
 *   2. Sidebar axis   — changes iff focus mode changes (question type
 *                       has zero influence)
 *
 * As with the sibling spec, we don't drive the real
 * /assessments/:attemptId/play route (it requires a seeded attempt). We
 * load the app shell so the production Tailwind bundle is in scope, then
 * inject a <main> with the *exact* class string emitted by
 * `getPlayerMainClass()` for each (focusMode × questionType) combination.
 */

// Verbatim mirrors of getPlayerMainClass({ focusMode }) output.
// If the helper changes, this spec MUST be updated in lockstep — the
// vitest suite (`playerLayout.test.ts`) guards the helper itself; this
// spec guards what the *browser* resolves it to.
const BASE_WIDTH_CLASS =
  "flex-1 w-full min-w-0 mx-auto px-3 sm:px-5 py-4 grid gap-4 max-w-[1600px] overflow-x-clip";
const SIDEBAR_TRACK = "lg:grid-cols-[240px_1fr]";

const CLASS_BY_FOCUS = {
  off: `${BASE_WIDTH_CLASS} ${SIDEBAR_TRACK}`,
  on: BASE_WIDTH_CLASS,
} as const;

const WIDTH_TOKENS = [
  "w-full",
  "min-w-0",
  "max-w-[1600px]",
  "overflow-x-clip",
  "px-3",
  "sm:px-5",
] as const;

const QUESTION_TYPES = ["mcq", "coding", "sql", "subjective", "matching"] as const;
type QType = (typeof QUESTION_TYPES)[number];
type FocusKey = keyof typeof CLASS_BY_FOCUS;

/** Extract the deterministic width-related token set from a className. */
function widthTokenSet(cls: string): string[] {
  const tokens = cls.split(/\s+/).filter(Boolean);
  return WIDTH_TOKENS.filter((t) => tokens.includes(t)).slice().sort();
}

async function mountMain(
  page: Page,
  focus: FocusKey,
  qtype: QType
): Promise<void> {
  await page.evaluate(
    ([cls, t]) => {
      document.querySelector("[data-testid='player-main']")?.remove();
      const main = document.createElement("main");
      main.setAttribute("data-testid", "player-main");
      main.setAttribute("data-question-type", t);
      main.className = cls;
      main.innerHTML = `
        <aside data-testid="palette-slot" style="background:#222;color:#fff">palette</aside>
        <section data-testid="question-slot" style="background:#333;color:#fff">${t}</section>
      `;
      document.body.appendChild(main);
    },
    [CLASS_BY_FOCUS[focus], qtype]
  );
  await expect(page.getByTestId("player-main")).toHaveAttribute("data-question-type", qtype);
}

interface Snapshot {
  className: string;
  widthTokens: string[];
  hasSidebarTrack: boolean;
  gridTemplateColumns: string;
  maxWidthPx: number;
}

async function snapshot(page: Page): Promise<Snapshot> {
  return await page.evaluate((sidebarToken) => {
    const m = document.querySelector<HTMLElement>("[data-testid='player-main']");
    if (!m) throw new Error("player-main missing");
    const cs = window.getComputedStyle(m);
    return {
      className: m.className,
      widthTokens: m.className.split(/\s+/).filter(Boolean),
      hasSidebarTrack: m.className.split(/\s+/).includes(sidebarToken),
      gridTemplateColumns: cs.gridTemplateColumns,
      maxWidthPx: parseFloat(cs.maxWidth),
    };
  }, SIDEBAR_TRACK);
}

// Run at a desktop viewport so the `lg:` breakpoint is active and the
// sidebar track actually resolves in computed style (not just in className).
test.use({ viewport: { width: 1440, height: 900 } });

test.describe("Player main — sidebar toggles with focusMode, width is invariant", () => {
  test("width tokens identical across types & modes; sidebar track toggles only with focus", async ({
    page,
  }) => {
    await page.goto("/");

    type Cell = { focus: FocusKey; qtype: QType; snap: Snapshot };
    const cells: Cell[] = [];
    for (const focus of ["off", "on"] as const) {
      for (const qtype of QUESTION_TYPES) {
        await mountMain(page, focus, qtype);
        cells.push({ focus, qtype, snap: await snapshot(page) });
      }
    }

    // -----------------------------------------------------------------
    // INVARIANT 1 — Width tokens are byte-identical across every cell.
    // -----------------------------------------------------------------
    const reference = widthTokenSet(cells[0].snap.className);
    for (const c of cells) {
      expect(
        widthTokenSet(c.snap.className),
        `width tokens drifted at focus=${c.focus} qtype=${c.qtype}`
      ).toEqual(reference);

      // Compiled CSS must resolve max-width to exactly 1600px in every cell.
      expect(
        c.snap.maxWidthPx,
        `max-width resolved to ${c.snap.maxWidthPx} at focus=${c.focus} qtype=${c.qtype}`
      ).toBe(1600);
    }

    // -----------------------------------------------------------------
    // INVARIANT 2 — Sidebar track presence is a pure function of focus.
    // -----------------------------------------------------------------
    for (const c of cells) {
      const expected = c.focus === "off";
      expect(
        c.snap.hasSidebarTrack,
        `sidebar track presence wrong at focus=${c.focus} qtype=${c.qtype} (expected ${expected})`
      ).toBe(expected);
    }

    // -----------------------------------------------------------------
    // INVARIANT 3 — Within a focus mode, computed grid-template-columns
    // is identical across every question type (the sidebar axis cannot
    // be influenced by question type at the CSS level either).
    // -----------------------------------------------------------------
    for (const focus of ["off", "on"] as const) {
      const focusCells = cells.filter((c) => c.focus === focus);
      const ref = focusCells[0].snap.gridTemplateColumns;
      for (const c of focusCells) {
        expect(
          c.snap.gridTemplateColumns,
          `grid-template-columns drifted at focus=${focus} qtype=${c.qtype}`
        ).toBe(ref);
      }
    }

    // -----------------------------------------------------------------
    // INVARIANT 4 — Toggling focus actually changes the resolved grid
    // (otherwise the test could pass on a totally broken Tailwind build).
    // -----------------------------------------------------------------
    const offGrid = cells.find((c) => c.focus === "off")!.snap.gridTemplateColumns;
    const onGrid = cells.find((c) => c.focus === "on")!.snap.gridTemplateColumns;
    expect(offGrid).not.toBe(onGrid);
    // The "off" track must contain the literal 240px sidebar column.
    expect(offGrid).toMatch(/(^|\s)240px(\s|$)/);
  });

  test("focusMode toggle on a single mounted node does not perturb width tokens", async ({
    page,
  }) => {
    await page.goto("/");
    // Mount once, then mutate ONLY the sidebar token in place — simulates
    // a live focusMode toggle inside Player without remounting.
    await mountMain(page, "off", "coding");
    const before = await snapshot(page);

    await page.evaluate((sidebarToken) => {
      const m = document.querySelector<HTMLElement>("[data-testid='player-main']");
      if (!m) throw new Error("player-main missing");
      m.classList.remove(sidebarToken);
    }, SIDEBAR_TRACK);
    const afterOn = await snapshot(page);

    await page.evaluate((sidebarToken) => {
      const m = document.querySelector<HTMLElement>("[data-testid='player-main']");
      if (!m) throw new Error("player-main missing");
      m.classList.add(sidebarToken);
    }, SIDEBAR_TRACK);
    const afterOff = await snapshot(page);

    // Width tokens never moved across the toggle.
    expect(widthTokenSet(afterOn.className)).toEqual(widthTokenSet(before.className));
    expect(widthTokenSet(afterOff.className)).toEqual(widthTokenSet(before.className));
    expect(afterOn.maxWidthPx).toBe(before.maxWidthPx);
    expect(afterOff.maxWidthPx).toBe(before.maxWidthPx);

    // Sidebar axis flipped exactly twice and ended where it started.
    expect(before.hasSidebarTrack).toBe(true);
    expect(afterOn.hasSidebarTrack).toBe(false);
    expect(afterOff.hasSidebarTrack).toBe(true);
    expect(afterOn.gridTemplateColumns).not.toBe(before.gridTemplateColumns);
    expect(afterOff.gridTemplateColumns).toBe(before.gridTemplateColumns);
  });
});
