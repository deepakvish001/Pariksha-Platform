import { describe, it, expect } from "vitest";
import { isAnswered } from "../isAnswered";
import type { PaperQuestion } from "../../hooks/usePaper";

const q = (type: PaperQuestion["type"]): PaperQuestion =>
  ({ id: "q1", type, title: "t", points: 1 } as unknown as PaperQuestion);

describe("isAnswered — subjective with uploaded answer-sheet pages", () => {
  it("returns false for an empty subjective answer", () => {
    expect(isAnswered(q("subjective"), undefined)).toBe(false);
    expect(isAnswered(q("subjective"), {})).toBe(false);
    expect(isAnswered(q("subjective"), { text: "   " })).toBe(false);
    expect(isAnswered(q("subjective"), { pages: [] })).toBe(false);
  });

  it("returns true when only typed text is present", () => {
    expect(isAnswered(q("subjective"), { text: "  hi  " })).toBe(true);
  });

  it("returns true when only phone-uploaded pages are present", () => {
    // Simulates a freshly-synced page list returned by AnswerUploadTile
    expect(
      isAnswered(q("subjective"), {
        pages: [
          { id: "p1", ordinal: 1, url: "https://x/y.jpg", storage_path: "answers/a/q/1.jpg", uploaded_at: "" },
        ],
      })
    ).toBe(true);
  });

  it("returns true when both text and pages are present", () => {
    expect(
      isAnswered(q("subjective"), {
        text: "see attached",
        pages: [{ id: "p1", ordinal: 1, url: null, storage_path: "", uploaded_at: "" }],
      })
    ).toBe(true);
  });

  it("ignores non-array pages payloads", () => {
    expect(isAnswered(q("subjective"), { pages: "nope" as unknown })).toBe(false);
    expect(isAnswered(q("subjective"), { pages: { 0: "x" } as unknown })).toBe(false);
  });
});

describe("isAnswered — other question types still work", () => {
  it("mcq requires at least one selected option", () => {
    expect(isAnswered(q("mcq"), { selected: [] })).toBe(false);
    expect(isAnswered(q("mcq"), { selected: ["a"] })).toBe(true);
  });
  it("coding requires non-empty code", () => {
    expect(isAnswered(q("coding"), { code: "" })).toBe(false);
    expect(isAnswered(q("coding"), { code: "print(1)" })).toBe(true);
  });
});
