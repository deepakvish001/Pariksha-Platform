import { describe, it, expect } from "vitest";
import { extractToc } from "../extractToc";

describe("extractToc", () => {
  it("returns empty for empty input", () => {
    expect(extractToc("")).toEqual([]);
  });

  it("parses H2, H3 and H4 and slugifies", () => {
    const md = `# Title
## First
### Sub one
#### Deep
## Second`;
    expect(extractToc(md)).toEqual([
      { depth: 2, text: "First", id: "first" },
      { depth: 3, text: "Sub one", id: "sub-one" },
      { depth: 4, text: "Deep", id: "deep" },
      { depth: 2, text: "Second", id: "second" },
    ]);
  });

  it("ignores headings inside fenced code blocks", () => {
    const md = `## Real
\`\`\`md
## Fake heading
\`\`\`
## Also real`;
    const toc = extractToc(md);
    expect(toc.map((t) => t.text)).toEqual(["Real", "Also real"]);
  });

  it("disambiguates duplicate slugs", () => {
    const md = `## Setup\n## Setup`;
    const toc = extractToc(md);
    expect(toc[0].id).toBe("setup");
    expect(toc[1].id).toBe("setup-1");
  });

  it("strips inline markdown markers from text", () => {
    const md = `## **Bold** and _italic_ and \`code\``;
    const toc = extractToc(md);
    expect(toc[0].text).toBe("Bold and italic and code");
  });
});
