import { describe, it, expect } from "vitest";
import { parseTabsPayload } from "../tabsPayload";

describe("parseTabsPayload", () => {
  it("parses a well-formed payload", () => {
    const p = parseTabsPayload(
      JSON.stringify({
        group: "install",
        variants: [
          { language: "TS", filename: "a.ts", highlightLines: [1, 2], code: "x" },
          { language: "js", code: "y" },
        ],
      }),
    );
    expect(p).not.toBeNull();
    expect(p!.group).toBe("install");
    expect(p!.variants).toHaveLength(2);
    expect(p!.variants[0].language).toBe("ts");
    expect(p!.variants[0].highlightLines).toEqual([1, 2]);
    expect(p!.variants[1].filename).toBeUndefined();
  });

  it("returns null for malformed JSON", () => {
    expect(parseTabsPayload("{not json")).toBeNull();
    expect(parseTabsPayload("")).toBeNull();
    expect(parseTabsPayload(null as unknown as string)).toBeNull();
  });

  it("returns null when variants is missing or empty", () => {
    expect(parseTabsPayload(JSON.stringify({ group: "x" }))).toBeNull();
    expect(
      parseTabsPayload(JSON.stringify({ group: "x", variants: [] })),
    ).toBeNull();
    expect(
      parseTabsPayload(JSON.stringify({ group: "x", variants: "nope" })),
    ).toBeNull();
  });

  it("drops invalid variants and keeps valid ones", () => {
    const p = parseTabsPayload(
      JSON.stringify({
        group: "g",
        variants: [
          { language: "" }, // invalid
          { code: "no lang" }, // invalid
          { language: "py", code: "ok" },
        ],
      }),
    );
    expect(p!.variants).toHaveLength(1);
    expect(p!.variants[0].language).toBe("py");
  });

  it("returns null when every variant is invalid", () => {
    const p = parseTabsPayload(
      JSON.stringify({ group: "g", variants: [{ language: "" }, { foo: 1 }] }),
    );
    expect(p).toBeNull();
  });

  it("sanitises highlight lines (non-numeric/negative dropped)", () => {
    const p = parseTabsPayload(
      JSON.stringify({
        variants: [
          {
            language: "ts",
            code: "x",
            highlightLines: [1, "2", -3, 4.7, NaN, null],
          },
        ],
      }),
    );
    expect(p!.variants[0].highlightLines).toEqual([1, 4]);
  });

  it("defaults missing group to '_'", () => {
    const p = parseTabsPayload(
      JSON.stringify({ variants: [{ language: "ts", code: "x" }] }),
    );
    expect(p!.group).toBe("_");
  });
});
