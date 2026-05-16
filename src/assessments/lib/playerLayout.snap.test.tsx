/**
 * Structural layout regression for the assessment Player.
 *
 * This is the closest thing to "visual regression" we can do automatically in
 * a Vitest + jsdom environment (no real layout engine, no rasterizer). It
 * snapshots a minimal layout shell that reproduces the production Player's
 * <main> container for every:
 *
 *   - question type (mcq, true_false, short_answer, subjective, matching,
 *     coding, sql)
 *   - focus mode (off / on)
 *
 * Because the shell uses the real `getPlayerMainClass()` helper, any future
 * regression that reintroduces type-conditional width swapping, drops a
 * breakpoint token, or alters the column track will produce a snapshot diff.
 *
 * The responsive aspect is captured by snapshotting the raw Tailwind class
 * string (which contains the responsive `lg:` tokens). Tailwind resolves
 * these to media queries at runtime in the real browser; the source of truth
 * is the class string itself, so locking it down covers all breakpoints.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { getPlayerMainClass } from "./playerLayout";
import type { PaperQuestionType } from "../hooks/usePaper";

const TYPES: PaperQuestionType[] = [
  "mcq",
  "true_false",
  "short_answer",
  "subjective",
  "matching",
  "coding",
  "sql",
];

/** Minimal reproduction of the Player's layout shell. */
function LayoutShell({
  questionType,
  focusMode,
}: {
  questionType: PaperQuestionType;
  focusMode: boolean;
}) {
  return (
    <div data-testid="player-shell">
      <main
        data-testid="player-main"
        className={getPlayerMainClass({ focusMode, questionType })}
      >
        <aside data-testid="palette-slot" />
        <section data-testid="question-slot" />
      </main>
    </div>
  );
}

describe("Player layout shell — structural snapshots", () => {
  for (const type of TYPES) {
    for (const focusMode of [false, true]) {
      const label = `${type} · focus=${focusMode ? "on" : "off"}`;

      it(`matches snapshot · ${label}`, () => {
        const { getByTestId } = render(
          <LayoutShell questionType={type} focusMode={focusMode} />
        );
        const main = getByTestId("player-main");
        // Snapshot the full outer HTML — captures class string, child tracks,
        // and structural slot order. Any responsive token change shows up here.
        expect(main.outerHTML).toMatchSnapshot();
      });
    }
  }

  it("MCQ / coding / SQL render byte-identical shells", () => {
    const html = (type: PaperQuestionType) =>
      render(<LayoutShell questionType={type} focusMode={false} />).getByTestId(
        "player-main"
      ).outerHTML;

    const mcq = html("mcq");
    expect(html("coding")).toBe(mcq);
    expect(html("sql")).toBe(mcq);
  });
});
