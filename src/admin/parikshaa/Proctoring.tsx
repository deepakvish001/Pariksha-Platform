import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShellHeader } from "./ParikshaaShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, ChevronDown, ChevronRight, Camera, ShieldAlert, Loader2, Trash2, Save, ChevronLeft as ChevronLeftIcon, X, Eye, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

async function downloadSnapshot(
  url: string,
  event: { created_at: string },
  path: string | null,
  format: "jpg" | "png",
  onProgress?: (pct: number | null) => void,
): Promise<"ok" | "denied" | "error"> {
  // Tracks where in the pipeline we are so the catch block can emit a more
  // accurate error toast (network vs. server vs. generic post-processing).
  let stage: "fetch" | "stream" | "encode" | "save" = "fetch";
  let serverStatus: number | null = null;
  try {
    onProgress?.(0);
    let res: Response;
    try {
      res = await fetch(url);
    } catch (networkErr) {
      toast.error(
        "Network error: couldn't reach the snapshot server. Check your connection and try again.",
      );
      window.open(url, "_blank", "noopener,noreferrer");
      onProgress?.(null);
      return "error";
    }
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        toast.error("You don't have permission to download this snapshot.");
        return "denied";
      }
      serverStatus = res.status;
      throw new Error(`HTTP ${res.status}`);
    }

    stage = "stream";
    // Stream the body so we can report download progress when the server
    // sends a Content-Length header. Fall back to res.blob() otherwise.
    const totalHeader = res.headers.get("Content-Length");
    const total = totalHeader ? Number(totalHeader) : 0;
    let sourceBlob: Blob;
    if (res.body && total > 0) {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          onProgress?.(Math.min(99, Math.round((received / total) * 100)));
        }
      }
      sourceBlob = new Blob(chunks as BlobPart[], {
        type: res.headers.get("Content-Type") || "",
      });
    } else {
      onProgress?.(null);
      sourceBlob = await res.blob();
    }
    const tsName = new Date(event.created_at).toISOString().replace(/[:.]/g, "-");
    const baseName = path ? path.split("/").pop()?.replace(/\.[^.]+$/, "") : null;
    const fileName = `${baseName || `snapshot-${tsName}`}.${format}`;

    stage = "encode";
    let outBlob: Blob = sourceBlob;
    const sourceType = sourceBlob.type || "";
    const targetType = format === "png" ? "image/png" : "image/jpeg";

    if (!sourceType.includes(format === "png" ? "png" : "jpeg")) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(sourceBlob);
        });
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = dataUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas unavailable");
        if (format === "jpg") {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        const converted = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, targetType, format === "jpg" ? 0.92 : undefined),
        );
        if (converted) outBlob = converted;
      } catch {
        // Fall through with original blob; extension still hints format.
      }
    }

    stage = "save";
    const href = URL.createObjectURL(outBlob);
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    onProgress?.(100);
    return "ok";
  } catch {
    if (serverStatus !== null) {
      const family =
        serverStatus >= 500
          ? "Server error"
          : serverStatus >= 400
          ? "Request failed"
          : "Download failed";
      toast.error(
        `${family} (HTTP ${serverStatus}). Opening in a new tab instead.`,
      );
    } else if (stage === "stream") {
      toast.error(
        "Network error while downloading the snapshot. Opening in a new tab instead.",
      );
    } else {
      toast.error(
        "Couldn't prepare the snapshot file. Opening in a new tab instead.",
      );
    }
    window.open(url, "_blank", "noopener,noreferrer");
    onProgress?.(null);
    return "error";
  }
}
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AttemptRow {
  id: string;
  user_id: string;
  assessment_id: string;
  assessment_title: string;
  status: string;
  violations: number;
  integrity_score: number;
  started_at: string;
  submitted_at: string | null;
  snapshot_count: number;
  first_snapshot_at: string | null;
  last_snapshot_at: string | null;
}

interface AttemptEvent {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  created_at: string;
}

const VIOLATION_KIND_LIST = [
  "violation_strike",
  "tab_hidden",
  "window_blur",
  "fullscreen_exit",
  "webcam_lost",
  "lockdown_fail",
  "devtools_attempt",
  "print_blocked",
  "auto_submitted",
] as const;
const VIOLATION_KINDS = new Set<string>(VIOLATION_KIND_LIST);

const STATUS_OPTIONS = ["all", "in_progress", "submitted", "auto_submitted", "abandoned"];

const PAGE_SIZE = 50;

