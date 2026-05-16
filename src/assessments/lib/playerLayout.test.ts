import { describe, it, expect } from "vitest";
import { getPlayerMainClass } from "./playerLayout";
import type { PaperQuestionType } from "../hooks/usePaper";

/**
 * Width-invariant regression test.
 *
 * Previously, Player.tsx swapped between `max-w-5xl` (narrow questions like
 * MCQ / subjective / matching) and `max-w-[1600px]` (coding / sql), which
 * caused a visible layout jump every time a candidate navigated to a
 * different question type. This test locks the invariant in place:
 *
 *   1. Every question type resolves to the SAME max-width token.
 *   2. The legacy `max-w-5xl` token never appears.
 *   3. The sidebar column toggles purely off focus mode, not question type.
 */

const ALL_TYPES: PaperQuestionType[] = [
  "mcq",
  "true_false",
  "short_answer",
  "subjective",
  "matching",
  "coding",
  "sql",
];

const FIXED_MAX_WIDTH = "max-w-[1600px]";
const LEGACY_MAX_WIDTH = "max-w-5xl";

function widthTokens(cls: string): string[] {
  return cls.split(/\s+/).filter((t) => t.startsWith("max-w-"));
}

describe("Player main container width is fixed across question types", () => {
  it("emits exactly one max-width token regardless of question type or focus mode", () => {
    for (const t of ALL_TYPES) {
      for (const focusMode of [false, true]) {
        const cls = getPlayerMainClass({ focusMode, questionType: t });
        const tokens = widthTokens(cls);
        expect(
          tokens,
          `expected exactly one max-w-* token for type=${t} focus=${focusMode}, got: ${tokens.join(", ")}`
        ).toEqual([FIXED_MAX_WIDTH]);
      }
    }
  });

  it("never reintroduces the legacy max-w-5xl token", () => {
    for (const t of ALL_TYPES) {
      for (const focusMode of [false, true]) {
        const cls = getPlayerMainClass({ focusMode, questionType: t });
        expect(cls).not.toContain(LEGACY_MAX_WIDTH);
      }
    }
  });

  it("produces an identical class string when navigating MCQ → coding → SQL", () => {
    const mcq = getPlayerMainClass({ focusMode: false, questionType: "mcq" });
    const coding = getPlayerMainClass({ focusMode: false, questionType: "coding" });
    const sql = getPlayerMainClass({ focusMode: false, questionType: "sql" });
    expect(coding).toBe(mcq);
    expect(sql).toBe(mcq);
  });

  it("toggles the sidebar column purely off focus mode", () => {
    const withSidebar = getPlayerMainClass({ focusMode: false, questionType: "coding" });
    const focused = getPlayerMainClass({ focusMode: true, questionType: "coding" });
    expect(withSidebar).toContain("lg:grid-cols-[240px_1fr]");
    expect(focused).not.toContain("lg:grid-cols-[240px_1fr]");
    // Width stays identical — only the column track changes.
    expect(widthTokens(withSidebar)).toEqual(widthTokens(focused));
  });

  it("handles null/undefined questionType safely (initial load)", () => {
    const cls = getPlayerMainClass({ focusMode: false, questionType: null });
    expect(widthTokens(cls)).toEqual([FIXED_MAX_WIDTH]);
  });
});
