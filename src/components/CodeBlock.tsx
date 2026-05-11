import { useEffect, useId, useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Check,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Download,
  WrapText,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { obsidianDarkTheme } from "@/components/codeblock/obsidianTheme";
import { detectLanguage } from "@/lib/blog/detectLang";

const PREFERRED_LANG_KEY = "codeblock:preferred-lang";

export interface CodeVariant {
  language: string;
  filename?: string;
  highlightLines?: number[];
  code: string;
}

interface CodeBlockProps {
  /** Single-block API (back-compat). */
  language?: string;
  filename?: string;
  highlightLines?: number[];
  children?: string;
  className?: string;
  /** Multi-language tabs API. When provided, a tab strip is rendered. */
  variants?: CodeVariant[];
  /** Stable id used to persist the active tab in localStorage. */
  group?: string;
  /** Initial tab — language id (e.g. "ts"). Falls back to first variant. */
  defaultTab?: string;
}

const LANG_TO_EXT: Record<string, string> = {
  ts: "ts", tsx: "tsx", js: "js", jsx: "jsx", json: "json", py: "py",
  python: "py", java: "java", c: "c", cpp: "cpp", rb: "rb", go: "go",
  rust: "rs", rs: "rs", sh: "sh", bash: "sh", zsh: "sh", html: "html",
  css: "css", scss: "scss", sql: "sql", yaml: "yml", yml: "yml", md: "md",
  diff: "diff", text: "txt",
};

const LANG_LABELS: Record<string, string> = {
  ts: "TypeScript", tsx: "TSX", js: "JavaScript", jsx: "JSX",
  py: "Python", python: "Python", sh: "Shell", bash: "Bash", zsh: "Zsh",
  json: "JSON", html: "HTML", css: "CSS", sql: "SQL", yaml: "YAML",
  yml: "YAML", md: "Markdown", diff: "Diff", rust: "Rust", rs: "Rust",
  go: "Go", java: "Java", c: "C", cpp: "C++", rb: "Ruby",
};

// Short, badge-friendly tab labels (e.g. CPP, JS, PY).
const SHORT_LANG_LABELS: Record<string, string> = {
  ts: "TS", tsx: "TSX", js: "JS", jsx: "JSX",
  py: "Python", python: "Python",
  sh: "Shell", bash: "Bash", zsh: "Zsh",
  json: "JSON", html: "HTML", css: "CSS", scss: "SCSS",
  sql: "SQL", yaml: "YAML", yml: "YAML", md: "MD", diff: "Diff",
  rust: "Rust", rs: "Rust", go: "Go",
  java: "Java", kotlin: "Kotlin", kt: "Kotlin", swift: "Swift",
  c: "C", cpp: "CPP", "c++": "CPP", cxx: "CPP",
  cs: "C#", csharp: "C#", "c#": "C#",
  rb: "Ruby", ruby: "Ruby", php: "PHP",
  dart: "Dart", scala: "Scala", r: "R", lua: "Lua",
  dockerfile: "Docker", docker: "Docker",
  makefile: "Make", make: "Make",
  toml: "TOML", ini: "INI", nginx: "Nginx", graphql: "GraphQL",
  xml: "XML", powershell: "PS", ps1: "PS",
  text: "Text", txt: "Text", plaintext: "Text",
};

const labelFor = (lang: string) =>
  LANG_LABELS[lang.toLowerCase()] || lang.toUpperCase();

const shortLabelFor = (lang: string) =>
  SHORT_LANG_LABELS[lang.toLowerCase()] || lang.toUpperCase();

export function CodeBlock(props: CodeBlockProps) {
  const {
    language,
    filename,
    highlightLines = [],
    children,
    className,
    variants: variantsProp,
    group,
    defaultTab,
  } = props;

  // Normalise single-block usage into a one-element variants array, and
  // auto-detect missing/`text` languages from the snippet body. We also
  // preserve a `detected` flag so the UI can surface an "Auto" badge.
  const variants: (CodeVariant & { detected?: boolean })[] = useMemo(() => {
    const raw =
      variantsProp && variantsProp.length > 0
        ? variantsProp
        : [
            {
              language: language || "",
              filename,
              highlightLines,
              code: children ?? "",
            },
          ];
    return raw.map((v) => {
      const lang = (v.language || "").toLowerCase();
      if (!lang || lang === "text" || lang === "txt" || lang === "plaintext") {
        const detected = detectLanguage(v.code);
        if (detected) return { ...v, language: detected, detected: true };
      }
      return v;
    });
  }, [variantsProp, language, filename, highlightLines, children]);

  const hasTabs = variants.length > 1;
  // Per-section unique key: namespace by current pathname so the same
  // markdown `group=install` on different articles (and different sections)
  // restores independently across visits.
  const pathScope =
    typeof window !== "undefined" ? window.location.pathname : "";
  const storageKey = group ? `codeblock:tab:${pathScope}:${group}` : null;

  const [activeIdx, setActiveIdx] = useState<number>(() => {
    const fallback = (() => {
      if (defaultTab) {
        const i = variants.findIndex(
          (v) => v.language.toLowerCase() === defaultTab.toLowerCase(),
        );
        if (i >= 0) return i;
      }
      return 0;
    })();
    if (typeof window === "undefined") return fallback;
    try {
      // 1. Per-group saved choice wins.
      if (storageKey) {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const i = variants.findIndex(
            (v) => v.language.toLowerCase() === saved.toLowerCase(),
          );
          if (i >= 0) return i;
        }
      }
      // 2. Otherwise fall back to the user's globally preferred language so
      //    selecting "Python" once carries across articles & sections.
      if (hasTabs) {
        const preferred = window.localStorage.getItem(PREFERRED_LANG_KEY);
        if (preferred) {
          const i = variants.findIndex(
            (v) => v.language.toLowerCase() === preferred.toLowerCase(),
          );
          if (i >= 0) return i;
        }
      }
      return fallback;
    } catch {
      return fallback;
    }
  });

  // Clamp if variants change.
  useEffect(() => {
    if (activeIdx >= variants.length) setActiveIdx(0);
  }, [variants.length, activeIdx]);

  const active = variants[Math.min(activeIdx, variants.length - 1)];

  // Persist tab choice per group + global preferred language for tabbed blocks.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (storageKey) window.localStorage.setItem(storageKey, active.language);
      if (hasTabs) window.localStorage.setItem(PREFERRED_LANG_KEY, active.language);
    } catch {
      /* noop */
    }
  }, [storageKey, hasTabs, active.language]);

  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const reactId = useId();
  const tabIdBase = group ? `codeblock-${group}` : `codeblock-${reactId.replace(/[:]/g, "")}`;
  const tabId = (i: number) => `${tabIdBase}-tab-${i}`;
  const panelId = (i: number) => `${tabIdBase}-panel-${i}`;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const lines = useMemo(() => active.code.split("\n"), [active.code]);
  const isLong = lines.length > 25;
  const collapseStorageKey = group
    ? `codeblock:collapsed:${group}:${active.language}`
    : null;
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined" || !collapseStorageKey) return isLong;
    try {
      const saved = window.localStorage.getItem(collapseStorageKey);
      if (saved === "1") return true;
      if (saved === "0") return false;
    } catch {
      /* noop */
    }
    return isLong;
  });
  // Re-sync collapsed when switching tabs (read persisted, else default).
  useEffect(() => {
    const defaultCollapsed = lines.length > 25;
    if (typeof window === "undefined" || !collapseStorageKey) {
      setCollapsed(defaultCollapsed);
      return;
    }
    try {
      const saved = window.localStorage.getItem(collapseStorageKey);
      if (saved === "1") setCollapsed(true);
      else if (saved === "0") setCollapsed(false);
      else setCollapsed(defaultCollapsed);
    } catch {
      setCollapsed(defaultCollapsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.language, collapseStorageKey]);
  // Persist on change.
  useEffect(() => {
    if (typeof window === "undefined" || !collapseStorageKey) return;
    try {
      window.localStorage.setItem(collapseStorageKey, collapsed ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [collapsed, collapseStorageKey]);

  const visibleSrc = collapsed ? lines.slice(0, 18).join("\n") : active.code;
  const showLineNumbers = lines.length > 3;
  const highlightSet = useMemo(
    () => new Set(active.highlightLines || []),
    [active.highlightLines],
  );

  const style = useMemo(() => {
    if (isDark) return obsidianDarkTheme as any;
    const s: any = { ...oneLight };
    s['pre[class*="language-"]'] = {
      ...(s['pre[class*="language-"]'] || {}),
      background: "transparent",
    };
    s['code[class*="language-"]'] = {
      ...(s['code[class*="language-"]'] || {}),
      background: "transparent",
    };
    return s;
  }, [isDark]);

  const [copiedTabIdx, setCopiedTabIdx] = useState<number | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleCopyVariant = async (i: number) => {
    const v = variants[i];
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v.code);
      setCopiedTabIdx(i);
      setTimeout(
        () => setCopiedTabIdx((cur) => (cur === i ? null : cur)),
        1800,
      );
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleDownload = () => {
    const ext = LANG_TO_EXT[active.language.toLowerCase()] || "txt";
    const name = active.filename || `snippet.${ext}`;
    const blob = new Blob([active.code], {
      type: "text/plain;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const isDiff = active.language.toLowerCase() === "diff";

  return (
    <div
      data-code-block
      data-has-tabs={hasTabs ? "true" : undefined}
      className={cn(
        "not-prose group/codeblock relative my-5 rounded-xl overflow-hidden border",
        isDark
          ? "border-white/[0.07] bg-[hsl(220_15%_6%)] shadow-[0_1px_0_hsl(0_0%_100%/0.04)_inset,0_10px_40px_-12px_rgba(0,0,0,0.7)]"
          : "border-border/80 bg-[#fafafa] shadow-sm",
        "selection:bg-primary/25 selection:text-foreground",
        className,
      )}
    >
      {/* Header / chrome */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 text-xs",
          hasTabs ? "h-9 pr-2" : "h-8 py-2",
          "border-b",
          isDark
            ? "border-white/[0.06] bg-white/[0.025]"
            : "border-border/70 bg-muted/40",
        )}
      >
        {/* macOS dots */}
        <div className="flex items-center gap-1.5 pr-1" aria-hidden>
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full bg-[#ff5f56]",
              isDark
                ? "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.4)]"
                : "shadow-inner",
            )}
          />
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full bg-[#ffbd2e]",
              isDark
                ? "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.4)]"
                : "shadow-inner",
            )}
          />
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full bg-[#27c93f]",
              isDark
                ? "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.4)]"
                : "shadow-inner",
            )}
          />
        </div>

        {hasTabs ? (
          <TooltipProvider delayDuration={200}>
            <div
              role="tablist"
              aria-label={group ? `Code examples for ${group}` : "Code examples"}
              aria-orientation="horizontal"
              className="flex h-full items-stretch gap-0.5 overflow-x-auto"
            >
              {variants.map((v, i) => {
                const selected = i === activeIdx;
                const langLabel = labelFor(v.language);
                const shortLabel = shortLabelFor(v.language);
                const ariaLabel = v.filename
                  ? `${langLabel} — ${v.filename}`
                  : langLabel;
                const tabCopied = copiedTabIdx === i;
                return (
                  <div
                    key={`${v.language}-${i}`}
                    className={cn(
                      "group/tab relative flex items-stretch",
                      selected
                        ? ""
                        : isDark
                          ? "hover:bg-white/[0.03]"
                          : "hover:bg-muted/60",
                    )}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          role="tab"
                          id={tabId(i)}
                          aria-selected={selected}
                          aria-controls={panelId(i)}
                          aria-label={ariaLabel}
                          tabIndex={selected ? 0 : -1}
                          onClick={() => setActiveIdx(i)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowRight") {
                              e.preventDefault();
                              setActiveIdx((i + 1) % variants.length);
                            } else if (e.key === "ArrowLeft") {
                              e.preventDefault();
                              setActiveIdx(
                                (i - 1 + variants.length) % variants.length,
                              );
                            } else if (e.key === "Home") {
                              e.preventDefault();
                              setActiveIdx(0);
                            } else if (e.key === "End") {
                              e.preventDefault();
                              setActiveIdx(variants.length - 1);
                            }
                          }}
                          className={cn(
                            "relative inline-flex items-center gap-1.5 whitespace-nowrap pl-3 pr-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            selected
                              ? "text-foreground"
                              : isDark
                                ? "text-muted-foreground/70 hover:text-foreground/90"
                                : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span>{shortLabel}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <div className="font-medium">{langLabel}</div>
                        {v.filename && (
                          <div className="font-mono text-[11px] opacity-80">
                            {v.filename}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={
                            tabCopied
                              ? `Copied ${langLabel}`
                              : `Copy ${langLabel} code`
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyVariant(i);
                          }}
                          className={cn(
                            "inline-flex items-center justify-center px-1.5 text-muted-foreground/70 transition-opacity",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            "opacity-0 group-hover/tab:opacity-100 focus-visible:opacity-100",
                            selected && "opacity-60",
                            tabCopied && "opacity-100 text-primary",
                          )}
                        >
                          {tabCopied ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {tabCopied ? "Copied!" : `Copy ${langLabel}`}
                      </TooltipContent>
                    </Tooltip>
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-x-1 bottom-0 h-0.5 rounded-t-sm transition-opacity",
                        selected ? "bg-primary opacity-100" : "opacity-0",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </TooltipProvider>
        ) : (
          <>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {active.language || "code"}
            </span>
            {active.filename && (
              <span className="ml-1 truncate font-mono text-[11px] text-foreground/80">
                {active.filename}
              </span>
            )}
          </>
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
        {copied
          ? "Code copied to clipboard"
          : hasTabs
            ? `Showing ${labelFor(active.language)} example`
            : ""}
      </span>

      <div
        role={hasTabs ? "tabpanel" : undefined}
        id={hasTabs ? panelId(activeIdx) : undefined}
        aria-labelledby={hasTabs ? tabId(activeIdx) : undefined}
        tabIndex={hasTabs ? 0 : undefined}
        className={cn(
          "relative",
          isDark && "bg-[hsl(220_14%_4%)]",
          collapsed && "max-h-[420px] overflow-hidden",
          hasTabs && "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      >
        <SyntaxHighlighter
          language={active.language.toLowerCase()}
          style={style as any}
          showLineNumbers={showLineNumbers}
          wrapLines
          wrapLongLines={wrap}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            marginRight: "0.5em",
            color: isDark ? "hsl(220 10% 35%)" : undefined,
            opacity: isDark ? 1 : 0.4,
            borderRight: isDark
              ? "1px solid hsl(0 0% 100% / 0.04)"
              : undefined,
            userSelect: "none",
            textAlign: "right" as const,
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
                ? "hsl(var(--primary) / 0.10)"
                : "rgba(244, 114, 22, 0.10)";
              styleObj.borderLeftColor = "hsl(var(--primary))";
            } else if (diffPlus) {
              styleObj.background = isDark
                ? "hsl(150 60% 45% / 0.12)"
                : "rgba(34,197,94,0.10)";
              styleObj.borderLeftColor = "hsl(150 60% 55%)";
            } else if (diffMinus) {
              styleObj.background = isDark
                ? "hsl(355 75% 55% / 0.12)"
                : "rgba(239,68,68,0.10)";
              styleObj.borderLeftColor = "hsl(355 75% 65%)";
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
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace',
            },
          }}
        >
          {visibleSrc}
        </SyntaxHighlighter>

        {collapsed && (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-24",
              isDark
                ? "bg-gradient-to-t from-[hsl(220_14%_4%)] to-transparent"
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
              ? "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {collapsed ? (
            <>
              <ChevronsDown className="h-3.5 w-3.5" /> Show all {lines.length}{" "}
              lines
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
