import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Link } from "react-router-dom";
import { ExternalLink, Info, Lightbulb, AlertTriangle, OctagonAlert, Link2 } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { detectEmbed } from "@/lib/blog/embeds";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Props {
  source: string;
  className?: string;
}

const CALLOUTS = {
  note: {
    icon: Info,
    cls: "border-sky-500/40 bg-sky-500/10 dark:bg-sky-500/5 text-foreground",
    accentCls: "text-sky-700 dark:text-sky-300",
    label: "Note",
  },
  tip: {
    icon: Lightbulb,
    cls: "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/5 text-foreground",
    accentCls: "text-emerald-700 dark:text-emerald-300",
    label: "Tip",
  },
  warning: {
    icon: AlertTriangle,
    cls: "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/5 text-foreground",
    accentCls: "text-amber-700 dark:text-amber-300",
    label: "Warning",
  },
  danger: {
    icon: OctagonAlert,
    cls: "border-rose-500/40 bg-rose-500/10 dark:bg-rose-500/5 text-foreground",
    accentCls: "text-rose-700 dark:text-rose-300",
    label: "Danger",
  },
} as const;

type CalloutKind = keyof typeof CALLOUTS;

export const CALLOUT_REGEX =
  /^[\s\u00A0]*\[!(note|tip|warning|danger|important|caution)\][\s\u00A0]*\n?/i;

const KIND_MAP: Record<string, CalloutKind> = {
  note: "note",
  tip: "tip",
  important: "tip",
  warning: "warning",
  caution: "warning",
  danger: "danger",
};

/**
 * Walk children, find the first non-empty text leaf, try to match the callout
 * tag at its start, and (if matched) return new children with the tag stripped
 * — only from that exact leaf — plus any preceding empty text or `<br/>` nodes
 * removed.
 */
function parseCallout(children: any): { kind: CalloutKind; cleanChildren: any } | null {
  let result: { kind: CalloutKind } | null = null;

  const transform = (node: any): { node: any; consumed: boolean; drop: boolean } => {
    if (result) return { node, consumed: true, drop: false };

    if (typeof node === "string") {
      if (node.trim() === "") {
        // Skip leading whitespace-only text nodes.
        return { node, consumed: false, drop: true };
      }
      const m = node.match(CALLOUT_REGEX);
      if (m) {
        const kind = KIND_MAP[m[1].toLowerCase()] ?? "note";
        result = { kind };
        const stripped = node.slice(m[0].length);
        return { node: stripped, consumed: true, drop: stripped === "" };
      }
      return { node, consumed: true, drop: false };
    }

    if (node == null || node === false || node === true) {
      return { node, consumed: false, drop: true };
    }

    if (Array.isArray(node)) {
      const out: any[] = [];
      for (const child of node) {
        const r = transform(child);
        if (!r.drop) out.push(r.node);
        if (r.consumed) {
          // After we've consumed (or matched + stripped) the first text leaf,
          // append all remaining siblings unchanged.
          const idx = node.indexOf(child);
          for (let j = idx + 1; j < node.length; j++) out.push(node[j]);
          return { node: out, consumed: true, drop: false };
        }
      }
      return { node: out, consumed: false, drop: out.length === 0 };
    }

    // React element with children — recurse.
    const inner = node?.props?.children;
    if (inner === undefined) {
      // e.g. <br /> — drop if before any consumed text.
      const isLineBreak = node?.type === "br";
      return { node, consumed: false, drop: isLineBreak };
    }
    const r = transform(inner);
    if (r.consumed) {
      const newNode = { ...node, props: { ...node.props, children: r.node } };
      return { node: newNode, consumed: true, drop: false };
    }
    return { node, consumed: false, drop: r.drop };
  };

  const r = transform(children);
  if (!result) return null;
  return { kind: (result as { kind: CalloutKind }).kind, cleanChildren: r.node };
}

