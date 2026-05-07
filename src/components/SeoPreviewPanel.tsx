import { useEffect, useState } from "react";
import { X, Search, ExternalLink, Copy, Check, Download, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Meta = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterImage: string;
  jsonLdCount: number;
  url: string;
};

const readMeta = (): Meta & { jsonLd: unknown[]; twitterDescription: string } => {
  const get = (sel: string, attr = "content") =>
    document.querySelector(sel)?.getAttribute(attr) ?? "";
  const jsonLd: unknown[] = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      jsonLd.push(JSON.parse(s.textContent ?? "null"));
    } catch {
      jsonLd.push({ _parseError: true, raw: s.textContent });
    }
  });
  return {
    title: document.title,
    description: get('meta[name="description"]'),
    canonical: get('link[rel="canonical"]', "href"),
    ogTitle: get('meta[property="og:title"]'),
    ogDescription: get('meta[property="og:description"]'),
    ogImage: get('meta[property="og:image"]'),
    ogType: get('meta[property="og:type"]'),
    twitterCard: get('meta[name="twitter:card"]'),
    twitterTitle: get('meta[name="twitter:title"]'),
    twitterDescription: get('meta[name="twitter:description"]'),
    twitterImage: get('meta[name="twitter:image"]'),
    jsonLdCount: jsonLd.length,
    jsonLd,
    url: window.location.href,
  };
};

type AssetCheck = {
  path: string;
  status: number | null;
  ok: boolean;
  width?: number;
  height?: number;
  expectedW?: number;
  expectedH?: number;
  error?: string;
};

const ASSETS: { path: string; expectedW?: number; expectedH?: number }[] = [
  { path: "/favicon.png", expectedW: 256, expectedH: 256 },
  { path: "/logo.png" },
  { path: "/og-image.png", expectedW: 1200, expectedH: 630 },
];

const checkAssets = async (): Promise<AssetCheck[]> => {
  return Promise.all(
    ASSETS.map(async (a) => {
      try {
        const res = await fetch(a.path, { cache: "no-cache" });
        const blob = await res.blob();
        const dim = await new Promise<{ w: number; h: number }>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => reject(new Error("decode failed"));
          img.src = URL.createObjectURL(blob);
        });
        return {
          path: a.path,
          status: res.status,
          ok:
            res.ok &&
            (a.expectedW ? dim.w === a.expectedW : true) &&
            (a.expectedH ? dim.h === a.expectedH : true),
          width: dim.w,
          height: dim.h,
          expectedW: a.expectedW,
          expectedH: a.expectedH,
        };
      } catch (e) {
        return { path: a.path, status: null, ok: false, error: (e as Error).message };
      }
    }),
  );
};

const Row = ({ label, value, max }: { label: string; value: string; max?: number }) => {
  const len = value.length;
  const over = max != null && len > max;
  return (
    <div className="flex flex-col gap-0.5 py-1.5 border-b border-border/40 last:border-0">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        {max != null && (
          <span className={cn(over ? "text-destructive" : "text-muted-foreground/70")}>
            {len}/{max}
          </span>
        )}
      </div>
      <span className="text-xs text-foreground break-all">{value || <em className="text-muted-foreground">—</em>}</span>
    </div>
  );
};

export const SeoPreviewPanel = () => {
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<ReturnType<typeof readMeta> | null>(null);
  const [copied, setCopied] = useState(false);
  const [assets, setAssets] = useState<AssetCheck[] | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("seo") === "1") setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setMeta(readMeta());
    const id = window.setInterval(() => setMeta(readMeta()), 1500);
    return () => window.clearInterval(id);
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-lg backdrop-blur hover:text-foreground hover:border-primary/50 transition-colors"
        aria-label="Open SEO preview"
      >
        <Search className="h-3.5 w-3.5" />
        SEO
      </button>
    );
  }

  const copy = async () => {
    if (!meta) return;
    await navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const exportJson = () => {
    if (!meta) return;
    const payload = {
      route: window.location.pathname,
      checkedAt: new Date().toISOString(),
      meta,
      assets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seo-${window.location.pathname.replace(/\W+/g, "_") || "root"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const runAssetCheck = async () => {
    setChecking(true);
    try {
      const r = await checkAssets();
      setAssets(r);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[60] w-[380px] max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-xl flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-secondary/40">
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">SEO Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={exportJson} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" aria-label="Export SEO JSON" title="Export SEO JSON">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={copy} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" aria-label="Copy meta" title="Copy JSON to clipboard">
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto px-3 py-2">
        {meta && (
          <>
            {/* Google preview */}
            <div className="mb-3 rounded-lg border border-border/40 bg-card p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Google preview</div>
              <div className="text-[11px] text-emerald-500 truncate flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> {meta.canonical || meta.url}
              </div>
              <div className="text-sm text-primary truncate font-medium leading-snug mt-0.5">{meta.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{meta.description}</div>
            </div>

            {/* OG image preview */}
            {meta.ogImage && (
              <div className="mb-3 rounded-lg border border-border/40 overflow-hidden bg-card">
                <div className="px-3 pt-2 text-[10px] uppercase tracking-wide text-muted-foreground">OG image · {meta.ogImage}</div>
                <img src={meta.ogImage} alt="OG preview" className="w-full h-auto" loading="lazy" />
              </div>
            )}

            <div className="space-y-0">
              <Row label="Title" value={meta.title} max={60} />
              <Row label="Description" value={meta.description} max={160} />
              <Row label="Canonical" value={meta.canonical} />
              <Row label="OG Type" value={meta.ogType} />
              <Row label="OG Title" value={meta.ogTitle} max={60} />
              <Row label="OG Description" value={meta.ogDescription} max={160} />
              <Row label="OG Image" value={meta.ogImage} />
              <Row label="Twitter Card" value={meta.twitterCard} />
              <Row label="Twitter Title" value={meta.twitterTitle} max={70} />
              <Row label="Twitter Image" value={meta.twitterImage} />
              <Row label="JSON-LD blocks" value={String(meta.jsonLdCount)} />
              <Row label="URL" value={meta.url} />
            </div>

            {/* Brand asset production check */}
            <div className="mt-3 rounded-lg border border-border/40 bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Brand assets
                </div>
                <button
                  onClick={runAssetCheck}
                  disabled={checking}
                  className="text-[10px] px-2 py-0.5 rounded border border-border/60 hover:bg-secondary disabled:opacity-50"
                >
                  {checking ? "Checking…" : assets ? "Re-check" : "Run check"}
                </button>
              </div>
              {assets ? (
                <ul className="space-y-1">
                  {assets.map((a) => (
                    <li key={a.path} className="flex items-center justify-between text-[11px]">
                      <span className="truncate">{a.path}</span>
                      <span className={cn("flex items-center gap-1 font-mono", a.ok ? "text-emerald-500" : "text-destructive")}>
                        {a.ok ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {a.status ?? "ERR"}
                        {a.width ? ` · ${a.width}×${a.height}` : ""}
                        {a.expectedW && (a.width !== a.expectedW || a.height !== a.expectedH)
                          ? ` (≠${a.expectedW}×${a.expectedH})`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[10px] text-muted-foreground">
                  Verifies /favicon.png, /logo.png, /og-image.png return 200 with expected dimensions.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-border/60 text-[10px] text-muted-foreground bg-secondary/30">
        Toggle: Ctrl+Shift+S · or ?seo=1
      </div>
    </div>
  );
};

export default SeoPreviewPanel;