export default function ParikshaaProctoring() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<{ id: string; title: string }[]>([]);
  /** Map of attempt_id → set of violation kinds present on that attempt. */
  const [kindsByAttempt, setKindsByAttempt] = useState<Map<string, Set<string>>>(new Map());

  // filters
  const [assessmentId, setAssessmentId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [minViolations, setMinViolations] = useState<string>("0");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  /** Selected violation kinds; empty = no kind filter. */
  const [selectedKinds, setSelectedKinds] = useState<Set<string>>(new Set());

  const [expanded, setExpanded] = useState<Record<string, AttemptEvent[] | "loading">>({});

  /** Selected attempt id for the detail side-sheet (null = closed). */
  const [detailId, setDetailId] = useState<string | null>(null);

  /**
   * Fetch snapshot stats + violation kind sets for a batch of attempt ids
   * and merge them into the running maps. Used by both `load` (reset) and
   * `loadMore` (append) so we never refetch what we already have.
   */
  const fetchEventAggregates = async (ids: string[]) => {
    if (ids.length === 0) {
      return {
        snapMap: new Map<string, { count: number; first: string | null; last: string | null }>(),
        kMap: new Map<string, Set<string>>(),
      };
    }
    const snapMap = new Map<string, { count: number; first: string | null; last: string | null }>();
    const kMap = new Map<string, Set<string>>();
    const [{ data: snaps }, { data: vev }] = await Promise.all([
      supabase
        .from("attempt_events")
        .select("attempt_id,created_at")
        .eq("kind", "webcam_snapshot")
        .in("attempt_id", ids),
      supabase
        .from("attempt_events")
        .select("attempt_id,kind")
        .in("attempt_id", ids)
        .in("kind", VIOLATION_KIND_LIST as unknown as string[]),
    ]);
    for (const e of snaps ?? []) {
      const prev = snapMap.get(e.attempt_id) ?? { count: 0, first: null, last: null };
      prev.count += 1;
      if (!prev.first || e.created_at < prev.first) prev.first = e.created_at;
      if (!prev.last || e.created_at > prev.last) prev.last = e.created_at;
      snapMap.set(e.attempt_id, prev);
    }
    for (const e of vev ?? []) {
      const set = kMap.get(e.attempt_id) ?? new Set<string>();
      set.add(e.kind);
      kMap.set(e.attempt_id, set);
    }
    return { snapMap, kMap };
  };

  const mapAttempts = (
    att: any[],
    snapMap: Map<string, { count: number; first: string | null; last: string | null }>,
  ): AttemptRow[] =>
    att.map((a) => {
      const s = snapMap.get(a.id);
      return {
        id: a.id,
        user_id: a.user_id,
        assessment_id: a.assessment_id,
        assessment_title: a.assessments?.title ?? "—",
        status: a.status,
        violations: a.violations ?? 0,
        integrity_score: Number(a.integrity_score ?? 100),
        started_at: a.started_at,
        submitted_at: a.submitted_at,
        snapshot_count: s?.count ?? 0,
        first_snapshot_at: s?.first ?? null,
        last_snapshot_at: s?.last ?? null,
      };
    });

  /** Reset and load the first page. */
  const load = useCallback(async () => {
    setLoading(true);
    setRows([]);
    try {
      const { data: att, count, error } = await supabase
        .from("assessment_attempts")
        .select(
          "id,user_id,assessment_id,status,violations,integrity_score,started_at,submitted_at,assessments(title)",
          { count: "exact" },
        )
        .order("started_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);
      if (error) throw error;

      const ids = (att ?? []).map((a) => a.id);
      const { snapMap, kMap } = await fetchEventAggregates(ids);
      setKindsByAttempt(kMap);

      const mapped = mapAttempts(att ?? [], snapMap);
      setRows(mapped);
      setTotalCount(typeof count === "number" ? count : null);

      // assessments dropdown — refreshed from the first page only.
      const uniq = Array.from(
        new Map(
          mapped
            .filter((r) => r.assessment_title !== "—")
            .map((r) => [r.assessment_id, { id: r.assessment_id, title: r.assessment_title }]),
        ).values(),
      );
      setAssessments(uniq);
    } catch (e: any) {
      toast.error("Failed to load attempts", { description: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  /** Append the next page to the existing rows. */
  const loadMore = useCallback(async () => {
    if (loading || loadingMore) return;
    if (totalCount !== null && rows.length >= totalCount) return;
    setLoadingMore(true);
    try {
      const fromIdx = rows.length;
      const toIdx = fromIdx + PAGE_SIZE - 1;
      const { data: att, error } = await supabase
        .from("assessment_attempts")
        .select(
          "id,user_id,assessment_id,status,violations,integrity_score,started_at,submitted_at,assessments(title)",
        )
        .order("started_at", { ascending: false })
        .range(fromIdx, toIdx);
      if (error) throw error;

      const ids = (att ?? []).map((a) => a.id);
      const { snapMap, kMap } = await fetchEventAggregates(ids);

      // Merge violation kinds into existing map.
      setKindsByAttempt((prev) => {
        const next = new Map(prev);
        for (const [k, v] of kMap.entries()) next.set(k, v);
        return next;
      });

      const mapped = mapAttempts(att ?? [], snapMap);
      setRows((prev) => {
        // De-dupe in case the page boundary shifted between calls.
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...mapped.filter((r) => !seen.has(r.id))];
      });

      // Top up the assessments dropdown with any newly-seen titles.
      setAssessments((prev) => {
        const known = new Map(prev.map((a) => [a.id, a]));
        for (const r of mapped) {
          if (r.assessment_title !== "—" && !known.has(r.assessment_id)) {
            known.set(r.assessment_id, { id: r.assessment_id, title: r.assessment_title });
          }
        }
        return Array.from(known.values());
      });
    } catch (e: any) {
      toast.error("Failed to load more", { description: e.message });
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, totalCount, rows.length]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasMore = totalCount === null ? false : rows.length < totalCount;

  // Infinite scroll sentinel.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const filtered = useMemo(() => {
    const min = parseInt(minViolations || "0", 10) || 0;
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() : null;
    const q = search.trim().toLowerCase();
    const kindFilterActive = selectedKinds.size > 0;
    return rows.filter((r) => {
      if (assessmentId !== "all" && r.assessment_id !== assessmentId) return false;
      if (status !== "all" && r.status !== status) return false;
      if (r.violations < min) return false;
      const t = new Date(r.started_at).getTime();
      if (fromTs && t < fromTs) return false;
      if (toTs && t > toTs) return false;
      if (q && !(r.user_id.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.assessment_title.toLowerCase().includes(q))) return false;
      if (kindFilterActive) {
        const present = kindsByAttempt.get(r.id);
        if (!present) return false;
        let any = false;
        for (const k of selectedKinds) {
          if (present.has(k)) { any = true; break; }
        }
        if (!any) return false;
      }
      return true;
    });
  }, [rows, assessmentId, status, minViolations, from, to, search, selectedKinds, kindsByAttempt]);

  const toggleKind = (k: string) =>
    setSelectedKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const toggleExpand = async (id: string) => {
    if (expanded[id]) {
      const { [id]: _drop, ...rest } = expanded;
      setExpanded(rest);
      return;
    }
    setExpanded((p) => ({ ...p, [id]: "loading" }));
    const { data, error } = await supabase
      .from("attempt_events")
      .select("id,kind,payload,created_at")
      .eq("attempt_id", id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Failed to load events");
      setExpanded((p) => {
        const { [id]: _drop, ...rest } = p;
        return rest;
      });
      return;
    }
    setExpanded((p) => ({ ...p, [id]: (data ?? []) as AttemptEvent[] }));
  };

  const [exporting, setExporting] = useState(false);
  const exportCsv = async () => {
    if (filtered.length === 0) return;
    setExporting(true);
    const headers = [
      "row_type",
      "attempt_id",
      "user_id",
      "assessment_id",
      "assessment_title",
      "status",
      "violations",
      "integrity_score",
      "started_at",
      "submitted_at",
      "snapshot_count",
      "first_snapshot_at",
      "last_snapshot_at",
      "event_kind",
      "event_at",
      "event_payload",
    ];
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(",")];
    const blank = (n: number) => Array(n).fill("");
    try {
      const ids = filtered.map((r) => r.id);
      // Fetch events in batches to avoid URL length / row limits
      const eventsByAttempt = new Map<string, AttemptEvent[]>();
      const BATCH = 50;
      const VIOL = Array.from(VIOLATION_KINDS);
      const KINDS = [...VIOL, "webcam_snapshot"];
      for (let i = 0; i < ids.length; i += BATCH) {
        const slice = ids.slice(i, i + BATCH);
        const { data, error } = await supabase
          .from("attempt_events")
          .select("attempt_id,kind,payload,created_at")
          .in("attempt_id", slice)
          .in("kind", KINDS)
          .order("created_at", { ascending: true })
          .limit(5000);
        if (error) throw error;
        for (const ev of (data ?? []) as Array<AttemptEvent & { attempt_id: string }>) {
          const arr = eventsByAttempt.get(ev.attempt_id) ?? [];
          arr.push(ev);
          eventsByAttempt.set(ev.attempt_id, arr);
        }
      }
      for (const r of filtered) {
        lines.push(
          [
            "attempt",
            r.id,
            r.user_id,
            r.assessment_id,
            r.assessment_title,
            r.status,
            r.violations,
            r.integrity_score,
            r.started_at,
            r.submitted_at,
            r.snapshot_count,
            r.first_snapshot_at,
            r.last_snapshot_at,
            "",
            "",
            "",
          ].map(esc).join(",")
        );
        const evs = eventsByAttempt.get(r.id) ?? [];
        for (const ev of evs) {
          const rowType = ev.kind === "webcam_snapshot" ? "snapshot" : "violation";
          lines.push(
            [
              rowType,
              r.id,
              r.user_id,
              r.assessment_id,
              r.assessment_title,
              ...blank(8),
              ev.kind,
              ev.created_at,
              ev.payload ?? "",
            ].map(esc).join(",")
          );
        }
      }
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proctoring-attempts-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filtered.length} attempts (${lines.length - 1} rows)`);
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const totalViolations = filtered.reduce((acc, r) => acc + r.violations, 0);
  const totalSnapshots = filtered.reduce((acc, r) => acc + r.snapshot_count, 0);

  return (
    <div className="space-y-4">
      <ShellHeader
        title="Proctoring Review"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} /> Refresh
            </Button>
            <Button size="sm" onClick={exportCsv} disabled={filtered.length === 0 || exporting}>
              <Download className={cn("h-3.5 w-3.5 mr-1.5", exporting && "animate-pulse")} /> {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Attempts" value={filtered.length} />
        <StatCard label="Violations" value={totalViolations} tone={totalViolations > 0 ? "amber" : "muted"} icon={<ShieldAlert className="h-3.5 w-3.5" />} />
        <StatCard label="Snapshots" value={totalSnapshots} icon={<Camera className="h-3.5 w-3.5" />} />
        <StatCard label="Auto-submitted" value={filtered.filter((r) => r.status === "auto_submitted").length} tone="amber" />
      </div>

      <RetentionCard />

      {/* Filters */}
      <div className="rounded-lg border bg-card p-3 grid gap-3 md:grid-cols-6">
        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="proctoring-search" className="text-xs">Search</Label>
          <Input
            id="proctoring-search"
            placeholder="User ID, attempt ID, or assessment title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="proctoring-assessment" className="text-xs">Assessment</Label>
          <Select value={assessmentId} onValueChange={setAssessmentId}>
            <SelectTrigger id="proctoring-assessment"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {assessments.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="proctoring-status" className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="proctoring-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="proctoring-min-violations" className="text-xs">Min violations</Label>
          <Input id="proctoring-min-violations" type="number" min={0} value={minViolations} onChange={(e) => setMinViolations(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="proctoring-from" className="text-xs">From</Label>
          <Input id="proctoring-from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1 md:col-start-6">
          <Label htmlFor="proctoring-to" className="text-xs">To</Label>
          <Input id="proctoring-to" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {/* Violation kind chips — multi-select. */}
      <div className="rounded-lg border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Violation kinds</Label>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="tabular-nums">
              {selectedKinds.size === 0
                ? "any"
                : `${selectedKinds.size} selected (matches any)`}
            </span>
            {selectedKinds.size > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[11px]"
                onClick={() => setSelectedKinds(new Set())}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VIOLATION_KIND_LIST.map((k) => {
            const active = selectedKinds.has(k);
            let count = 0;
            for (const set of kindsByAttempt.values()) if (set.has(k)) count += 1;
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleKind(k)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-mono transition-colors",
                  active
                    ? "bg-amber-500/15 border-amber-500/60 text-amber-700 dark:text-amber-300"
                    : "border-border hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {k}
                <span className="opacity-60 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Started</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Violations</TableHead>
              <TableHead className="text-right">Integrity</TableHead>
              <TableHead className="text-right">Snapshots</TableHead>
              <TableHead>Last snapshot</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No attempts match the current filters.
              </TableCell></TableRow>
            ) : (
              filtered.map((r) => {
                const open = !!expanded[r.id];
                const events = expanded[r.id];
                return (
                  <Fragment key={r.id}>
                    <TableRow
                      className="hover:bg-muted/40 cursor-pointer"
                      tabIndex={0}
                      onClick={() => toggleExpand(r.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpand(r.id);
                        }
                      }}
                    >
                      <TableCell>
                        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{fmtTs(r.started_at)}</TableCell>
                      <TableCell className="max-w-[220px] truncate">{r.assessment_title}</TableCell>
                      <TableCell className="font-mono text-[11px]">{r.user_id.slice(0, 8)}…</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "auto_submitted" ? "destructive" : "secondary"} className="capitalize text-[10px]">
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={cn(r.violations > 0 && "text-amber-600 font-semibold")}>{r.violations}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={cn(r.integrity_score < 70 && "text-destructive font-semibold")}>
                          {r.integrity_score.toFixed(0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.snapshot_count}</TableCell>
                      <TableCell className="font-mono text-xs">{r.last_snapshot_at ? fmtTs(r.last_snapshot_at) : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          aria-label="Open attempt details"
                          title="Open attempt details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailId(r.id);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell />
                        <TableCell colSpan={9} className="py-3">
                          {events === "loading" ? (
                            <div className="text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin inline mr-1" /> Loading events…</div>
                          ) : (
                            <EventTimeline events={events as AttemptEvent[]} />
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination footer: infinite-scroll sentinel + manual Load more. */}
        <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
          <div className="tabular-nums">
            Showing <span className="font-semibold text-foreground">{rows.length}</span>
            {totalCount !== null && (
              <>
                {" "}of <span className="font-semibold text-foreground">{totalCount}</span> attempts
              </>
            )}
            {selectedKinds.size > 0 || search || assessmentId !== "all" || status !== "all"
              ? ` · ${filtered.length} after filters`
              : ""}
          </div>
          <div className="flex items-center gap-2">
            {loadingMore && (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
              </span>
            )}
            {hasMore && !loadingMore && (
              <Button size="sm" variant="outline" className="h-7" onClick={() => void loadMore()}>
                Load more
              </Button>
            )}
            {!hasMore && totalCount !== null && rows.length > 0 && (
              <span className="italic">End of list</span>
            )}
          </div>
        </div>
        {/* IntersectionObserver target — kicks loadMore in before the user hits the end. */}
        {hasMore && <div ref={sentinelRef} aria-hidden className="h-1" />}
      </div>

      <AttemptDetailSheet
        attempt={detailId ? rows.find((r) => r.id === detailId) ?? null : null}
        kinds={detailId ? kindsByAttempt.get(detailId) ?? null : null}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

function EventTimeline({ events }: { events: AttemptEvent[] }) {
  const snapshots = useMemo(
    () => events.filter((e) => e.kind === "webcam_snapshot"),
    [events],
  );
  const violations = events.filter((e) => VIOLATION_KINDS.has(e.kind));
  const other = events.filter(
    (e) => e.kind !== "webcam_snapshot" && !VIOLATION_KINDS.has(e.kind),
  );

  // Lightbox state — index into `snapshots`, or null when closed.
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (events.length === 0)
    return <div className="text-xs text-muted-foreground">No proctoring events.</div>;

  return (
    <>
      <div className="grid md:grid-cols-3 gap-4 text-xs">
        <Group title="Violations" tone="amber" items={violations} />
        <SnapshotGroup
          snapshots={snapshots}
          onOpen={(i) => setLightboxIdx(i)}
        />
        <Group title="Other events" tone="muted" items={other} />
      </div>
      <SnapshotLightbox
        snapshots={snapshots}
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onIndexChange={setLightboxIdx}
      />
    </>
  );
}

function Group({ title, tone, items, showPath }: { title: string; tone: "amber" | "emerald" | "muted"; items: AttemptEvent[]; showPath?: boolean }) {
  const toneCls = tone === "amber" ? "text-amber-600" : tone === "emerald" ? "text-emerald-600" : "text-muted-foreground";
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
            {showPath && typeof (e.payload as any)?.path === "string" && (
              <code className="text-[10px] text-muted-foreground truncate">{(e.payload as any).path}</code>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Resolves the storage path on a webcam_snapshot event payload. */
function snapshotPath(e: AttemptEvent): string | null {
  const p = (e.payload as any)?.path;
  return typeof p === "string" && p.length > 0 ? p : null;
}

/** Creates a short-lived signed URL for a snapshot path. */
async function signSnapshot(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("assessment-proctor")
    .createSignedUrl(path, 60 * 10); // 10 minutes
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

const SNAPSHOT_PAGE_SIZE = 36;

function SnapshotGroup({
  snapshots,
  onOpen,
}: {
  snapshots: AttemptEvent[];
  onOpen: (index: number) => void;
}) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<"newest" | "oldest">("oldest");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [hover, setHover] = useState<
    { src: string; alt: string; ts: string; x: number; y: number } | null
  >(null);

  // Sorted view of the snapshots, with the original index preserved so the
  // lightbox (which still indexes into the unsorted prop) opens the right item.
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

  // Reset to first page when the underlying list or sort order changes.
  useEffect(() => {
    setPage(0);
  }, [snapshots, sort]);

  // Clamp page if list shrinks below current page bounds.
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const pageStart = page * SNAPSHOT_PAGE_SIZE;
  const pageItems = useMemo(
    () => sorted.slice(pageStart, pageStart + SNAPSHOT_PAGE_SIZE),
    [sorted, pageStart],
  );

  // Lazily sign thumbnail URLs only for items on the current page so we
  // never issue hundreds of storage calls on attempts with long timelines.
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
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
      if (!cancelled && Object.keys(next).length) {
        setThumbs((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageItems]);

  return (
    <div className="rounded-md border bg-background/60 p-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
          <span>
            Webcam snapshots{" "}
            <span className="opacity-60 tabular-nums">({snapshots.length})</span>
          </span>
          <div className="inline-flex rounded border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setSort("oldest")}
              aria-pressed={sort === "oldest"}
              className={
                "px-1.5 py-0.5 text-[10px] normal-case tracking-normal transition-colors " +
                (sort === "oldest"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground hover:bg-muted")
              }
              title="Sort oldest first"
            >
              Oldest
            </button>
            <button
              type="button"
              onClick={() => setSort("newest")}
              aria-pressed={sort === "newest"}
              className={
                "px-1.5 py-0.5 text-[10px] normal-case tracking-normal transition-colors border-l border-border/60 " +
                (sort === "newest"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground hover:bg-muted")
              }
              title="Sort newest first"
            >
              Newest
            </button>
          </div>
          <button
            type="button"
            disabled={bulkBusy || pageItems.length === 0}
            onClick={async () => {
              setBulkBusy(true);
              let ok = 0;
              let denied = 0;
              let failed = 0;
              try {
                for (const { e } of pageItems) {
                  const path = snapshotPath(e);
                  if (!path) {
                    failed++;
                    continue;
                  }
                  const url = thumbs[path] || (await signSnapshot(path));
                  if (!url) {
                    failed++;
                    continue;
                  }
                  try {
                    const res = await fetch(url);
                    if (!res.ok) {
                      if (res.status === 401 || res.status === 403) denied++;
                      else failed++;
                      continue;
                    }
                    const blob = await res.blob();
                    const href = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    const base = path.split("/").pop();
                    const tsName = new Date(e.created_at)
                      .toISOString()
                      .replace(/[:.]/g, "-");
                    a.href = href;
                    a.download = base || `snapshot-${tsName}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(href);
                    ok++;
                    // Small gap so the browser doesn't drop rapid downloads.
                    await new Promise((r) => setTimeout(r, 120));
                  } catch {
                    failed++;
                  }
                }
                if (denied > 0) {
                  toast.error(
                    `You don't have permission to download ${denied} snapshot${denied === 1 ? "" : "s"}.`,
                  );
                }
                if (failed > 0) {
                  toast.error(
                    `Couldn't download ${failed} snapshot${failed === 1 ? "" : "s"}.`,
                  );
                }
                if (ok > 0) {
                  toast.success(
                    `Downloaded ${ok} snapshot${ok === 1 ? "" : "s"}.`,
                  );
                }
              } finally {
                setBulkBusy(false);
              }
            }}
            className="px-1.5 py-0.5 text-[10px] normal-case tracking-normal rounded border border-border/60 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
            title="Download all snapshots on this page"
            aria-label="Download all snapshots on this page"
          >
            <Download className="h-3 w-3" />
            {bulkBusy ? "Downloading…" : "Download page"}
          </button>
        </div>
        {pageCount > 1 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page of snapshots"
            >
              Prev
            </button>
            <span>
              {pageStart + 1}–{Math.min(snapshots.length, pageStart + pageItems.length)} of {snapshots.length}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page of snapshots"
            >
              Next
            </button>
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
                <button
                  type="button"
                  key={e.id}
                  onClick={() => onOpen(originalIndex)}
                  onMouseEnter={(ev) => {
                    if (!src) return;
                    setHover({
                      src,
                      alt: `Webcam snapshot at ${fmtTs(e.created_at)}`,
                      ts: fmtTs(e.created_at),
                      x: ev.clientX,
                      y: ev.clientY,
                    });
                  }}
                  onMouseMove={(ev) => {
                    if (!src) return;
                    setHover((h) =>
                      h ? { ...h, x: ev.clientX, y: ev.clientY } : h,
                    );
                  }}
                  onMouseLeave={() => setHover(null)}
                  title={`${fmtTs(e.created_at)}${path ? ` — ${path}` : ""}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded border border-border/60 bg-muted/40 hover:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                >
                  {src ? (
                    <img
                      src={src}
                      alt={`Webcam snapshot at ${fmtTs(e.created_at)}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 text-[9px] text-white tabular-nums px-1 py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(e.created_at).toLocaleTimeString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {hover &&
        createPortal(
          <div
            // Anchor near cursor, flip to the other side when near the right/bottom edge.
            style={{
              position: "fixed",
              left:
                typeof window !== "undefined" && hover.x + 280 > window.innerWidth
                  ? Math.max(8, hover.x - 268)
                  : hover.x + 16,
              top:
                typeof window !== "undefined" && hover.y + 220 > window.innerHeight
                  ? Math.max(8, hover.y - 212)
                  : hover.y + 16,
              zIndex: 70,
              pointerEvents: "none",
            }}
            className="rounded-md border border-border bg-popover shadow-2xl p-1.5 animate-in fade-in zoom-in-95"
          >
            <img
              src={hover.src}
              alt={hover.alt}
              className="block w-64 h-48 object-cover rounded"
            />
            <div className="mt-1 text-[10px] text-muted-foreground tabular-nums text-center">
              {hover.ts}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function SnapshotLightbox({
  snapshots,
  index,
  onClose,
  onIndexChange,
}: {
  snapshots: AttemptEvent[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const open = index !== null;
  const event = open ? snapshots[index!] : null;
  const path = event ? snapshotPath(event) : null;
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dl, setDl] = useState<{ format: "jpg" | "png"; pct: number } | null>(null);
  // Remember signed URLs that returned 401/403 so we don't re-attempt the
  // same download and spam toasts. Cleared automatically when the URL changes
  // (e.g. user navigates to a different snapshot and a new URL is signed).
  const [deniedUrl, setDeniedUrl] = useState<string | null>(null);
  useEffect(() => {
    setDeniedUrl(null);
  }, [url]);
  const denied = !!url && deniedUrl === url;

  useEffect(() => {
    if (!open || !path) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setUrl(null);
    signSnapshot(path).then((u) => {
      if (cancelled) return;
      setUrl(u);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, path]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && index! > 0) onIndexChange(index! - 1);
      else if (e.key === "ArrowRight" && index! < snapshots.length - 1)
        onIndexChange(index! + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, snapshots.length, onIndexChange]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background">
        <DialogTitle className="sr-only">Webcam snapshot preview</DialogTitle>
        <DialogDescription className="sr-only">
          Full-size webcam snapshot captured during the assessment attempt.
        </DialogDescription>
        {event && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Camera className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium tabular-nums">{fmtTs(event.created_at)}</span>
                {path && (
                  <code className="text-[10px] text-muted-foreground truncate">{path}</code>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {index! + 1} / {snapshots.length}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index! <= 0}
                  onClick={() => onIndexChange(index! - 1)}
                  aria-label="Previous snapshot"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index! >= snapshots.length - 1}
                  onClick={() => onIndexChange(index! + 1)}
                  aria-label="Next snapshot"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {url && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 gap-1 tabular-nums"
                        title={
                          denied
                            ? "You don't have permission to download this snapshot"
                            : dl
                            ? `Downloading ${dl.format.toUpperCase()}${dl.pct != null ? ` (${dl.pct}%)` : "…"}`
                            : "Download snapshot"
                        }
                        aria-label={
                          denied
                            ? "Download unavailable: permission denied"
                            : "Download snapshot"
                        }
                        aria-busy={!!dl}
                        disabled={!!dl || denied}
                      >
                        {dl ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-[10px]">
                              {dl.pct != null ? `${dl.pct}%` : "…"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[10rem]">
                      <DropdownMenuItem
                        disabled={!!dl || denied}
                        onClick={async () => {
                          setDl({ format: "jpg", pct: 0 });
                          const result = await downloadSnapshot(
                            url,
                            event,
                            path,
                            "jpg",
                            (pct) =>
                              setDl(pct == null ? null : { format: "jpg", pct }),
                          );
                          setDl(null);
                          if (result === "denied") setDeniedUrl(url);
                        }}
                      >
                        Download as JPG
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!!dl || denied}
                        onClick={async () => {
                          setDl({ format: "png", pct: 0 });
                          const result = await downloadSnapshot(
                            url,
                            event,
                            path,
                            "png",
                            (pct) =>
                              setDl(pct == null ? null : { format: "png", pct }),
                          );
                          setDl(null);
                          if (result === "denied") setDeniedUrl(url);
                        }}
                      >
                        Download as PNG
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="bg-black grid place-items-center min-h-[320px] max-h-[70vh]">
              {loading && <Loader2 className="h-6 w-6 animate-spin text-white/70" />}
              {!loading && url && (
                <img
                  src={url}
                  alt={`Webcam snapshot at ${fmtTs(event.created_at)}`}
                  className="max-h-[70vh] w-auto object-contain"
                />
              )}
              {!loading && !url && (
                <div className="text-xs text-white/70 p-6">Snapshot unavailable.</div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AttemptDetailSheet({
  attempt,
  kinds,
  onClose,
}: {
  attempt: AttemptRow | null;
  kinds: Set<string> | null;
  onClose: () => void;
}) {
  const open = !!attempt;
  const [events, setEvents] = useState<AttemptEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    if (!attempt) {
      setEvents(null);
      setTruncated(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setEvents(null);
    setTruncated(false);
    const LIMIT = 2000;
    (async () => {
      const { data, error } = await supabase
        .from("attempt_events")
        .select("id,kind,payload,created_at")
        .eq("attempt_id", attempt.id)
        .order("created_at", { ascending: false })
        .limit(LIMIT);
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load events", { description: error.message });
        setEvents([]);
      } else {
        const list = (data ?? []) as AttemptEvent[];
        setEvents(list);
        setTruncated(list.length >= LIMIT);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const durationMs = useMemo(() => {
    if (!attempt?.started_at) return null;
    const start = new Date(attempt.started_at).getTime();
    const end = attempt.submitted_at
      ? new Date(attempt.submitted_at).getTime()
      : Date.now();
    return Math.max(0, end - start);
  }, [attempt]);

  const copyId = async () => {
    if (!attempt) return;
    try {
      await navigator.clipboard.writeText(attempt.id);
      toast.success("Attempt ID copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <SheetTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            Attempt details
          </SheetTitle>
          <SheetDescription className="sr-only">
            Full metadata and event history for the selected attempt.
          </SheetDescription>
          {attempt && (
            <div className="flex items-center gap-1.5 pt-1">
              <code className="text-[11px] font-mono text-muted-foreground truncate">{attempt.id}</code>
              <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Copy attempt id" onClick={copyId}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </SheetHeader>

        {attempt && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Meta label="Assessment" value={attempt.assessment_title} />
              <Meta label="Status">
                <Badge variant={attempt.status === "auto_submitted" ? "destructive" : "secondary"} className="capitalize text-[10px]">
                  {attempt.status.replace(/_/g, " ")}
                </Badge>
              </Meta>
              <Meta label="User" value={attempt.user_id} mono />
              <Meta
                label="Integrity score"
                value={attempt.integrity_score.toFixed(0)}
                valueClass={cn("tabular-nums font-semibold", attempt.integrity_score < 70 && "text-destructive")}
              />
              <Meta label="Started" value={fmtTs(attempt.started_at)} mono />
              <Meta label="Submitted" value={attempt.submitted_at ? fmtTs(attempt.submitted_at) : "—"} mono />
              <Meta label="Duration" value={durationMs !== null ? fmtDuration(durationMs) : "—"} />
              <Meta
                label="Violations"
                value={String(attempt.violations)}
                valueClass={cn("tabular-nums font-semibold", attempt.violations > 0 && "text-amber-600")}
              />
              <Meta label="Snapshots" value={String(attempt.snapshot_count)} valueClass="tabular-nums" />
              <Meta label="First snapshot" value={attempt.first_snapshot_at ? fmtTs(attempt.first_snapshot_at) : "—"} mono />
              <Meta label="Last snapshot" value={attempt.last_snapshot_at ? fmtTs(attempt.last_snapshot_at) : "—"} mono />
              <Meta label="Assessment ID" value={attempt.assessment_id} mono />
            </div>

            {kinds && kinds.size > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Violation kinds</div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(kinds).map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-700 dark:text-amber-300"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Event history
                  {events && (
                    <span className="ml-1.5 opacity-70 tabular-nums">
                      ({events.length}{truncated ? "+" : ""})
                    </span>
                  )}
                </h4>
                {truncated && (
                  <span className="text-[10px] text-amber-600">Showing most recent 2000 events</span>
                )}
              </div>
              {loading ? (
                <div className="text-xs text-muted-foreground py-6 text-center">
                  <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1.5" />
                  Loading events…
                </div>
              ) : events && events.length > 0 ? (
                <EventTimeline events={events} />
              ) : (
                <div className="text-xs text-muted-foreground py-6 text-center italic">
                  No proctoring events recorded.
                </div>
              )}
            </div>

            <AIFindingsPanel attemptId={attempt.id} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Meta({
  label,
  value,
  children,
  mono,
  valueClass,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children ? (
        <div>{children}</div>
      ) : (
        <span className={cn("truncate", mono && "font-mono text-[11px]", valueClass)} title={value}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function StatCard({ label, value, tone, icon }: { label: string; value: number; tone?: "amber" | "muted"; icon?: React.ReactNode }) {
  const cls = tone === "amber" ? "border-amber-500/40 bg-amber-500/5" : "border-border";
  return (
    <div className={cn("rounded-lg border p-3", cls)}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function fmtTs(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function RetentionCard() {
  const [snapshotDays, setSnapshotDays] = useState<string>("30");
  const [eventsDays, setEventsDays] = useState<string>("90");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [lastResult, setLastResult] = useState<{ snapshots_deleted: number; events_deleted: number } | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [dryRunning, setDryRunning] = useState(false);
  const [estimate, setEstimate] = useState<{ snapshots: number; events: number; at: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "proctoring_retention")
        .maybeSingle();
      const v = (data?.value ?? {}) as { snapshot_days?: number; events_days?: number };
      if (typeof v.snapshot_days === "number") setSnapshotDays(String(v.snapshot_days));
      if (typeof v.events_days === "number") setEventsDays(String(v.events_days));
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const sd = Math.max(1, Math.min(3650, parseInt(snapshotDays, 10) || 0));
    const ed = Math.max(1, Math.min(3650, parseInt(eventsDays, 10) || 0));
    setSaving(true);
    const { error } = await supabase.from("platform_settings").upsert({
      key: "proctoring_retention",
      value: { snapshot_days: sd, events_days: ed } as never,
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to save retention settings", { description: error.message });
      return;
    }
    setSnapshotDays(String(sd));
    setEventsDays(String(ed));
    toast.success("Retention settings saved");
  };

  const runDryRun = useCallback(async (silent = false) => {
    setDryRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("purge-proctoring-data", {
        body: { dry_run: true, source: "manual_dry_run" },
      });
      if (error) throw error;
      const snapshots = (data as any)?.snapshots_to_delete ?? 0;
      const events = (data as any)?.events_to_delete ?? 0;
      setEstimate({ snapshots, events, at: Date.now() });
      if (!silent) {
        toast.success("Dry run complete", {
          description: `Would delete ${snapshots} snapshots & ${events} events`,
        });
      }
      return { snapshots, events };
    } catch (e: any) {
      if (!silent) toast.error("Dry run failed", { description: e.message });
      return null;
    } finally {
      setDryRunning(false);
    }
  }, []);

  const runPurge = async () => {
    setPurging(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("purge-proctoring-data", {
        body: { source: "manual", triggered_by: userData?.user?.id ?? null },
      });
      if (error) throw error;
      setLastResult({
        snapshots_deleted: (data as any)?.snapshots_deleted ?? 0,
        events_deleted: (data as any)?.events_deleted ?? 0,
      });
      setHistoryKey((k) => k + 1);
      setEstimate(null);
      setConfirmOpen(false);
      toast.success("Purge complete", {
        description: `${(data as any)?.snapshots_deleted ?? 0} snapshots & ${(data as any)?.events_deleted ?? 0} events removed`,
      });
    } catch (e: any) {
      toast.error("Purge failed", { description: e.message });
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" /> Data Retention
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automatically deleted daily. Snapshots are removed from storage; proctoring events are removed from the audit log.
          </p>
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap text-right space-y-0.5">
          {lastResult && (
            <div>Last purge: {lastResult.snapshots_deleted} snapshots, {lastResult.events_deleted} events</div>
          )}
          {estimate && !confirmOpen && (
            <div className="text-emerald-600">
              Dry run: would delete {estimate.snapshots} snapshots, {estimate.events} events
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto] items-end">
        <div className="space-y-1">
          <Label htmlFor="proctoring-retention-snapshots" className="text-xs">Webcam snapshots — keep for (days)</Label>
          <Input
            id="proctoring-retention-snapshots"
            type="number"
            min={1}
            max={3650}
            value={snapshotDays}
            onChange={(e) => setSnapshotDays(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="proctoring-retention-events" className="text-xs">Proctoring events — keep for (days)</Label>
          <Input
            id="proctoring-retention-events"
            type="number"
            min={1}
            max={3650}
            value={eventsDays}
            onChange={(e) => setEventsDays(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button onClick={save} disabled={saving || loading} size="sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          Save
        </Button>
        <Button
          onClick={() => void runDryRun()}
          disabled={dryRunning || purging || loading}
          size="sm"
          variant="outline"
          title="Estimate without deleting"
        >
          {dryRunning ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5 mr-1.5" />
          )}
          Dry run
        </Button>
        <AlertDialog
          open={confirmOpen}
          onOpenChange={(o) => {
            setConfirmOpen(o);
            if (o && !dryRunning) void runDryRun(true);
          }}
        >
          <AlertDialogTrigger asChild>
            <Button disabled={purging || loading} size="sm" variant="outline">
              {purging ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
              Purge now
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Purge proctoring data now?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes webcam snapshots older than{" "}
                <span className="font-semibold text-foreground">{snapshotDays} days</span> and proctoring events older than{" "}
                <span className="font-semibold text-foreground">{eventsDays} days</span>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Estimated impact</span>
                {dryRunning ? (
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Calculating…
                  </span>
                ) : estimate ? (
                  <span className="tabular-nums">
                    <span className="font-semibold text-foreground">{estimate.snapshots}</span> snapshots ·{" "}
                    <span className="font-semibold text-foreground">{estimate.events}</span> events
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">unavailable</span>
                )}
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={purging}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={runPurge}
                disabled={purging}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {purging && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Yes, purge now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <PurgeHistoryPanel refreshKey={historyKey} />
    </div>
  );
}

interface PurgeRun {
  id: string;
  ran_at: string;
  snapshots_deleted: number;
  events_deleted: number;
  snapshot_days: number | null;
  events_days: number | null;
  source: string;
  error: string | null;
}

function PurgeHistoryPanel({ refreshKey }: { refreshKey: number }) {
  const [runs, setRuns] = useState<PurgeRun[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("proctoring_purge_runs")
      .select("id,ran_at,snapshots_deleted,events_deleted,snapshot_days,events_days,source,error")
      .order("ran_at", { ascending: false })
      .limit(20);
    if (err) {
      setError(err.message);
      setRuns([]);
    } else {
      setRuns((data ?? []) as PurgeRun[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <div className="rounded-md border bg-background/40">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <h4 className="text-xs font-semibold flex items-center gap-1.5">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          Purge history
          {runs && (
            <span className="text-[10px] font-normal text-muted-foreground tabular-nums">
              ({runs.length})
            </span>
          )}
        </h4>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh purge history"
          title="Refresh"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
        </Button>
      </div>

      {loading && !runs ? (
        <div className="px-3 py-4 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin inline mr-1.5" /> Loading…
        </div>
      ) : error ? (
        <div className="px-3 py-4 text-xs text-destructive">{error}</div>
      ) : !runs || runs.length === 0 ? (
        <div className="px-3 py-4 text-xs text-muted-foreground italic">
          No purge runs recorded yet.
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide">When</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide">Source</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide text-right">Snapshots</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide text-right">Events</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide text-right">Window</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-[11px] py-1.5">{fmtTs(r.ran_at)}</TableCell>
                  <TableCell className="text-[11px] py-1.5 capitalize">{r.source}</TableCell>
                  <TableCell className="text-right tabular-nums text-[11px] py-1.5">
                    {r.snapshots_deleted}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-[11px] py-1.5">
                    {r.events_deleted}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-[11px] py-1.5 text-muted-foreground">
                    {r.snapshot_days ?? "—"}d / {r.events_days ?? "—"}d
                  </TableCell>
                  <TableCell className="text-[11px] py-1.5">
                    {r.error ? (
                      <span className="text-destructive truncate inline-block max-w-[200px]" title={r.error}>
                        Error
                      </span>
                    ) : (
                      <span className="text-emerald-600">OK</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

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

function AIFindingsPanel({ attemptId }: { attemptId: string }) {
  const [findings, setFindings] = useState<ProctorFinding[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("assessment_proctor_findings")
      .select("id,severity,finding,created_at,snapshot_id")
      .eq("attempt_id", attemptId)
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      toast.error("Failed to load AI findings", { description: error.message });
      setFindings([]);
      return;
    }
    setFindings((data ?? []) as ProctorFinding[]);
  }, [attemptId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runReview = async () => {
    setReviewing(true);
    try {
      const { error } = await supabase.functions.invoke("assessment-snapshot-review", {
        body: { attempt_id: attemptId },
      });
      if (error) throw error;
      toast.success("AI review triggered");
      await load();
    } catch (e) {
      toast.error("AI review failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setReviewing(false);
    }
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
          {findings && (
            <span className="opacity-70 tabular-nums">({findings.length})</span>
          )}
        </h4>
        <div className="flex items-center gap-2">
          {findings && findings.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <Badge variant="destructive" className="text-[10px]">{counts.high} high</Badge>
              <Badge variant="secondary" className="text-[10px]">{counts.medium} med</Badge>
              <Badge variant="outline" className="text-[10px]">{counts.low} low</Badge>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={runReview}
            disabled={reviewing}
          >
            {reviewing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            Run AI review
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">
          <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1.5" />
          Loading findings…
        </div>
      ) : findings && findings.length > 0 ? (
        <div className="space-y-1.5 max-h-80 overflow-y-auto rounded-md border">
          {findings.map((f) => (
            <div
              key={f.id}
              className={cn(
                "px-3 py-2 text-xs border-b last:border-b-0 flex flex-col gap-1",
                f.severity === "high" && "bg-destructive/5",
                f.severity === "medium" && "bg-amber-500/5"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant={f.severity === "high" ? "destructive" : f.severity === "medium" ? "secondary" : "outline"}
                    className="text-[10px] capitalize"
                  >
                    {f.severity}
                  </Badge>
                  {f.finding.phone_in_frame && (
                    <Badge variant="outline" className="text-[10px]">📱 phone</Badge>
                  )}
                  {f.finding.looking_away && (
                    <Badge variant="outline" className="text-[10px]">👀 away</Badge>
                  )}
                  {typeof f.finding.person_count === "number" && f.finding.person_count !== 1 && (
                    <Badge variant="outline" className="text-[10px]">
                      {f.finding.person_count} people
                    </Badge>
                  )}
                  {f.finding.identity_unclear && (
                    <Badge variant="outline" className="text-[10px]">❓ identity</Badge>
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {fmtTs(f.created_at)}
                </span>
              </div>
              {f.finding.notes && (
                <p className="text-[11px] text-muted-foreground italic">{f.finding.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground py-4 text-center italic">
          No AI findings yet. Snapshots will be reviewed automatically (or click <em>Run AI review</em>).
        </div>
      )}
    </div>
  );
}
