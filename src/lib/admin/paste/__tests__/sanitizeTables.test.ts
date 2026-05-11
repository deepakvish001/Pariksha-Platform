import { describe, it, expect } from "vitest";
import { sanitizeGfmTables } from "../sanitizeTables";

const lines = (s: string) => s.trim().split("\n");

describe("sanitizeGfmTables", () => {
  it("returns input unchanged when no tables are present", () => {
    const md = "Just a paragraph.\n\nAnother line.";
    const { markdown, report } = sanitizeGfmTables(md);
    expect(markdown).toBe(md);
    expect(report.tablesFound).toBe(0);
    expect(report.tablesNormalized).toBe(0);
    expect(report.diffs).toHaveLength(0);
  });

  it("adds a separator row when missing", () => {
    const md = `| Name | Age |\n| Ada | 36 |\n| Linus | 54 |`;
    const { markdown, report } = sanitizeGfmTables(md);
    expect(report.tablesNormalized).toBe(1);
    const kinds = report.issues.map((i) => i.kind);
    expect(kinds).toContain("missing-separator");
    expect(kinds).toContain("header-row-promoted");
    // Second line of cleaned output should be a separator row.
    expect(lines(markdown)[1]).toMatch(/^\|\s*-{3,}\s*\|\s*-{3,}\s*\|$/);
  });

  it("promotes the first row to a header when separator is misplaced", () => {
    const md = `| h1 | h2 |\n| body | row |\n| --- | --- |\n| more | data |`;
    const { markdown, report } = sanitizeGfmTables(md);
    const kinds = report.issues.map((i) => i.kind);
    expect(kinds).toContain("header-row-promoted");
    const out = lines(markdown);
    expect(out[0]).toMatch(/h1/);
    expect(out[1]).toMatch(/^\|\s*-{3,}\s*\|\s*-{3,}\s*\|$/);
    // The misplaced separator row should have been removed from the body.
    expect(out.filter((l) => /^\|\s*-{3,}/.test(l))).toHaveLength(1);
  });

  it("pads short rows and trims long rows on column-count mismatch", () => {
    const md = `| a | b | c |\n| --- | --- | --- |\n| 1 | 2 |\n| 4 | 5 | 6 | 7 |`;
    const { markdown, report } = sanitizeGfmTables(md);
    const kinds = report.issues.map((i) => i.kind);
    expect(kinds).toContain("column-count-mismatch");
    const out = lines(markdown);
    // Column count is normalized to the widest row across the table.
    const widestPipes = Math.max(...out.map((r) => (r.match(/\|/g) || []).length));
    for (const row of out) {
      expect((row.match(/\|/g) || []).length).toBe(widestPipes);
    }
  });

  it("normalizes alignment markers across columns", () => {
    const md = `| L | C | R |\n| :--- | :---: | ---: |\n| a | b | c |`;
    const { markdown } = sanitizeGfmTables(md);
    const sep = lines(markdown)[1];
    expect(sep).toContain(":---");
    expect(sep).toContain(":---:");
    expect(sep).toContain("---:");
    // Separator cells must be at least three dashes.
    for (const cell of sep.split("|").map((s) => s.trim()).filter(Boolean)) {
      expect(cell).toMatch(/^:?-{3,}:?$/);
    }
  });

  it("processes multiple adjacent tables and reports each separately", () => {
    const md = [
      `| a | b |`,
      `| 1 | 2 |`,
      ``,
      `| x | y | z |`,
      `| 9 | 8 |`,
    ].join("\n");
    const { markdown, report } = sanitizeGfmTables(md);
    expect(report.tablesFound).toBe(2);
    expect(report.tablesNormalized).toBe(2);
    expect(report.diffs).toHaveLength(2);
    // Diffs are returned in source order.
    expect(report.diffs[0].index).toBe(0);
    expect(report.diffs[1].index).toBe(1);
    // Each diff carries its own before/after slice.
    expect(report.diffs[0].before).toContain("a");
    expect(report.diffs[1].before).toContain("x");
    // Cleaned output contains two separator rows (one per table).
    const sepCount = markdown.split("\n").filter((l) => /^\|\s*-{3,}/.test(l)).length;
    expect(sepCount).toBe(2);
  });

  it("ignores pipe-like content inside fenced code blocks", () => {
    const md = "```\n| not | a | table |\n| 1 | 2 | 3 |\n```";
    const { report } = sanitizeGfmTables(md);
    expect(report.tablesFound).toBe(0);
  });
});
