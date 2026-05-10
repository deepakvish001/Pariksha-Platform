import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language?: string;
  children: string;
  className?: string;
}

export function CodeBlock({ language, children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light"; // default dark when undefined / SSR
  const style = isDark ? oneDark : oneLight;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      className={cn(
        "relative group my-3 rounded-lg overflow-hidden border border-border bg-muted/40",
        className,
      )}
    >
      <div className="flex items-center justify-between bg-muted/80 px-4 py-2 text-xs">
        <span className="text-muted-foreground font-medium uppercase tracking-wide">
          {language || "code"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={copied ? "Copied" : "Copy code"}
          className="h-6 w-6 opacity-60 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" aria-hidden />
          ) : (
            <Copy className="h-3 w-3" aria-hidden />
          )}
        </Button>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Code copied to clipboard" : ""}
      </span>
      <SyntaxHighlighter
        language={language || "text"}
        style={style as any}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.875rem",
          padding: "1rem",
          background: "transparent",
        }}
        wrapLongLines
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
