/**
 * Shared proctoring attempt inspector — used by both platform admin and college
 * dashboards so college staff can review the same evidence (event timeline,
 * webcam snapshots with lightbox, AI findings) without admin access.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera, ChevronLeft, ChevronRight, Copy, Download, Loader2, RefreshCw, ShieldAlert, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- types ----------
export type AttemptEvent = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type ProctorFinding = {
  id: string;
  severity: string;
  finding: {
    phone_in_frame?: boolean;
    looking_away?: boolean;
    person_count?: number;
    identity_unclear?: boolean;
    notes?: string;
  };
  created_at: string;
  snapshot_id: string;
};

type AttemptRow = {
  id: string;
  user_id: string;
  assessment_id: string;
  assessment_title: string;
  status: string;
  violations: number;
  integrity_score: number;
  started_at: string;
  submitted_at: string | null;
};

const VIOLATION_KIND_LIST = [
  "violation_strike", "tab_hidden", "window_blur", "fullscreen_exit", "webcam_lost",
  "lockdown_fail", "devtools_attempt", "print_blocked", "auto_submitted",
] as const;
const VIOLATION_KINDS = new Set<string>(VIOLATION_KIND_LIST);
const SNAPSHOT_PAGE_SIZE = 36;

// ---------- helpers ----------
function fmtTs(iso: string) { try { return new Date(iso).toLocaleString(); } catch { return iso; } }
function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
function snapshotPath(e: AttemptEvent): string | null {
  const p = (e.payload as any)?.path;
  return typeof p === "string" && p.length > 0 ? p : null;
}
async function signSnapshot(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("assessment-proctor").createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}

// ---------- meta cell ----------
function Meta({ label, value, children, mono, valueClass }: {
  label: string; value?: string; children?: React.ReactNode; mono?: boolean; valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children ? <div>{children}</div> : (
        <span className={cn("truncate", mono && "font-mono text-[11px]", valueClass)} title={value}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}

// ---------- generic event group ----------
function Group({ title, tone, items }: { title: string; tone: "amber" | "muted"; items: AttemptEvent[] }) {
  const toneCls = tone === "amber" ? "text-amber-600" : "text-muted-foreground";
  return (
    <div className="rounded-md border bg-background/60 p-2">
      <div className={cn("text-[11px] font-semibold uppercase tracking-wide mb-2", toneCls)}>
        {title} <span className="opacity-60 tabular-nums">({items.length})</span>
      </div>
      <ul className="space-y-1 max-h-64 overflow-y-auto">
        {items.length === 0 && <li className="text-muted-foreground italic text-[11px]">none</li>}
        {items.map((e) => (
          <li key={e.id} className="flex flex-col gap-0.5 border-b last:border-b-0 border-border/40 pb-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px]">{e.kind}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{fmtTs(e.created_at)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- snapshot grid with hover preview ----------
function SnapshotGroup({ snapshots, onOpen }: { snapshots: AttemptEvent[]; onOpen: (i: number) => void }) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<"newest" | "oldest">("oldest");
  const [hover, setHover] = useState<{ src: string; ts: string; x: number; y: number } | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const sorted = useMemo(() => {
    const indexed = snapshots.map((e, originalIndex) => ({ e, originalIndex }));
    indexed.sort((a, b) => {
      const ta = new Date(a.e.created_at).getTime();
      const tb = new Date(b.e.created_at).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });
    return indexed;
  }, [snapshots, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / SNAPSHOT_PAGE_SIZE));
  useEffect(() => { setPage(0); }, [snapshots, sort]);
  useEffect(() => { if (page > pageCount - 1) setPage(pageCount - 1); }, [page, pageCount]);

  const pageStart = page * SNAPSHOT_PAGE_SIZE;
  const pageItems = useMemo(
    () => sorted.slice(pageStart, pageStart + SNAPSHOT_PAGE_SIZE),
    [sorted, pageStart]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const { e } of pageItems) {
        const path = snapshotPath(e);
        if (!path || thumbs[path]) continue;
        const url = await signSnapshot(path);
        if (url) next[path] = url;
      }
      if (!cancelled && Object.keys(next).length) setThumbs((p) => ({ ...p, ...next }));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageItems]);

  return (
    <div className="rounded-md border bg-background/60 p-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
          <span>Snapshots <span className="opacity-60 tabular-nums">({snapshots.length})</span></span>
          <div className="inline-flex rounded border border-border/60 overflow-hidden">
            {(["oldest", "newest"] as const).map((s) => (
              <button
                key={s} type="button" onClick={() => setSort(s)}
                className={cn(
                  "px-1.5 py-0.5 text-[10px] normal-case tracking-normal transition-colors",
                  s === "newest" && "border-l border-border/60",
                  sort === s
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {s === "oldest" ? "Oldest" : "Newest"}
              </button>
            ))}
          </div>
        </div>
        {pageCount > 1 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-muted disabled:opacity-40">Prev</button>
            <span>{pageStart + 1}–{Math.min(snapshots.length, pageStart + pageItems.length)} of {snapshots.length}</span>
            <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}
              className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-muted disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
      {snapshots.length === 0 ? (
        <div className="text-muted-foreground italic text-[11px]">none</div>
      ) : (
        <div className="max-h-64 overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-1.5">
            {pageItems.map(({ e, originalIndex }) => {
              const path = snapshotPath(e);
              const src = path ? thumbs[path] : undefined;
              return (
                <button key={e.id} type="button" onClick={() => onOpen(originalIndex)}
                  onMouseEnter={(ev) => src && setHover({ src, ts: fmtTs(e.created_at), x: ev.clientX, y: ev.clientY })}
                  onMouseMove={(ev) => src && setHover((h) => h ? { ...h, x: ev.clientX, y: ev.clientY } : h)}
                  onMouseLeave={() => setHover(null)}
                  className="group relative aspect-[4/3] overflow-hidden rounded border border-border/60 bg-muted/40 hover:border-emerald-500/60"
                >
                  {src ? (
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 text-[9px] text-white tabular-nums px-1 py-0.5 text-center opacity-0 group-hover:opacity-100">
                    {new Date(e.created_at).toLocaleTimeString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {hover && createPortal(
        <div style={{
          position: "fixed",
          left: hover.x + 280 > window.innerWidth ? Math.max(8, hover.x - 268) : hover.x + 16,
          top: hover.y + 220 > window.innerHeight ? Math.max(8, hover.y - 212) : hover.y + 16,
          zIndex: 70, pointerEvents: "none",
        }} className="rounded-md border bg-popover shadow-2xl p-1.5">
          <img src={hover.src} alt="" className="block w-64 h-48 object-cover rounded" />
          <div className="mt-1 text-[10px] text-muted-foreground tabular-nums text-center">{hover.ts}</div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ---------- snapshot lightbox ----------
function SnapshotLightbox({ snapshots, index, onClose, onIndexChange }: {
  snapshots: AttemptEvent[]; index: number | null;
  onClose: () => void; onIndexChange: (i: number) => void;
}) {
  const open = index !== null;
  const event = open ? snapshots[index!] : null;
  const path = event ? snapshotPath(event) : null;
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !path) { setUrl(null); return; }
    let cancelled = false;
    setLoading(true); setUrl(null);
    signSnapshot(path).then((u) => { if (!cancelled) { setUrl(u); setLoading(false); } });
    return () => { cancelled = true; };
  }, [open, path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && index! > 0) onIndexChange(index! - 1);
      else if (e.key === "ArrowRight" && index! < snapshots.length - 1) onIndexChange(index! + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, snapshots.length, onIndexChange]);

  const download = async () => {
    if (!url || !event) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date(event.created_at).toISOString().replace(/[:.]/g, "-");
      a.href = href; a.download = `snapshot-${ts}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(href);
    } catch { toast.error("Download failed"); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background">
        <DialogTitle className="sr-only">Snapshot preview</DialogTitle>
        <DialogDescription className="sr-only">Webcam snapshot.</DialogDescription>
        {event && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Camera className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium tabular-nums">{fmtTs(event.created_at)}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] text-muted-foreground tabular-nums">{index! + 1} / {snapshots.length}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Previous snapshot" disabled={index! <= 0} onClick={() => onIndexChange(index! - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Next snapshot" disabled={index! >= snapshots.length - 1} onClick={() => onIndexChange(index! + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {url && (
                  <Button size="sm" variant="ghost" className="h-7 px-2" aria-label="Download snapshot" onClick={download}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Close snapshot viewer" onClick={onClose}><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="bg-black grid place-items-center min-h-[320px] max-h-[70vh]">
              {loading && <Loader2 className="h-6 w-6 animate-spin text-white/70" />}
              {!loading && url && <img src={url} alt="" className="max-h-[70vh] w-auto object-contain" />}
              {!loading && !url && <div className="text-xs text-white/70 p-6">Snapshot unavailable.</div>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------- AI findings ----------
function AIFindingsPanel({ attemptId, canRunReview = true }: { attemptId: string; canRunReview?: boolean }) {
  const [findings, setFindings] = useState<ProctorFinding[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("assessment_proctor_findings")
      .select("id,severity,finding,created_at,snapshot_id")
      .eq("attempt_id", attemptId)
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) { toast.error("Failed to load AI findings"); setFindings([]); return; }
    setFindings((data ?? []) as ProctorFinding[]);
  }, [attemptId]);

  useEffect(() => { void load(); }, [load]);

  const runReview = async () => {
    setReviewing(true);
    try {
      const { error } = await supabase.functions.invoke("assessment-snapshot-review", { body: { attempt_id: attemptId } });
      if (error) throw error;
      toast.success("AI review triggered");
      await load();
    } catch (e) {
      toast.error("AI review failed", { description: e instanceof Error ? e.message : String(e) });
    } finally { setReviewing(false); }
  };

  const counts = useMemo(() => {
    const all = findings ?? [];
    return {
      high: all.filter((f) => f.severity === "high").length,
      medium: all.filter((f) => f.severity === "medium").length,
      low: all.filter((f) => f.severity === "low").length,
    };
  }, [findings]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          AI proctor findings
          {findings && <span className="opacity-70 tabular-nums">({findings.length})</span>}
        </h4>
        <div className="flex items-center gap-2">
          {findings && findings.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Badge variant="destructive" className="text-[10px]">{counts.high} high</Badge>
              <Badge variant="secondary" className="text-[10px]">{counts.medium} med</Badge>
              <Badge variant="outline" className="text-[10px]">{counts.low} low</Badge>
            </div>
          )}
          {canRunReview ? (
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={runReview} disabled={reviewing}>
              {reviewing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Run AI review
            </Button>
          ) : null}
        </div>
      </div>
      {loading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">
          <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1.5" />Loading…
        </div>
      ) : findings && findings.length > 0 ? (
        <div className="space-y-1.5 max-h-80 overflow-y-auto rounded-md border">
          {findings.map((f) => (
            <div key={f.id} className={cn(
              "px-3 py-2 text-xs border-b last:border-b-0 flex flex-col gap-1",
              f.severity === "high" && "bg-destructive/5",
              f.severity === "medium" && "bg-amber-500/5"
            )}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant={f.severity === "high" ? "destructive" : f.severity === "medium" ? "secondary" : "outline"} className="text-[10px] capitalize">
                    {f.severity}
                  </Badge>
                  {f.finding.phone_in_frame && <Badge variant="outline" className="text-[10px]">📱 phone</Badge>}
                  {f.finding.looking_away && <Badge variant="outline" className="text-[10px]">👀 away</Badge>}
                  {typeof f.finding.person_count === "number" && f.finding.person_count !== 1 && (
                    <Badge variant="outline" className="text-[10px]">{f.finding.person_count} people</Badge>
                  )}
                  {f.finding.identity_unclear && <Badge variant="outline" className="text-[10px]">❓ identity</Badge>}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{fmtTs(f.created_at)}</span>
              </div>
              {f.finding.notes && <p className="text-[11px] text-muted-foreground italic">{f.finding.notes}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground py-4 text-center italic">
          No AI findings yet. Click <em>Run AI review</em> to analyze captured snapshots.
        </div>
      )}
    </div>
  );
}

// ---------- main inspector ----------
export function AttemptInspector({ attemptId, open, onClose, canRunReview = true }: {
  attemptId: string | null;
  open: boolean;
  onClose: () => void;
  /** Hide the "Run AI review" action for viewers without proctoring write access. */
  canRunReview?: boolean;
}) {
  const [attempt, setAttempt] = useState<AttemptRow | null>(null);
  const [events, setEvents] = useState<AttemptEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Reset per-attempt state immediately whenever the selected attempt changes
  // (including switching from one open attempt straight to another) so the
  // timeline, snapshots, and lightbox never show stale evidence while the
  // next fetch is in flight.
  useEffect(() => {
    setAttempt(null);
    setEvents(null);
    setLightboxIdx(null);
    if (!attemptId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: a } = await supabase
        .from("assessment_attempts")
        .select("id,user_id,assessment_id,status,violations,integrity_score,started_at,submitted_at, assessment:assessments(title)")
        .eq("id", attemptId).maybeSingle();
      const { data: ev } = await supabase
        .from("attempt_events")
        .select("id,kind,payload,created_at")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (cancelled) return;
      if (a) {
        setAttempt({
          id: (a as any).id, user_id: (a as any).user_id, assessment_id: (a as any).assessment_id,
          assessment_title: (a as any).assessment?.title ?? "—",
          status: (a as any).status, violations: (a as any).violations ?? 0,
          integrity_score: Number((a as any).integrity_score ?? 100),
          started_at: (a as any).started_at, submitted_at: (a as any).submitted_at,
        });
      }
      setEvents((ev ?? []) as AttemptEvent[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [attemptId]);

  const snapshots = useMemo(() => (events ?? []).filter((e) => e.kind === "webcam_snapshot"), [events]);
  const violations = useMemo(() => (events ?? []).filter((e) => VIOLATION_KINDS.has(e.kind)), [events]);
  const other = useMemo(
    () => (events ?? []).filter((e) => e.kind !== "webcam_snapshot" && !VIOLATION_KINDS.has(e.kind)),
    [events]
  );

  const durationMs = useMemo(() => {
    if (!attempt?.started_at) return null;
    const start = new Date(attempt.started_at).getTime();
    const end = attempt.submitted_at ? new Date(attempt.submitted_at).getTime() : Date.now();
    return Math.max(0, end - start);
  }, [attempt]);

  const copyId = async () => {
    if (!attempt) return;
    try { await navigator.clipboard.writeText(attempt.id); toast.success("Attempt ID copied"); } catch { /* noop */ }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b">
            <SheetTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" /> Attempt details
            </SheetTitle>
            <SheetDescription className="sr-only">Full metadata and evidence for the selected attempt.</SheetDescription>
            {attempt && (
              <div className="flex items-center gap-1.5 pt-1">
                <code className="text-[11px] font-mono text-muted-foreground truncate">{attempt.id}</code>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyId} aria-label="Copy attempt id">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </SheetHeader>

          {loading && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading attempt…
            </div>
          )}

          {!loading && attempt && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Meta label="Assessment" value={attempt.assessment_title} />
                <Meta label="Status">
                  <Badge variant={attempt.status === "auto_submitted" ? "destructive" : "secondary"} className="capitalize text-[10px]">
                    {attempt.status.replace(/_/g, " ")}
                  </Badge>
                </Meta>
                <Meta label="User" value={attempt.user_id} mono />
                <Meta label="Integrity score" value={attempt.integrity_score.toFixed(0)}
                  valueClass={cn("tabular-nums font-semibold", attempt.integrity_score < 70 && "text-destructive")} />
                <Meta label="Started" value={fmtTs(attempt.started_at)} mono />
                <Meta label="Submitted" value={attempt.submitted_at ? fmtTs(attempt.submitted_at) : "—"} mono />
                <Meta label="Duration" value={durationMs !== null ? fmtDuration(durationMs) : "—"} />
                <Meta label="Violations" value={String(attempt.violations)}
                  valueClass={cn("tabular-nums font-semibold", attempt.violations > 0 && "text-amber-600")} />
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Event history {events && <span className="ml-1.5 opacity-70 tabular-nums">({events.length})</span>}
                </h4>
                {events && events.length > 0 ? (
                  <div className="grid md:grid-cols-3 gap-3 text-xs">
                    <Group title="Violations" tone="amber" items={violations} />
                    <SnapshotGroup snapshots={snapshots} onOpen={(i) => setLightboxIdx(i)} />
                    <Group title="Other events" tone="muted" items={other} />
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-6 text-center italic">
                    No proctoring events recorded.
                  </div>
                )}
              </div>

              <AIFindingsPanel key={attempt.id} attemptId={attempt.id} canRunReview={canRunReview} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <SnapshotLightbox
        snapshots={snapshots}
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onIndexChange={setLightboxIdx}
      />
    </>
  );
}
