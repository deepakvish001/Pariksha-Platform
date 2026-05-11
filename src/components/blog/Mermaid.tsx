import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  chart: string;
  className?: string;
}

let mermaidPromise: Promise<typeof import("mermaid")["default"]> | null = null;
const getMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => m.default);
  }
  return mermaidPromise;
};

let idCounter = 0;

export function Mermaid({ chart, className }: Props) {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const mermaid = await getMermaid();
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "light" ? "default" : "dark",
          securityLevel: "strict",
          fontFamily: "inherit",
          suppressErrorRendering: true,
        } as any);
        const id = `mmd-${++idCounter}`;
        try {
          await mermaid.parse(chart);
        } catch (parseErr: any) {
          throw new Error(parseErr?.message || "Invalid Mermaid syntax");
        }
        const { svg } = await mermaid.render(id, chart);
        // Clean up any stray error SVGs Mermaid may have appended to <body>
        document.querySelectorAll(`#d${id}, #${id}`).forEach((n) => {
          if (n.parentElement === document.body) n.remove();
        });
        if (!cancelled) setSvg(svg);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to render diagram");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme]);

  return (
    <div
      ref={ref}
      className={cn(
        "not-prose my-6 overflow-x-auto rounded-lg border border-border bg-muted/30 p-4",
        className,
      )}
      role="img"
      aria-label="Mermaid diagram"
    >
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Rendering diagram…
        </div>
      )}
      {error && (
        <pre className="text-xs text-destructive whitespace-pre-wrap">
          Mermaid error: {error}
          {"\n\n"}
          {chart}
        </pre>
      )}
      {svg && !error && (
        <div className="flex justify-center [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  );
}
