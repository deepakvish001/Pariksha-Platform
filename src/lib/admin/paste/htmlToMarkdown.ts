import TurndownService from "turndown";
// @ts-ignore - no types shipped for the GFM plugin
import { gfm, tables, strikethrough, taskListItems } from "turndown-plugin-gfm";

let _service: TurndownService | null = null;

/** Pull alignment from `align` attribute or `text-align:` style. */
function alignOf(cell: Element): "left" | "right" | "center" | null {
  const a = (cell.getAttribute("align") || "").toLowerCase();
  if (a === "left" || a === "right" || a === "center") return a;
  const style = (cell.getAttribute("style") || "").toLowerCase();
  const m = style.match(/text-align\s*:\s*(left|right|center)/);
  return (m?.[1] as "left" | "right" | "center" | null) ?? null;
}

/** Render an HTMLTableElement as a clean GFM table with proper headers + alignment. */
function renderGfmTable(table: HTMLTableElement, td: TurndownService): string {
  const rows: HTMLTableRowElement[] = Array.from(table.querySelectorAll("tr"));
  if (!rows.length) return "";

  // Detect header row: an explicit <thead><tr>, otherwise the first row if every cell is a <th>.
  const theadRow = table.querySelector("thead tr") as HTMLTableRowElement | null;
  let headerRow: HTMLTableRowElement | null = theadRow;
  let bodyRows = rows;
  if (!headerRow) {
    const first = rows[0];
    const allTh = first && Array.from(first.children).every((c) => c.tagName === "TH");
    if (allTh) {
      headerRow = first;
      bodyRows = rows.slice(1);
    }
  } else {
    bodyRows = rows.filter((r) => r !== headerRow);
  }

  const cellsOf = (row: HTMLTableRowElement) =>
    Array.from(row.children).filter((c) => c.tagName === "TH" || c.tagName === "TD") as HTMLElement[];

  const headerCells = headerRow ? cellsOf(headerRow) : cellsOf(rows[0]).map(() => document.createElement("th"));
  const colCount = Math.max(
    headerCells.length,
    ...bodyRows.map((r) => cellsOf(r).length),
  );

  const cellToMd = (el: HTMLElement | undefined): string => {
    if (!el) return "";
    const md = td.turndown(el.innerHTML).replace(/\n+/g, " ").trim();
    return md.replace(/\|/g, "\\|");
  };

  const aligns: Array<"left" | "right" | "center" | null> = [];
  for (let i = 0; i < colCount; i++) {
    aligns.push(headerCells[i] ? alignOf(headerCells[i]) : null);
  }
  // If header didn't specify, fall back to the first body row's alignment.
  if (bodyRows[0]) {
    const firstCells = cellsOf(bodyRows[0]);
    for (let i = 0; i < colCount; i++) {
      if (!aligns[i] && firstCells[i]) aligns[i] = alignOf(firstCells[i]);
    }
  }

  const headerLine =
    "| " +
    Array.from({ length: colCount }, (_, i) => cellToMd(headerCells[i]) || " ").join(" | ") +
    " |";
  const sepLine =
    "| " +
    aligns
      .map((a) => {
        if (a === "center") return ":---:";
        if (a === "right") return "---:";
        if (a === "left") return ":---";
        return "---";
      })
      .join(" | ") +
    " |";
  const bodyLines = bodyRows.map((r) => {
    const cells = cellsOf(r);
    return (
      "| " +
      Array.from({ length: colCount }, (_, i) => cellToMd(cells[i]) || " ").join(" | ") +
      " |"
    );
  });

  return "\n\n" + [headerLine, sepLine, ...bodyLines].join("\n") + "\n\n";
}

