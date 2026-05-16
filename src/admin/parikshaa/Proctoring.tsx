import { Fragment, useEffect, useMemo, useState } from "react";
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
import { Download, RefreshCw, ChevronDown, ChevronRight, Camera, ShieldAlert, Loader2 } from "lucide-react";
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

const VIOLATION_KINDS = new Set([
  "violation_strike",
  "tab_hidden",
  "window_blur",
  "fullscreen_exit",
  "webcam_lost",
  "lockdown_fail",
  "devtools_attempt",
  "print_blocked",
  "auto_submitted",
]);

const STATUS_OPTIONS = ["all", "in_progress", "submitted", "auto_submitted", "abandoned"];

export default function ParikshaaProctoring() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [assessments, setAssessments] = useState<{ id: string; title: string }[]>([]);

  // filters
  const [assessmentId, setAssessmentId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [minViolations, setMinViolations] = useState<string>("0");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [expanded, setExpanded] = useState<Record<string, AttemptEvent[] | "loading">>({});

  const load = async () => {
    setLoading(true);
    try {
      const { data: att, error } = await supabase
        .from("assessment_attempts")
        .select(
          "id,user_id,assessment_id,status,violations,integrity_score,started_at,submitted_at,assessments(title)"
        )
        .order("started_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const ids = (att ?? []).map((a) => a.id);
      let snapMap = new Map<string, { count: number; first: string | null; last: string | null }>();
      if (ids.length > 0) {
        const { data: ev } = await supabase
          .from("attempt_events")
          .select("attempt_id,created_at")
          .eq("kind", "webcam_snapshot")
          .in("attempt_id", ids);
        for (const e of ev ?? []) {
          const prev = snapMap.get(e.attempt_id) ?? { count: 0, first: null, last: null };
          prev.count += 1;
          if (!prev.first || e.created_at < prev.first) prev.first = e.created_at;
          if (!prev.last || e.created_at > prev.last) prev.last = e.created_at;
          snapMap.set(e.attempt_id, prev);
        }
      }

      const mapped: AttemptRow[] = (att ?? []).map((a: any) => {
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
      setRows(mapped);

      // assessments dropdown
      const uniq = Array.from(
        new Map(
          mapped
            .filter((r) => r.assessment_title !== "—")
            .map((r) => [r.assessment_id, { id: r.assessment_id, title: r.assessment_title }])
        ).values()
      );
      setAssessments(uniq);
    } catch (e: any) {
      toast.error("Failed to load attempts", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const min = parseInt(minViolations || "0", 10) || 0;
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() : null;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (assessmentId !== "all" && r.assessment_id !== assessmentId) return false;
      if (status !== "all" && r.status !== status) return false;
      if (r.violations < min) return false;
      const t = new Date(r.started_at).getTime();
      if (fromTs && t < fromTs) return false;
      if (toTs && t > toTs) return false;
      if (q && !(r.user_id.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.assessment_title.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, assessmentId, status, minViolations, from, to, search]);

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

  const exportCsv = () => {
    const headers = [
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
    ];
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(",")];
    for (const r of filtered) {
      lines.push(
        [
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
        ]
          .map(esc)
          .join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proctoring-attempts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} rows`);
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
            <Button size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
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

      {/* Filters */}
      <div className="rounded-lg border bg-card p-3 grid gap-3 md:grid-cols-6">
        <div className="md:col-span-2 space-y-1">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="User ID, attempt ID, or assessment title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Assessment</Label>
          <Select value={assessmentId} onValueChange={setAssessmentId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {assessments.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Min violations</Label>
          <Input type="number" min={0} value={minViolations} onChange={(e) => setMinViolations(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1 md:col-start-6">
          <Label className="text-xs">To</Label>
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No attempts match the current filters.
              </TableCell></TableRow>
            ) : (
              filtered.map((r) => {
                const open = !!expanded[r.id];
                const events = expanded[r.id];
                return (
                  <>
                    <TableRow key={r.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => toggleExpand(r.id)}>
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
                    </TableRow>
                    {open && (
                      <TableRow key={`${r.id}-exp`} className="bg-muted/20 hover:bg-muted/20">
                        <TableCell />
                        <TableCell colSpan={8} className="py-3">
                          {events === "loading" ? (
                            <div className="text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin inline mr-1" /> Loading events…</div>
                          ) : (
                            <EventTimeline events={events as AttemptEvent[]} />
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EventTimeline({ events }: { events: AttemptEvent[] }) {
  if (events.length === 0) return <div className="text-xs text-muted-foreground">No proctoring events.</div>;
  const snapshots = events.filter((e) => e.kind === "webcam_snapshot");
  const violations = events.filter((e) => VIOLATION_KINDS.has(e.kind));
  const other = events.filter((e) => e.kind !== "webcam_snapshot" && !VIOLATION_KINDS.has(e.kind));
  return (
    <div className="grid md:grid-cols-3 gap-4 text-xs">
      <Group title="Violations" tone="amber" items={violations} />
      <Group title="Webcam snapshots" tone="emerald" items={snapshots} showPath />
      <Group title="Other events" tone="muted" items={other} />
    </div>
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
