/**
 * remark-code-tabs
 * ----------------
 * Merges adjacent fenced code blocks that share a `tabs group=<id>` directive
 * into a single synthetic code node whose language is `__tabs__` and whose
 * value is a JSON-encoded `{ variants: [...] }` payload.
 *
 * Authoring example:
 *
 *     ```ts tabs group=install filename=setup.ts
 *     // typescript variant
 *     ```
 *
 *     ```js tabs group=install filename=setup.js
 *     // javascript variant
 *     ```
 *
 * The downstream `code` renderer detects `language-__tabs__`, parses the JSON
 * and renders the upgraded <CodeBlock variants={...} group="install" />.
 *
 * Blocks without `tabs` in their meta are left untouched, so existing posts
 * keep working.
 */

export interface CodeTabVariant {
  language: string;
  filename?: string;
  highlightLines: number[];
  code: string;
}

export interface CodeTabsPayload {
  group: string;
  variants: CodeTabVariant[];
}

export const TABS_LANG_TOKEN = "__tabs__";

function parseMeta(meta: string | null | undefined): {
  isTab: boolean;
  group: string | null;
  filename?: string;
  highlightLines: number[];
} {
  if (!meta) return { isTab: false, group: null, highlightLines: [] };
  const isTab = /\btabs\b/.test(meta);
  let group: string | null = null;
  const g = meta.match(/\bgroup\s*=\s*"?([\w.-]+)"?/);
  if (g) group = g[1];
  let filename: string | undefined;
  const t = meta.match(/\b(?:title|filename)\s*=\s*"([^"]+)"/);
  if (t) filename = t[1];
  else {
    const t2 = meta.match(/\b(?:title|filename)\s*=\s*([\w./-]+)/);
    if (t2) filename = t2[1];
  }
  const hlMatch = meta.match(/\{([\d,\s\-]+)\}/);
  const highlightLines: number[] = [];
  if (hlMatch) {
    for (const part of hlMatch[1].split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const range = trimmed.split("-").map((n) => parseInt(n, 10));
      if (range.length === 1 && Number.isFinite(range[0])) {
        highlightLines.push(range[0]);
      } else if (
        range.length === 2 &&
        Number.isFinite(range[0]) &&
        Number.isFinite(range[1])
      ) {
        for (let i = range[0]; i <= range[1]; i++) highlightLines.push(i);
      }
    }
  }
  return { isTab, group, filename, highlightLines };
}

interface MdNode {
  type: string;
  lang?: string | null;
  meta?: string | null;
  value?: string;
  children?: MdNode[];
  data?: Record<string, unknown>;
}

/**
 * Walks an MDAST root and collapses runs of adjacent tab-flagged code nodes.
 * Exposed separately so it can be unit-tested without booting the full
 * remark pipeline.
 */
export function mergeCodeTabs(children: MdNode[]): MdNode[] {
  const out: MdNode[] = [];
  let i = 0;
  while (i < children.length) {
    const node = children[i];
    if (node.type !== "code") {
      out.push(node);
      i++;
      continue;
    }
    const meta = parseMeta(node.meta);
    if (!meta.isTab) {
      out.push(node);
      i++;
      continue;
    }
    // Collect run of consecutive code nodes with same group (or no group → "_")
    const groupId = meta.group ?? "_";
    const variants: CodeTabVariant[] = [
      {
        language: (node.lang || "text").toLowerCase(),
        filename: meta.filename,
        highlightLines: meta.highlightLines,
        code: node.value ?? "",
      },
    ];
    let j = i + 1;
    while (j < children.length && children[j].type === "code") {
      const m = parseMeta(children[j].meta);
      if (!m.isTab) break;
      if ((m.group ?? "_") !== groupId) break;
      variants.push({
        language: (children[j].lang || "text").toLowerCase(),
        filename: m.filename,
        highlightLines: m.highlightLines,
        code: children[j].value ?? "",
      });
      j++;
    }
    if (variants.length === 1) {
      // Single tabbed block — still emit as tabs node so the renderer shows
      // the language pill consistently.
    }
    const payload: CodeTabsPayload = { group: groupId, variants };
    out.push({
      type: "code",
      lang: TABS_LANG_TOKEN,
      meta: null,
      value: JSON.stringify(payload),
    });
    i = j;
  }
  return out;
}

export default function remarkCodeTabs() {
  return (tree: MdNode) => {
    if (!tree || !Array.isArray(tree.children)) return;
    tree.children = mergeCodeTabs(tree.children);
  };
}
