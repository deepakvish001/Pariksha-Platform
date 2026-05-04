import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, Smartphone, AlertTriangle, Activity, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { SideEyeAuditDetailsDrawer } from "./SideEyeAuditDetailsDrawer";

interface FrameRow {
  id: string;
  captured_at: string;
  severity: string;
  ai_summary: any;
  storage_path: string;
}

interface AuditRow {
  id: string;
  created_at: string;
  event_type: string;
  severity: string;
  detail: any;
}

interface Props {
  sessionId: string;
  limit?: number;
}

const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
const KINDS = ["secondary_device", "extra_person", "candidate_absent", "earpiece_visible", "looking_down_at_notes"];

const sevColor: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  critical: "bg-red-500/25 text-red-300 border-red-500/50",
};

const sevRank: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

const AUDIT_PAGE_SIZE = 15;

export const SideEyeScanTimeline = ({ sessionId, limit = 100 }: Props) => {
  const [frames, setFrames] = useState<FrameRow[] | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Frame filters
  const [minSev, setMinSev] = useState<(typeof SEVERITIES)[number]>("info");
  const [kindFilter, setKindFilter] = useState<string>("all");

  // Audit search & pagination
  const [auditQuery, setAuditQuery] = useState("");
  const [auditSev, setAuditSev] = useState<string>("all");
  const [auditEvent, setAuditEvent] = useState<string>("all");
  const [auditPage, setAuditPage] = useState(0);
  const [drawerEvent, setDrawerEvent] = useState<AuditRow | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [{ data: f }, { data: a }] = await Promise.all([
        supabase
          .from("contest_side_camera_frames")
          .select("id,captured_at,severity,ai_summary,storage_path")
          .eq("session_id", sessionId)
          .order("captured_at", { ascending: false })
          .limit(limit),
        supabase
          .from("contest_side_camera_audit_logs")
          .select("id,created_at,event_type,severity,detail")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      if (!alive) return;
      setFrames((f as FrameRow[]) ?? []);
      setAudit((a as AuditRow[]) ?? []);
    };
    load();

    const ch = supabase
      .channel(`sec-timeline:${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contest_side_camera_frames", filter: `session_id=eq.${sessionId}` }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contest_side_camera_audit_logs", filter: `session_id=eq.${sessionId}` }, () => load())
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [sessionId, limit]);

  // Filtered frames
  const filteredFrames = useMemo(() => {
    return (frames ?? []).filter((f) => {
      if ((sevRank[f.severity] ?? 0) < (sevRank[minSev] ?? 0)) return false;
      if (kindFilter !== "all" && !f.ai_summary?.[kindFilter]) return false;
      return true;
    });
  }, [frames, minSev, kindFilter]);

  const breakdown = useMemo(() => {
    const sev: Record<string, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
    const kind: Record<string, number> = {};
    filteredFrames.forEach((f) => {
      sev[f.severity] = (sev[f.severity] ?? 0) + 1;
      const s = f.ai_summary ?? {};
      KINDS.forEach((k) => { if (s[k]) kind[k] = (kind[k] ?? 0) + 1; });
    });
    return { sev, kind };
  }, [filteredFrames]);

  // Audit filters
  const filteredAudit = useMemo(() => {
    const q = auditQuery.trim().toLowerCase();
    return (audit ?? []).filter((a) => {
      if (auditSev !== "all" && a.severity !== auditSev) return false;
      if (auditEvent !== "all" && a.event_type !== auditEvent) return false;
      if (q) {
        const blob = `${a.event_type} ${a.severity} ${JSON.stringify(a.detail ?? {})}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [audit, auditQuery, auditSev, auditEvent]);

  const auditEvents = useMemo(
    () => Array.from(new Set((audit ?? []).map((a) => a.event_type))).sort(),
    [audit],
  );

  const auditPages = Math.max(1, Math.ceil(filteredAudit.length / AUDIT_PAGE_SIZE));
  const pagedAudit = filteredAudit.slice(auditPage * AUDIT_PAGE_SIZE, (auditPage + 1) * AUDIT_PAGE_SIZE);

  useEffect(() => { setAuditPage(0); }, [auditQuery, auditSev, auditEvent]);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contest-sideeye-report`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `sideeye-report-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Report downloaded");
    } catch (e: any) {
      toast.error("Download failed", { description: e?.message });
    } finally {
      setDownloading(false);
    }
  };

  const downloadFilteredWindow = () => {
    try {
      const payload = {
        session_id: sessionId,
        exported_at: new Date().toISOString(),
        filters: { min_severity: minSev, kind: kindFilter },
        frame_count: filteredFrames.length,
        frames: filteredFrames,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `sideeye-window-${sessionId}-${minSev}-${kindFilter}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Exported ${filteredFrames.length} frame(s)`);
    } catch (e: any) {
      toast.error("Export failed", { description: e?.message });
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Side camera scan timeline</h3>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={downloadFilteredWindow} disabled={!filteredFrames.length}>
            <Download className="mr-1 h-3 w-3" /> Export window ({filteredFrames.length})
          </Button>
          <Button size="sm" variant="outline" onClick={downloadReport} disabled={downloading}>
            {downloading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
            Full report
          </Button>
        </div>
      </div>

      {/* Frame filters */}
      <div className="flex flex-wrap items-center gap-2 rounded border border-border/40 px-2 py-1.5 bg-muted/20">
        <Filter className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">Min severity</span>
        <Select value={minSev} onValueChange={(v) => setMinSev(v as any)}>
          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SEVERITIES.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-[11px] text-muted-foreground ml-2">Kind</span>
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All kinds</SelectItem>
            {KINDS.map((k) => <SelectItem key={k} value={k} className="text-xs">{k.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setMinSev("high"); setKindFilter("all"); }}>
          High+ only
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {SEVERITIES.map((s) => (
          <div key={s} className={`rounded border px-2 py-1.5 text-xs ${sevColor[s]}`}>
            <div className="uppercase tracking-wide opacity-70">{s}</div>
            <div className="text-base font-semibold">{breakdown.sev[s] ?? 0}</div>
          </div>
        ))}
      </div>

      {Object.keys(breakdown.kind).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(breakdown.kind).map(([k, v]) => (
            <Badge key={k} variant="secondary" className="text-[10px]">
              <AlertTriangle className="mr-1 h-3 w-3" /> {k.replace(/_/g, " ")}: {v}
            </Badge>
          ))}
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">
          {filteredFrames.length} frame{filteredFrames.length === 1 ? "" : "s"} (of {frames?.length ?? 0})
        </h4>
        <div className="max-h-72 overflow-auto divide-y divide-border/40 border border-border/40 rounded">
          {filteredFrames.map((f) => {
            const s = f.ai_summary ?? {};
            const tags = KINDS.filter((k) => s[k]);
            return (
              <div key={f.id} className="px-2 py-1.5 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className={`${sevColor[f.severity]} text-[10px]`}>{f.severity}</Badge>
                  <span className="text-muted-foreground shrink-0">
                    {format(new Date(f.captured_at), "HH:mm:ss")}
                  </span>
                  <span className="truncate">{s.notes ?? "(no notes)"}</span>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {tags.map((t) => (
                      <Badge key={t} variant="destructive" className="text-[9px]">{t.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {filteredFrames.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground">No frames match the current filters.</div>
          )}
        </div>
      </div>

      {/* Audit log: search + filter + pagination */}
      <div>
        <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground flex items-center gap-1">
          <Activity className="h-3 w-3" /> Audit log
        </h4>

        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={auditQuery}
              onChange={(e) => setAuditQuery(e.target.value)}
              placeholder="Search event / detail…"
              className="h-7 pl-7 text-xs"
            />
          </div>
          <Select value={auditSev} onValueChange={setAuditSev}>
            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All severities</SelectItem>
              {SEVERITIES.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={auditEvent} onValueChange={setAuditEvent}>
            <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="Event" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All events</SelectItem>
              {auditEvents.map((e) => <SelectItem key={e} value={e} className="text-xs">{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-48 overflow-auto divide-y divide-border/40 border border-border/40 rounded">
          {pagedAudit.map((a) => (
            <button
              type="button"
              key={a.id}
              onClick={() => setDrawerEvent(a)}
              className="w-full text-left px-2 py-1 text-[11px] flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors"
            >
              <span className="font-mono text-muted-foreground shrink-0">{format(new Date(a.created_at), "HH:mm:ss")}</span>
              <span className="font-medium truncate flex-1">{a.event_type}</span>
              <Badge variant="outline" className={`${sevColor[a.severity] ?? ""} text-[9px]`}>{a.severity}</Badge>
            </button>
          ))}
          {pagedAudit.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground">No audit events match.</div>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground">
          <span>{filteredAudit.length} match{filteredAudit.length === 1 ? "" : "es"}</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-6 px-2" disabled={auditPage === 0} onClick={() => setAuditPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span>Page {auditPage + 1} / {auditPages}</span>
            <Button size="sm" variant="ghost" className="h-6 px-2" disabled={auditPage >= auditPages - 1} onClick={() => setAuditPage((p) => Math.min(auditPages - 1, p + 1))}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SideEyeScanTimeline;