function buildService(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    fence: "```",
    bulletListMarker: "-",
    emDelimiter: "*",
    strongDelimiter: "**",
    linkStyle: "inlined",
  });
  // GFM strikethrough + task lists, but skip the bundled tables rule —
  // we use our stricter custom one below.
  td.use(strikethrough);
  td.use(taskListItems);
  void gfm;
  void tables;

  // Preserve raw HTML for inline semantic tags the renderer supports.
  td.keep(["kbd", "mark", "sub", "sup", "ins", "abbr", "u"]);

  // Strip script/style/meta noise.
  td.remove(["script", "style", "noscript", "meta", "link", "head"]);

  // GFM table with header detection + alignment.
  td.addRule("gfmTable", {
    filter: (node) => node.nodeName === "TABLE",
    replacement: (_c, node) => {
      try {
        return renderGfmTable(node as HTMLTableElement, td);
      } catch {
        return "";
      }
    },
  });

  // Code blocks with detected language.
  td.addRule("fencedCodeWithLang", {
    filter: (node) =>
      node.nodeName === "PRE" &&
      !!node.firstChild &&
      node.firstChild.nodeName === "CODE",
    replacement: (_content, node) => {
      const code = (node as HTMLElement).querySelector("code");
      const text = code?.textContent ?? "";
      const cls = code?.getAttribute("class") ?? "";
      const dataLang =
        code?.getAttribute("data-lang") ??
        (node as HTMLElement).getAttribute("data-lang") ??
        "";
      const langMatch = cls.match(/language-([\w-]+)/i) || cls.match(/lang-([\w-]+)/i);
      const lang = (langMatch?.[1] || dataLang || "").toLowerCase();
      const trimmed = text.replace(/\n+$/, "");
      return "\n\n```" + lang + "\n" + trimmed + "\n```\n\n";
    },
  });

  // Notion / Medium callouts → GFM admonitions.
  td.addRule("calloutBlock", {
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (node.nodeName === "ASIDE") return true;
      const cls = (node.getAttribute("class") || "").toLowerCase();
      return (
        node.nodeName === "DIV" &&
        /(callout|admonition|notion-callout|note-block|alert)/.test(cls)
      );
    },
    replacement: (_c, node) => {
      const el = node as HTMLElement;
      const cls = (el.getAttribute("class") || "").toLowerCase();
      let kind: "note" | "tip" | "warning" | "danger" | "info" = "note";
      if (/(warn|caution)/.test(cls)) kind = "warning";
      else if (/(danger|error|destructive)/.test(cls)) kind = "danger";
      else if (/tip|success/.test(cls)) kind = "tip";
      else if (/info/.test(cls)) kind = "info";

      const inner = td.turndown(el.innerHTML);
      const lines = String(inner).trim().split("\n");
      const quoted = lines.map((l) => "> " + l).join("\n");
      return "\n\n> [!" + kind + "]\n" + quoted + "\n\n";
    },
  });

  // Notion toggle blocks (collapsible) → collapsible admonition.
  td.addRule("notionToggle", {
    filter: (node) => node.nodeName === "DETAILS",
    replacement: (_c, node) => {
      const el = node as HTMLElement;
      const summary = el.querySelector("summary")?.textContent?.trim() || "Details";
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelector("summary")?.remove();
      const inner = td.turndown(clone.innerHTML);
      const lines = String(inner).trim().split("\n");
      const quoted = lines.map((l) => "> " + l).join("\n");
      return "\n\n> [!note]- " + summary + "\n" + quoted + "\n\n";
    },
  });

  // <figure><img><figcaption> → ![alt](src "caption") — caption falls back as alt.
  td.addRule("figureWithCaption", {
    filter: (node) => node.nodeName === "FIGURE",
    replacement: (_c, node) => {
      const el = node as HTMLElement;
      const img = el.querySelector("img");
      if (!img) return "";
      const src = img.getAttribute("src") || "";
      if (!src) return "";
      const figcap = el.querySelector("figcaption")?.textContent?.trim();
      const altRaw = (img.getAttribute("alt") || "").trim();
      const ariaLabel = (img.getAttribute("aria-label") || "").trim();
      const titleAttr = (img.getAttribute("title") || "").trim();
      // Auto-fill alt: explicit alt > aria-label > title > figcaption > filename.
      const alt =
        altRaw ||
        ariaLabel ||
        titleAttr ||
        figcap ||
        decodeURIComponent(src.split("/").pop() || "").replace(/\.[^.]+$/, "");
      const caption = figcap && figcap !== alt ? figcap : undefined;
      const title = caption ? ` "${caption.replace(/"/g, '\\"')}"` : "";
      return `\n\n![${alt}](${src}${title})\n\n`;
    },
  });

  // Bare <img>: enrich alt from sibling/adjacent caption text or filename.
  td.addRule("imgWithSmartAlt", {
    filter: (node) => {
      if (node.nodeName !== "IMG") return false;
      // Skip when wrapped in <figure>; the figure rule handles it.
      return !(node as HTMLElement).closest("figure");
    },
    replacement: (_c, node) => {
      const el = node as HTMLImageElement;
      const src = el.getAttribute("src") || "";
      if (!src) return "";
      const altRaw = (el.getAttribute("alt") || "").trim();
      const ariaLabel = (el.getAttribute("aria-label") || "").trim();
      const titleAttr = (el.getAttribute("title") || "").trim();
      // Notion often places caption text in an adjacent <div class="..caption..">.
      let neighborCap = "";
      const next = el.parentElement?.nextElementSibling as HTMLElement | null;
      if (next && /caption/i.test(next.getAttribute("class") || "")) {
        neighborCap = (next.textContent || "").trim();
      }
      const filenameAlt = decodeURIComponent(src.split("/").pop() || "")
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ");
      const alt = altRaw || ariaLabel || titleAttr || neighborCap || filenameAlt;
      const title = titleAttr && titleAttr !== alt ? ` "${titleAttr.replace(/"/g, '\\"')}"` : "";
      return `![${alt}](${src}${title})`;
    },
  });

  return td;
}

function getService(): TurndownService {
  if (!_service) _service = buildService();
  return _service;
}

/** Convert an HTML string (from clipboard) into clean Markdown. */
export function htmlToMarkdown(html: string): string {
  if (!html) return "";
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<o:p>[\s\S]*?<\/o:p>/g, "")
    .replace(/<\/?(html|body)[^>]*>/gi, "");
  return getService().turndown(cleaned);
}

/** Heuristic: does the HTML look richer than its plain-text equivalent? */
export function isRichHtml(html: string, plain: string): boolean {
  if (!html || !html.trim()) return false;
  const meaningful =
    /<(h[1-6]|pre|code|table|ul|ol|li|blockquote|figure|img|a|strong|em|b|i|hr|br)[\s>]/i;
  if (!meaningful.test(html)) return false;
  const stripped = html.replace(/<[^>]+>/g, "").trim();
  if (stripped.length < 4) return false;
  if (plain && stripped === plain.trim() && !meaningful.test(html)) return false;
  return true;
}
