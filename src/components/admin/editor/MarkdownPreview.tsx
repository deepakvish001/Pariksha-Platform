import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface Props {
  source: string;
  className?: string;
}

/** Shared markdown renderer for problem statements & hints.
 *  Adds GFM (tables, task lists, strikethrough), code highlighting,
 *  and responsive image rendering. */
export const MarkdownPreview = ({ source, className }: Props) => {
  return (
    <div
      className={cn(
        "prose prose-sm prose-invert max-w-none break-words text-sm",
        // Force responsive images & nicer code blocks via the prose container
        "[&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-border/60",
        "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_table]:w-full",
        "[&_th]:border [&_th]:border-border [&_th]:bg-muted/30 [&_th]:px-2 [&_th]:py-1",
        "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  style={oneDark as any}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: 6,
                    fontSize: "0.8125rem",
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          img({ src, alt }) {
            return (
              <img
                src={src as string}
                alt={alt || ""}
                loading="lazy"
                className="my-2"
              />
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {source || "_Nothing yet._"}
      </ReactMarkdown>
    </div>
  );
};
