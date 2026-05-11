import { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import remarkDeflist from "remark-deflist";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import "katex/dist/katex.min.css";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Info,
  Lightbulb,
  AlertTriangle,
  OctagonAlert,
  Link2,
  CircleCheck,
  CircleHelp,
  Quote as QuoteIcon,
  ChevronRight,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import remarkCodeTabs, { TABS_LANG_TOKEN, type CodeTabsPayload } from "@/lib/blog/remarkCodeTabs";
import { Mermaid } from "@/components/blog/Mermaid";
import { ImageLightbox } from "@/components/blog/ImageLightbox";
import { detectEmbed } from "@/lib/blog/embeds";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Props {
  source: string;
  className?: string;
}

const CALLOUTS = {
  note: { icon: Info, accent: "sky", label: "Note" },
  info: { icon: Info, accent: "sky", label: "Info" },
  tip: { icon: Lightbulb, accent: "emerald", label: "Tip" },
  success: { icon: CircleCheck, accent: "emerald", label: "Success" },
  warning: { icon: AlertTriangle, accent: "amber", label: "Warning" },
  danger: { icon: OctagonAlert, accent: "rose", label: "Danger" },
  question: { icon: CircleHelp, accent: "violet", label: "Question" },
  quote: { icon: QuoteIcon, accent: "muted", label: "Quote" },
} as const;

type CalloutKind = keyof typeof CALLOUTS;

const ACCENT_CLS: Record<string, { box: string; accent: string }> = {
  sky: {
    box: "border-sky-500/40 bg-sky-500/10 dark:bg-sky-500/[0.06]",
    accent: "text-sky-700 dark:text-sky-300",
  },
  emerald: {
    box: "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/[0.06]",
    accent: "text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    box: "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/[0.06]",
    accent: "text-amber-700 dark:text-amber-300",
  },
  rose: {
    box: "border-rose-500/40 bg-rose-500/10 dark:bg-rose-500/[0.06]",
    accent: "text-rose-700 dark:text-rose-300",
  },
  violet: {
    box: "border-violet-500/40 bg-violet-500/10 dark:bg-violet-500/[0.06]",
    accent: "text-violet-700 dark:text-violet-300",
  },
  muted: {
    box: "border-border bg-muted/40",
    accent: "text-muted-foreground",
  },
};

// Accept all kinds + GFM aliases (important/caution).
export const CALLOUT_REGEX =
  /^[\s\u00A0]*\[!(note|info|tip|success|warning|danger|important|caution|question|quote)\]([+-])?[ \t]*([^\n]*)\n?/i;

const KIND_MAP: Record<string, CalloutKind> = {
  note: "note",
  info: "info",
  tip: "tip",
  success: "success",
  important: "tip",
  warning: "warning",
  caution: "warning",
  danger: "danger",
  question: "question",
  quote: "quote",
};

interface CalloutMatch {
  kind: CalloutKind;
  collapsible: boolean;
  defaultOpen: boolean;
  title: string | null;
}

function parseCallout(
  children: any,
): { match: CalloutMatch; cleanChildren: any } | null {
  let result: CalloutMatch | null = null;

  const transform = (node: any): { node: any; consumed: boolean; drop: boolean } => {
    if (result) return { node, consumed: true, drop: false };

    if (typeof node === "string") {
      if (node.trim() === "") return { node, consumed: false, drop: true };
      const m = node.match(CALLOUT_REGEX);
      if (m) {
        const kind = KIND_MAP[m[1].toLowerCase()] ?? "note";
        const marker = m[2] || "";
        const titleRaw = (m[3] || "").trim();
        result = {
          kind,
          collapsible: marker === "+" || marker === "-",
          defaultOpen: marker !== "-",
          title: titleRaw || null,
        };
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
      for (let i = 0; i < node.length; i++) {
        const r = transform(node[i]);
        if (!r.drop) out.push(r.node);
        if (r.consumed) {
          for (let j = i + 1; j < node.length; j++) out.push(node[j]);
          return { node: out, consumed: true, drop: false };
        }
      }
      return { node: out, consumed: false, drop: out.length === 0 };
    }

    const inner = node?.props?.children;
    if (inner === undefined) {
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
  return { match: result, cleanChildren: r.node };
}

/** Parse `title="..."` and `{1,3-5}` from a fenced code-block meta string. */
function parseCodeMeta(meta: string | undefined | null): {
  filename?: string;
  highlightLines: number[];
} {
  if (!meta) return { highlightLines: [] };
  let filename: string | undefined;
  const titleMatch = meta.match(/title\s*=\s*"([^"]+)"/);
  if (titleMatch) filename = titleMatch[1];
  const hlMatch = meta.match(/\{([\d,\s\-]+)\}/);
  const highlightLines: number[] = [];
  if (hlMatch) {
    for (const part of hlMatch[1].split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const range = trimmed.split("-").map((n) => parseInt(n, 10));
      if (range.length === 1 && Number.isFinite(range[0])) highlightLines.push(range[0]);
      else if (range.length === 2 && Number.isFinite(range[0]) && Number.isFinite(range[1])) {
        for (let i = range[0]; i <= range[1]; i++) highlightLines.push(i);
      }
    }
  }
  return { filename, highlightLines };
}

function CalloutBlock({
  match,
  children,
}: {
  match: CalloutMatch;
  children: React.ReactNode;
}) {
  const c = CALLOUTS[match.kind];
  const Icon = c.icon;
  const cls = ACCENT_CLS[c.accent];
  const [open, setOpen] = useState(match.defaultOpen);

  const headerTitle = match.title || c.label;
  const body = (
    <div className="flex-1 text-sm leading-relaxed [&>p]:m-0 [&>p+p]:mt-2">
      {!match.collapsible && (
        <div className={cn("mb-1 font-semibold", cls.accent)}>{headerTitle}</div>
      )}
      {open && children}
    </div>
  );

  return (
    <div
      role="note"
      aria-label={`${c.label} callout`}
      data-callout={match.kind}
      className={cn("not-prose my-6 flex gap-3 rounded-lg border p-4", cls.box)}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", cls.accent)} aria-hidden />
      {match.collapsible ? (
        <div className="flex-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={cn(
              "flex w-full items-center gap-1.5 text-left font-semibold",
              cls.accent,
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
            )}
          >
            <ChevronRight
              className={cn("h-4 w-4 transition-transform", open && "rotate-90")}
              aria-hidden
            />
            {headerTitle}
          </button>
          {open && <div className="mt-2 text-sm leading-relaxed [&>p]:m-0 [&>p+p]:mt-2">{children}</div>}
        </div>
      ) : (
        body
      )}
    </div>
  );
}

export function BlogContent({ source, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<{ images: { src: string; alt?: string }[]; index: number } | null>(null);

  // Click delegation: heading anchor copy, image lightbox open
  const handleClick = useCallback<React.MouseEventHandler<HTMLDivElement>>((e) => {
    const target = e.target as HTMLElement;

    const anchor = target.closest("a.heading-anchor") as HTMLAnchorElement | null;
    if (anchor) {
      e.preventDefault();
      const id = anchor.getAttribute("href")?.replace(/^#/, "") ?? "";
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
      return;
    }

    if (target.tagName === "IMG" && containerRef.current) {
      const all = Array.from(containerRef.current.querySelectorAll("img")) as HTMLImageElement[];
      const list = all
        .filter((img) => !img.closest("[data-no-lightbox]"))
        .map((img) => ({ src: img.currentSrc || img.src, alt: img.alt }));
      const idx = list.findIndex((i) => i.src === ((target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src));
      if (idx >= 0) {
        e.preventDefault();
        setLightbox({ images: list, index: idx });
      }
    }
  }, []);

  const components = useMemo(
    () => ({
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

      code({ inline, className, children, node, ...props }: any) {
        const match = /language-(\w+|__tabs__)/.exec(className || "");
        if (!inline && match) {
          const lang = match[1].toLowerCase();
          const raw = String(children).replace(/\n$/, "");
          if (lang === TABS_LANG_TOKEN.toLowerCase() || lang === "__tabs__") {
            try {
              const payload: CodeTabsPayload = JSON.parse(raw);
              return (
                <CodeBlock
                  group={payload.group}
                  variants={payload.variants.map((v) => ({
                    language: v.language,
                    filename: v.filename,
                    highlightLines: v.highlightLines,
                    code: v.code,
                  }))}
                />
              );
            } catch {
              /* fall through to plain code */
            }
          }
          if (lang === "mermaid") {
            return <Mermaid chart={raw} />;
          }
          const meta = parseCodeMeta(node?.data?.meta);
          return (
            <CodeBlock
              language={lang}
              filename={meta.filename}
              highlightLines={meta.highlightLines}
            >
              {raw}
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

      kbd({ children, ...props }: any) {
        return (
          <kbd
            {...props}
            className="inline-flex items-center rounded-md border border-border bg-muted/80 px-1.5 py-0.5 text-[0.78em] font-mono font-semibold text-foreground shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]"
          >
            {children}
          </kbd>
        );
      },

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
            const wrapperStyle = embed.height ? { height: embed.height } : undefined;
            return (
              <div
                data-embed="true"
                data-no-lightbox
                className={cn(
                  "not-prose my-6 overflow-hidden rounded-lg border border-border bg-muted",
                  embed.aspect,
                )}
                style={wrapperStyle}
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

      blockquote({ node, children, ...props }: any) {
        const parsed = parseCallout(children);
        if (parsed) {
          return <CalloutBlock match={parsed.match}>{parsed.cleanChildren}</CalloutBlock>;
        }
        return <blockquote {...props}>{children}</blockquote>;
      },

      a({ href, children, className: cls, ...props }: any) {
        const url = String(href || "");
        if (typeof cls === "string" && cls.includes("heading-anchor")) {
          return (
            <a href={url} className={cls} {...props}>
              {children}
            </a>
          );
        }
        const isInternal = url.startsWith("/");
        const isAnchor = url.startsWith("#");
        if (isAnchor) return <a href={url} {...props}>{children}</a>;
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
              className="mx-auto rounded-lg border border-border shadow-lg cursor-zoom-in transition-transform hover:scale-[1.005]"
            />
            {caption && (
              <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">
                {caption}
              </figcaption>
            )}
          </figure>
        );
      },

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
          <th className="border-b border-border px-4 py-2 text-left font-semibold" {...props}>
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
    }),
    [],
  );

  return (
    <>
      <div
        ref={containerRef}
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
          "[&_dl]:my-4 [&_dt]:font-semibold [&_dt]:mt-3 [&_dd]:ml-6 [&_dd]:text-foreground/80",
          className,
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks, remarkMath, remarkDeflist, remarkCodeTabs]}
          rehypePlugins={[
            rehypeSlug,
            [rehypeKatex, { strict: "ignore" }],
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
          components={components as any}
        >
          {source || "_Nothing yet._"}
        </ReactMarkdown>
      </div>
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onIndex={(i) => setLightbox((s) => (s ? { ...s, index: i } : s))}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
