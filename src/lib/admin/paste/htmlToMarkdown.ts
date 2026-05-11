import TurndownService from "turndown";
// @ts-ignore - no types shipped for the GFM plugin
import { gfm } from "turndown-plugin-gfm";

let _service: TurndownService | null = null;

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
  td.use(gfm);

  // Preserve raw HTML for inline semantic tags the renderer supports.
  td.keep(["kbd", "mark", "sub", "sup", "ins", "abbr", "u"]);

  // Strip script/style/meta noise.
  td.remove(["script", "style", "noscript", "meta", "link", "head"]);

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
    replacement: (_c, node, options) => {
      const el = node as HTMLElement;
      const cls = (el.getAttribute("class") || "").toLowerCase();
      let kind: "note" | "tip" | "warning" | "danger" | "info" = "note";
      if (/(warn|caution)/.test(cls)) kind = "warning";
      else if (/(danger|error|destructive)/.test(cls)) kind = "danger";
      else if (/tip|success/.test(cls)) kind = "tip";
      else if (/info/.test(cls)) kind = "info";

      const inner = (options as any).turndown
        ? (options as any).turndown(el.innerHTML)
        : el.textContent || "";
      const lines = String(inner).trim().split("\n");
      const quoted = lines.map((l) => "> " + l).join("\n");
      return "\n\n> [!" + kind + "]\n" + quoted + "\n\n";
    },
  });

  // Notion toggle blocks (collapsible) → collapsible admonition.
  td.addRule("notionToggle", {
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (node.nodeName !== "DETAILS") return false;
      return true;
    },
    replacement: (_c, node, options) => {
      const el = node as HTMLElement;
      const summary = el.querySelector("summary")?.textContent?.trim() || "Details";
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelector("summary")?.remove();
      const inner = (options as any).turndown
        ? (options as any).turndown(clone.innerHTML)
        : clone.textContent || "";
      const lines = String(inner).trim().split("\n");
      const quoted = lines.map((l) => "> " + l).join("\n");
      return "\n\n> [!note]- " + summary + "\n" + quoted + "\n\n";
    },
  });

  // <figure><img><figcaption> → ![alt](src "caption")
  td.addRule("figureWithCaption", {
    filter: (node) => node.nodeName === "FIGURE",
    replacement: (_c, node) => {
      const el = node as HTMLElement;
      const img = el.querySelector("img");
      if (!img) return "";
      const alt = img.getAttribute("alt") || "";
      const src = img.getAttribute("src") || "";
      const caption = el.querySelector("figcaption")?.textContent?.trim();
      if (!src) return "";
      const title = caption ? ` "${caption.replace(/"/g, '\\"')}"` : "";
      return `\n\n![${alt}](${src}${title})\n\n`;
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
  // Strip Word/Office wrappers and Google Docs internal markers.
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<o:p>[\s\S]*?<\/o:p>/g, "")
    .replace(/<\/?(html|body)[^>]*>/gi, "");
  return getService().turndown(cleaned);
}

/** Heuristic: does the HTML look richer than its plain-text equivalent? */
export function isRichHtml(html: string, plain: string): boolean {
  if (!html || !html.trim()) return false;
  // Browsers sometimes wrap plain text in a single <span>/<p> — skip those.
  const meaningful = /<(h[1-6]|pre|code|table|ul|ol|li|blockquote|figure|img|a|strong|em|b|i|hr|br)[\s>]/i;
  if (!meaningful.test(html)) return false;
  // Avoid over-eager conversion of trivial single-line HTML.
  const stripped = html.replace(/<[^>]+>/g, "").trim();
  if (stripped.length < 4) return false;
  if (plain && stripped === plain.trim() && !meaningful.test(html)) return false;
  return true;
}
