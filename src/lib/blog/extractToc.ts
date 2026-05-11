import GithubSlugger from "github-slugger";

export interface TocItem {
  depth: number;
  text: string;
  id: string;
}

/** Extract H2/H3/H4 headings from markdown, ignoring code fences. */
export function extractToc(md: string): TocItem[] {
  if (!md) return [];
  // Strip fenced code blocks so ``` # foo ``` doesn't become a heading.
  const stripped = md.replace(/```[\s\S]*?```/g, "").replace(/~~~[\s\S]*?~~~/g, "");
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  const re = /^(#{2,4})\s+(.+?)\s*#*\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped))) {
    const text = m[2].replace(/[*_`~]/g, "").trim();
    items.push({ depth: m[1].length, text, id: slugger.slug(text) });
  }
  return items;
}