export function BlogContent({ source, className }: Props) {
  // Click-delegation: copy section URL when a heading anchor link is clicked.
  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const target = (e.target as HTMLElement).closest("a.heading-anchor") as HTMLAnchorElement | null;
    if (!target) return;
    e.preventDefault();
    const id = target.getAttribute("href")?.replace(/^#/, "") ?? "";
    if (!id) return;
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      navigator.clipboard?.writeText(url);
      toast({ title: "Section link copied" });
    } catch {
      /* noop */
    }
    const heading = document.getElementById(id);
    if (heading) {
      window.history.replaceState(null, "", `#${id}`);
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "prose prose-lg dark:prose-invert max-w-none",
        "prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight",
        "prose-h1:text-4xl prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border",
        "prose-h3:text-2xl prose-h3:mt-8 prose-h4:text-xl",
        "prose-p:leading-[1.8] prose-p:text-foreground/90",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary/60 prose-blockquote:bg-muted/40 prose-blockquote:rounded-r-md prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-foreground",
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:shadow-lg",
        "prose-hr:border-border",
        "prose-li:marker:text-primary/70",
        "[&_input[type=checkbox]]:accent-primary [&_input[type=checkbox]]:mr-2 [&_input[type=checkbox]]:scale-110",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "append",
              properties: {
                className: ["heading-anchor"],
                ariaLabel: "Copy link to section",
                title: "Copy link to section",
              },
              content: {
                type: "element",
                tagName: "span",
                properties: { className: ["heading-anchor-icon"], ariaHidden: "true" },
                children: [{ type: "text", value: "#" }],
              },
            },
          ],
        ]}
        components={{
          h2: ({ node, children, ...props }: any) => (
            <h2 {...props} className="group flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }: any) => (
            <h3 {...props} className="group flex items-center gap-2">
              {children}
            </h3>
          ),

          // Code (inline + fenced)
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match) {
              return (
                <CodeBlock language={match[1]}>
                  {String(children).replace(/\n$/, "")}
                </CodeBlock>
              );
            }
            return (
              <code
                className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] font-mono text-foreground ring-1 ring-border/60"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Paragraphs: detect a bare embed URL on its own line
          p({ node, children, ...props }: any) {
            const txt = String(
              Array.isArray(children)
                ? children.filter((c) => typeof c === "string").join("")
                : typeof children === "string"
                  ? children
                  : "",
            ).trim();
            if (txt && /^https?:\/\/\S+$/.test(txt)) {
              const embed = detectEmbed(txt);
              if (embed) {
                return (
                  <div
                    data-embed="true"
                    className={cn(
                      "not-prose my-6 overflow-hidden rounded-lg border border-border bg-muted",
                      embed.aspect,
                    )}
                  >
                    <iframe
                      src={embed.src}
                      title={embed.title}
                      loading="lazy"
                      allow={embed.allow}
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                );
              }
            }
            return <p {...props}>{children}</p>;
          },

          // Blockquote: detect GFM-style alerts `> [!note]`
          blockquote({ node, children, ...props }: any) {
            const parsed = parseCallout(children);
            if (parsed) {
              const c = CALLOUTS[parsed.kind];
              const Icon = c.icon;
              return (
                <div
                  role="note"
                  aria-label={`${c.label} callout`}
                  data-callout={parsed.kind}
                  className={cn("not-prose my-6 flex gap-3 rounded-lg border p-4", c.cls)}
                >
                  <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", c.accentCls)} aria-hidden />
                  <div className="flex-1 text-sm leading-relaxed [&>p]:m-0 [&>p+p]:mt-2">
                    <div className={cn("mb-1 font-semibold", c.accentCls)}>{c.label}</div>
                    {parsed.cleanChildren}
                  </div>
                </div>
              );
            }
            return <blockquote {...props}>{children}</blockquote>;
          },

          // Links: external open in new tab; internal use react-router
          a({ href, children, className: cls, ...props }: any) {
            const url = String(href || "");
            // Heading anchor links from rehype-autolink-headings keep their default rendering
            // so the click delegation above can intercept them.
            if (typeof cls === "string" && cls.includes("heading-anchor")) {
              return (
                <a href={url} className={cls} {...props}>
                  {children}
                </a>
              );
            }
            const isInternal = url.startsWith("/");
            const isAnchor = url.startsWith("#");
            if (isAnchor) {
              return <a href={url} {...props}>{children}</a>;
            }
            if (isInternal) {
              return (
                <Link to={url} className="text-primary underline-offset-4 hover:underline">
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline inline-flex items-center gap-0.5"
                {...props}
              >
                {children}
                <ExternalLink className="inline h-3 w-3 opacity-70" aria-hidden />
              </a>
            );
          },

          // Images: caption from title; width syntax `=480x320`
          img({ src, alt, title }: any) {
            let width: number | undefined;
            let height: number | undefined;
            let caption: string | undefined = title;
            const m = (title as string | undefined)?.match(/^=\s*(\d+)(?:\s*x\s*(\d+))?\s*(px)?$/i);
            if (m) {
              width = Number(m[1]);
              height = m[2] ? Number(m[2]) : undefined;
              caption = undefined;
            }
            return (
              <figure className="not-prose my-6">
                <img
                  src={src as string}
                  alt={alt || ""}
                  loading="lazy"
                  width={width}
                  height={height}
                  style={width ? { maxWidth: "100%", width } : undefined}
                  className="mx-auto rounded-lg border border-border shadow-lg"
                />
                {caption && (
                  <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          },

          // Tables: wrap for horizontal scroll on mobile
          table({ children, ...props }: any) {
            return (
              <div
                data-table-wrapper="true"
                className="not-prose my-6 overflow-x-auto rounded-lg border border-border"
              >
                <table className="w-full border-collapse text-sm text-foreground" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ children, ...props }: any) {
            return (
              <thead className="bg-muted text-foreground" {...props}>
                {children}
              </thead>
            );
          },
          th({ children, ...props }: any) {
            return (
              <th
                className="border-b border-border px-4 py-2 text-left font-semibold"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ children, ...props }: any) {
            return (
              <td className="border-b border-border/60 px-4 py-2 align-top" {...props}>
                {children}
              </td>
            );
          },
          tr({ children, ...props }: any) {
            return (
              <tr className="even:bg-muted/40" {...props}>
                {children}
              </tr>
            );
          },

          hr() {
            return (
              <div
                className="not-prose my-10 flex items-center justify-center gap-2 text-border"
                aria-hidden
              >
                <span className="h-px w-12 bg-border" />
                <Link2 className="h-4 w-4" />
                <span className="h-px w-12 bg-border" />
              </div>
            );
          },
        }}
      >
        {source || "_Nothing yet._"}
      </ReactMarkdown>
    </div>
  );
}
