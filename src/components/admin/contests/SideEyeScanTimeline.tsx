import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Smartphone, AlertTriangle, Activity } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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

const sevColor: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  critical: "bg-red-500/25 text-red-300 border-red-500/50",
};

/**
 * Admin: timeline of the most recent N SideEye frame analyses for a session,
 * a severity & flag-kind breakdown, an audit log, and a Download Report button.
 */
export const SideEyeScanTimeline = ({ sessionId, limit = 50 }: Props) => {
  const [frames, setFrames] = useState<FrameRow[] | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [downloading, setDownloading] = useState(false);

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
          .limit(50),
      ]);
      if (!alive) return;
      setFrames((f as FrameRow[]) ?? []);
      setAudit((a as AuditRow[]) ?? []);
    };
    load();

    const ch = supabase
      .channel(`sec-timeline:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contest_side_camera_frames", filter: `session_id=eq.${sessionId}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contest_side_camera_audit_logs", filter: `session_id=eq.${sessionId}` },
        () => load(),
      )
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [sessionId, limit]);

  const breakdown = useMemo(() => {
    const sev: Record<string, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
    const kind: Record<string, number> = {};
    (frames ?? []).forEach((f) => {
      sev[f.severity] = (sev[f.severity] ?? 0) + 1;
      const s = f.ai_summary ?? {};
      if (s.secondary_device) kind.secondary_device = (kind.secondary_device ?? 0) + 1;
      if (s.extra_person) kind.extra_person = (kind.extra_person ?? 0) + 1;
      if (s.candidate_absent) kind.candidate_absent = (kind.candidate_absent ?? 0) + 1;
      if (s.earpiece_visible) kind.earpiece_visible = (kind.earpiece_visible ?? 0) + 1;
      if (s.looking_down_at_notes) kind.looking_down_at_notes = (kind.looking_down_at_notes ?? 0) + 1;
    });
    return { sev, kind };
  }, [frames]);

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

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Side camera scan timeline</h3>
        </div>
        <Button size="sm" variant="outline" onClick={downloadReport} disabled={downloading}>
          {downloading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
          Download integrity report
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(["info", "low", "medium", "high", "critical"] as const).map((s) => (
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
          Last {frames?.length ?? 0} frame{frames?.length === 1 ? "" : "s"}
        </h4>
        <div className="max-h-72 overflow-auto divide-y divide-border/40 border border-border/40 rounded">
          {(frames ?? []).map((f) => {
            const s = f.ai_summary ?? {};
            const tags = ["secondary_device", "extra_person", "candidate_absent", "earpiece_visible", "looking_down_at_notes"]
              .filter((k) => s[k]);
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
          {frames && frames.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground">No frames analyzed yet.</div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground flex items-center gap-1">
          <Activity className="h-3 w-3" /> Audit log
        </h4>
        <div className="max-h-48 overflow-auto divide-y divide-border/40 border border-border/40 rounded">
          {(audit ?? []).map((a) => (
            <div key={a.id} className="px-2 py-1 text-[11px] flex items-center justify-between">
              <span className="font-mono">{format(new Date(a.created_at), "HH:mm:ss")}</span>
              <span className="font-medium">{a.event_type}</span>
              <Badge variant="outline" className={`${sevColor[a.severity] ?? ""} text-[9px]`}>{a.severity}</Badge>
            </div>
          ))}
          {audit && audit.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground">No audit events yet.</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SideEyeScanTimeline;
