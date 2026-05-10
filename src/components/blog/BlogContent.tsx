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

interface Props {
  source: string;
  className?: string;
}

const CALLOUTS = {
  note: { icon: Info, cls: "border-sky-500/40 bg-sky-500/5 text-sky-100", iconCls: "text-sky-400", label: "Note" },
  tip: { icon: Lightbulb, cls: "border-emerald-500/40 bg-emerald-500/5 text-emerald-100", iconCls: "text-emerald-400", label: "Tip" },
  warning: { icon: AlertTriangle, cls: "border-amber-500/40 bg-amber-500/5 text-amber-100", iconCls: "text-amber-400", label: "Warning" },
  danger: { icon: OctagonAlert, cls: "border-rose-500/40 bg-rose-500/5 text-rose-100", iconCls: "text-rose-400", label: "Danger" },
} as const;

type CalloutKind = keyof typeof CALLOUTS;

/** Recursively collect all text content from react children. */
function getAllText(node: any): string {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getAllText).join("");
  if (node?.props?.children !== undefined) return getAllText(node.props.children);
  return "";
}

export function BlogContent({ source, className }: Props) {
  return (
    <div
      className={cn(
        "prose prose-lg prose-invert max-w-none",
        "prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight",
        "prose-h1:text-4xl prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/40",
        "prose-h3:text-2xl prose-h3:mt-8 prose-h4:text-xl",
        "prose-p:leading-[1.8] prose-p:text-foreground/90",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary/60 prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-md prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic",
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-img:rounded-lg prose-img:border prose-img:border-border/60 prose-img:shadow-lg",
        "prose-hr:border-border/40",
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
                ariaLabel: "Link to section",
              },
              content: {
                type: "element",
                tagName: "span",
                properties: { className: ["heading-anchor-icon"] },
                children: [{ type: "text", value: "#" }],
              },
            },
          ],
        ]}
        components={{
          // Headings: anchor link styles handled via global CSS below
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
                className="rounded bg-muted/70 px-1.5 py-0.5 text-[0.9em] font-mono text-primary"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Paragraphs: detect a bare embed URL on its own line
          p({ node, children, ...props }: any) {
            const txt = getAllText(children).trim();
            if (txt && /^https?:\/\/\S+$/.test(txt)) {
              const embed = detectEmbed(txt);
              if (embed) {
                return (
                  <div className={cn("not-prose my-6 overflow-hidden rounded-lg border border-border/60 bg-black", embed.aspect)}>
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
            const text = getAllText(children).trim();
            const m = text.match(/^\[!(note|tip|warning|danger|important|caution)\]/i);
            if (m) {
              const raw = m[1].toLowerCase();
              const kindMap: Record<string, CalloutKind> = {
                note: "note", tip: "tip", important: "tip",
                warning: "warning", caution: "warning", danger: "danger",
              };
              const kind = kindMap[raw] ?? "note";
              const c = CALLOUTS[kind];
              const Icon = c.icon;
              // Strip the [!kind] tag from rendered children by re-emitting them with replacement
              const cleanChildren = stripFirstTextTag(children, m[0]);
              return (
                <div className={cn("not-prose my-6 flex gap-3 rounded-lg border p-4", c.cls)}>
                  <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", c.iconCls)} />
                  <div className="flex-1 text-sm leading-relaxed [&>p]:m-0 [&>p+p]:mt-2">
                    <div className={cn("mb-1 font-semibold", c.iconCls)}>{c.label}</div>
                    {cleanChildren}
                  </div>
                </div>
              );
            }
            return <blockquote {...props}>{children}</blockquote>;
          },

          // Links: external open in new tab; internal use react-router
          a({ href, children, ...props }: any) {
            const url = String(href || "");
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
                  className="mx-auto rounded-lg border border-border/60 shadow-lg"
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
              <div className="not-prose my-6 overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full border-collapse text-sm" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ children, ...props }: any) {
            return <thead className="bg-muted/50" {...props}>{children}</thead>;
          },
          th({ children, ...props }: any) {
            return (
              <th className="border-b border-border/60 px-4 py-2 text-left font-semibold" {...props}>
                {children}
              </th>
            );
          },
          td({ children, ...props }: any) {
            return (
              <td className="border-b border-border/40 px-4 py-2 align-top" {...props}>
                {children}
              </td>
            );
          },
          tr({ children, ...props }: any) {
            return <tr className="even:bg-muted/20" {...props}>{children}</tr>;
          },

          hr() {
            return (
              <div className="not-prose my-10 flex items-center justify-center gap-2 text-muted-foreground/50" aria-hidden>
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

/** Replace the first occurrence of `tag` in the rendered children's first text node. */
function stripFirstTextTag(children: any, tag: string): any {
  let done = false;
  const walk = (n: any): any => {
    if (done) return n;
    if (typeof n === "string") {
      if (n.includes(tag)) {
        done = true;
        return n.replace(tag, "");
      }
      return n;
    }
    if (Array.isArray(n)) return n.map(walk);
    if (n?.props?.children !== undefined) {
      const newChildren = walk(n.props.children);
      return { ...n, props: { ...n.props, children: newChildren } };
    }
    return n;
  };
  return walk(children);
}
