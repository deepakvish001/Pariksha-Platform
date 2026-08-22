import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RefreshCw, Filter, Radio } from "lucide-react";
import { format } from "date-fns";

interface ChainRow {
  id: string;
  session_id: string;
  user_id: string;
  seq: number;
  kind: string;
  storage_path: string | null;
  payload: any;
  created_at: string;
}

const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
const sevRank: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
const sevTone: Record<string, string> = {
  info: "border-muted text-muted-foreground",
  low: "border-emerald-500/40 text-emerald-300",
  medium: "border-amber-500/40 text-amber-300",
  high: "border-orange-500/50 text-orange-300",
  critical: "border-red-500/50 text-red-300",
};

/**
 * Live scrolling history of evidence-chain events across all sessions in this contest.
 * Severity filter narrows the view; new inserts stream in via Realtime.
 *
 * Note: filter is applied client-side because we already cap the feed at 200 rows.
 */
export const SideEyeAnomalyHistory = ({
  contestId,
  sessionIds,
}: {
  contestId: string;
  sessionIds: string[];
}) => {
  const PREFS_KEY = "sideeye:anomalyHistory:prefs:v1";
  const loadPrefs = () => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { autoRefresh?: boolean; intervalSec?: number; minSev?: string };
    } catch { return null; }
  };
  const initialPrefs = loadPrefs();
  const [rows, setRows] = useState<ChainRow[]>([]);
  const [minSev, setMinSev] = useState<(typeof SEVERITIES)[number]>(
    (initialPrefs?.minSev as any) ?? "info",
  );
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(initialPrefs?.autoRefresh ?? true);
  const [intervalSec, setIntervalSec] = useState<number>(initialPrefs?.intervalSec ?? 15);
  const pollRef = useRef<number | null>(null);

  // Persist preferences whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ autoRefresh, intervalSec, minSev }));
    } catch { /* ignore quota */ }
  }, [autoRefresh, intervalSec, minSev]);

  const load = async () => {
    if (sessionIds.length === 0) { setRows([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("sideeye_evidence_chain")
      .select("id,session_id,user_id,seq,kind,storage_path,payload,created_at")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as ChainRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`sideeye-history-${contestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sideeye_evidence_chain" },
        (payload) => {
          const row = payload.new as ChainRow;
          if (!sessionIds.includes(row.session_id)) return;
          setRows((prev) => [row, ...prev].slice(0, 200));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId, sessionIds.join(",")]);

  // Auto-refresh polling — supplements realtime subscription so admins see fresh
  // counts even if the realtime channel temporarily drops.
  useEffect(() => {
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
    if (!autoRefresh) return;
    pollRef.current = window.setInterval(() => { load(); }, intervalSec * 1000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, intervalSec, sessionIds.join(",")]);

  const filtered = useMemo(
    () => rows.filter((r) => (sevRank[r.payload?.severity ?? "info"] ?? 0) >= sevRank[minSev]),
    [rows, minSev],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
    rows.forEach((r) => { c[r.payload?.severity ?? "info"] = (c[r.payload?.severity ?? "info"] ?? 0) + 1; });
    return c;
  }, [rows]);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Anomaly history
          <Badge variant="outline" className="text-[10px]">
            {filtered.length} of {rows.length}
          </Badge>
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <Select value={minSev} onValueChange={(v) => setMinSev(v as any)}>
            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize text-xs">≥ {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 pl-1 border-l border-border/40">
            <Radio className={`h-3 w-3 ${autoRefresh ? "text-emerald-400" : "text-muted-foreground"}`} />
            <span className="text-[10px] text-muted-foreground">Auto</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} className="scale-75" aria-label="Auto-refresh" />
            {autoRefresh && (
              <Select value={String(intervalSec)} onValueChange={(v) => setIntervalSec(Number(v))}>
                <SelectTrigger className="h-7 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 30, 60].map((s) => (
                    <SelectItem key={s} value={String(s)} className="text-xs">{s}s</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {SEVERITIES.map((s) => (
          <div key={s} className={`rounded border px-2 py-1 text-[10px] ${sevTone[s]}`}>
            <div className="uppercase opacity-70">{s}</div>
            <div className="text-sm font-semibold">{counts[s] ?? 0}</div>
          </div>
        ))}
      </div>

      <ScrollArea className="h-72 border border-border/40 rounded">
        <ul className="divide-y divide-border/30">
          {filtered.map((r) => {
            const sev = r.payload?.severity ?? "info";
            const notes = r.payload?.summary?.notes ?? r.payload?.summary?.note ?? "";
            return (
              <li key={r.id} className="px-2 py-1.5 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className={`${sevTone[sev]} text-[10px]`}>{sev}</Badge>
                  <span className="font-mono text-muted-foreground shrink-0">
                    {format(new Date(r.created_at), "HH:mm:ss")}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    #{r.seq} · {r.user_id.slice(0, 6)}
                  </span>
                  <span className="truncate">{notes || `(${r.kind})`}</span>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="p-6 text-xs text-center text-muted-foreground">
              No anomalies at this severity yet.
            </li>
          )}
        </ul>
      </ScrollArea>
    </Card>
  );
};

export default SideEyeAnomalyHistory;
