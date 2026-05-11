import { describe, it, expect } from "vitest";
import { mergeCodeTabs, TABS_LANG_TOKEN } from "../remarkCodeTabs";

const code = (lang: string, meta: string | null, value: string) => ({
  type: "code",
  lang,
  meta,
  value,
});

describe("remarkCodeTabs / mergeCodeTabs", () => {
  it("merges adjacent code nodes that share a group", () => {
    const out = mergeCodeTabs([
      code("ts", "tabs group=install filename=setup.ts", "// ts"),
      code("js", "tabs group=install filename=setup.js", "// js"),
      code("bash", "tabs group=install", "npm i x"),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].lang).toBe(TABS_LANG_TOKEN);
    const payload = JSON.parse(out[0].value!);
    expect(payload.group).toBe("install");
    expect(payload.variants.map((v: any) => v.language)).toEqual([
      "ts",
      "js",
      "bash",
    ]);
    expect(payload.variants[0].filename).toBe("setup.ts");
  });

  it("does not merge code blocks without a tabs flag", () => {
    const out = mergeCodeTabs([
      code("ts", null, "// a"),
      code("ts", null, "// b"),
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].lang).toBe("ts");
  });

  it("splits runs with different group ids", () => {
    const out = mergeCodeTabs([
      code("ts", "tabs group=a", "a-ts"),
      code("js", "tabs group=a", "a-js"),
      code("ts", "tabs group=b", "b-ts"),
      code("js", "tabs group=b", "b-js"),
    ]);
    expect(out).toHaveLength(2);
    expect(JSON.parse(out[0].value!).group).toBe("a");
    expect(JSON.parse(out[1].value!).group).toBe("b");
    expect(JSON.parse(out[0].value!).variants).toHaveLength(2);
    expect(JSON.parse(out[1].value!).variants).toHaveLength(2);
  });

  it("preserves highlight lines from {1,3-5} meta", () => {
    const out = mergeCodeTabs([
      code("ts", "tabs group=h {1,3-5}", "ts"),
      code("js", "tabs group=h {2}", "js"),
    ]);
    const payload = JSON.parse(out[0].value!);
    expect(payload.variants[0].highlightLines).toEqual([1, 3, 4, 5]);
    expect(payload.variants[1].highlightLines).toEqual([2]);
  });

  it("leaves non-code nodes untouched", () => {
    const para = { type: "paragraph", children: [] };
    const out = mergeCodeTabs([
      para as any,
      code("ts", "tabs group=x", "a"),
      code("js", "tabs group=x", "b"),
      para as any,
    ]);
    expect(out).toHaveLength(3);
    expect(out[0]).toBe(para);
    expect(out[1].lang).toBe(TABS_LANG_TOKEN);
    expect(out[2]).toBe(para);
  });
});
