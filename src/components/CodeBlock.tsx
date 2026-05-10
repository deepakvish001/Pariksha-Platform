import { useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, ChevronsDown, ChevronsUp, Copy, Download, WrapText } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language?: string;
  /** Optional filename or title shown above the code (parsed from fence meta). */
  filename?: string;
  /** 1-based line numbers to highlight (parsed from `{1,3-5}` fence meta). */
  highlightLines?: number[];
  children: string;
  className?: string;
}

const LANG_TO_EXT: Record<string, string> = {
  ts: "ts", tsx: "tsx", js: "js", jsx: "jsx", json: "json", py: "py",
  python: "py", java: "java", c: "c", cpp: "cpp", rb: "rb", go: "go",
  rust: "rs", rs: "rs", sh: "sh", bash: "sh", zsh: "sh", html: "html",
  css: "css", scss: "scss", sql: "sql", yaml: "yml", yml: "yml", md: "md",
  diff: "diff", text: "txt",
};

export function CodeBlock({
  language,
  filename,
  highlightLines = [],
  children,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const lines = useMemo(() => children.split("\n"), [children]);
  const isLong = lines.length > 25;
  const [collapsed, setCollapsed] = useState(isLong);
  const visibleSrc = collapsed ? lines.slice(0, 18).join("\n") : children;
  const showLineNumbers = lines.length > 3;
  const highlightSet = useMemo(() => new Set(highlightLines), [highlightLines]);

  const baseStyle = isDark ? oneDark : oneLight;
  const style = useMemo(() => {
    const s: any = { ...baseStyle };
    // Patch background to a deeper black in dark mode for the "obsidian" look.
    s['pre[class*="language-"]'] = {
      ...(s['pre[class*="language-"]'] || {}),
      background: "transparent",
    };
    s['code[class*="language-"]'] = {
      ...(s['code[class*="language-"]'] || {}),
      background: "transparent",
    };
    return s;
  }, [baseStyle]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleDownload = () => {
    const ext = LANG_TO_EXT[(language || "text").toLowerCase()] || "txt";
    const name = filename || `snippet.${ext}`;
    const blob = new Blob([children], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const isDiff = (language || "").toLowerCase() === "diff";

  return (
    <div
      data-code-block
      className={cn(
        "not-prose relative my-5 rounded-xl overflow-hidden border",
        "border-border/80 shadow-sm",
        isDark
          ? "bg-[#0a0a0c] ring-1 ring-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_30px_-12px_rgba(0,0,0,0.6)]"
          : "bg-[#fafafa]",
        className,
      )}
    >
      {/* Header / chrome */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs",
          "border-b",
          isDark
            ? "border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent"
            : "border-border/70 bg-muted/40",
        )}
      >
        {/* macOS dots */}
        <div className="flex items-center gap-1.5 pr-1" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {language || "code"}
        </span>
        {filename && (
          <span className="ml-1 truncate font-mono text-[11px] text-foreground/80">
            {filename}
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={wrap ? "Disable word wrap" : "Enable word wrap"}
            title={wrap ? "Disable word wrap" : "Enable word wrap"}
            className="h-6 w-6 opacity-70 hover:opacity-100"
            onClick={() => setWrap((w) => !w)}
          >
            <WrapText className="h-3 w-3" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Download as file"
            title="Download as file"
            className="h-6 w-6 opacity-70 hover:opacity-100"
            onClick={handleDownload}
          >
            <Download className="h-3 w-3" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={copied ? "Copied" : "Copy code"}
            title={copied ? "Copied" : "Copy"}
            className="h-6 w-6 opacity-70 hover:opacity-100"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" aria-hidden />
            ) : (
              <Copy className="h-3 w-3" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Code copied to clipboard" : ""}
      </span>

      <div className={cn("relative", collapsed && "max-h-[420px] overflow-hidden")}>
        <SyntaxHighlighter
          language={(language || "text").toLowerCase()}
          style={style as any}
          showLineNumbers={showLineNumbers}
          wrapLines
          wrapLongLines={wrap}
          lineNumberStyle={{
            minWidth: "2.25em",
            paddingRight: "0.75em",
            opacity: 0.4,
            userSelect: "none",
          }}
          lineProps={(lineNumber: number) => {
            const highlighted = highlightSet.has(lineNumber);
            const lineText = lines[lineNumber - 1] || "";
            const diffPlus = isDiff && lineText.startsWith("+");
            const diffMinus = isDiff && lineText.startsWith("-");
            const styleObj: React.CSSProperties = {
              display: "block",
              padding: "0 0.75rem",
              borderLeft: "3px solid transparent",
              transition: "background-color 100ms ease",
            };
            if (highlighted) {
              styleObj.background = isDark
                ? "rgba(244, 114, 22, 0.08)"
                : "rgba(244, 114, 22, 0.10)";
              styleObj.borderLeftColor = "hsl(var(--primary))";
            } else if (diffPlus) {
              styleObj.background = "rgba(34,197,94,0.10)";
              styleObj.borderLeftColor = "rgb(34,197,94)";
            } else if (diffMinus) {
              styleObj.background = "rgba(239,68,68,0.10)";
              styleObj.borderLeftColor = "rgb(239,68,68)";
            }
            return { style: styleObj };
          }}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: "0.875rem",
            padding: "1rem 0.25rem",
            background: "transparent",
          }}
          codeTagProps={{
            style: { fontFamily: 'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace' },
          }}
        >
          {visibleSrc}
        </SyntaxHighlighter>

        {collapsed && (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-24",
              isDark
                ? "bg-gradient-to-t from-[#0a0a0c] to-transparent"
                : "bg-gradient-to-t from-[#fafafa] to-transparent",
            )}
            aria-hidden
          />
        )}
      </div>

      {isLong && (
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex w-full items-center justify-center gap-1 border-t py-1.5 text-xs font-medium transition-colors",
            isDark
              ? "border-white/5 bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {collapsed ? (
            <>
              <ChevronsDown className="h-3.5 w-3.5" /> Show all {lines.length} lines
            </>
          ) : (
            <>
              <ChevronsUp className="h-3.5 w-3.5" /> Collapse
            </>
          )}
        </button>
      )}
    </div>
  );
}
