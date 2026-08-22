import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, ArrowRight, Camera, Monitor, RefreshCw, Search, Smartphone, ShieldAlert,
} from "lucide-react";

type Attempt = {
  id: string;
  user_id: string;
  status: string;
  integrity_score: number;
  started_at: string;
  submitted_at: string | null;
  invite?: { email: string; name: string | null } | null;
};

type Finding = { id: string; attempt_id: string; severity: string; finding: any; created_at: string };
type Event = { id: string; attempt_id: string; kind: string; created_at: string };
type CountRow = { attempt_id: string; n: number };

const FLAG_EVENTS = new Set([
  "tab_blur", "fullscreen_exit", "copy", "paste", "right_click",
  "typing_burst", "device_changed", "side_eye_lost", "screen_share_lost",
]);

export default function ProctoringTriagePanel({ assessmentId }: { assessmentId: string }) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [snapCounts, setSnapCounts] = useState<Record<string, number>>({});
  const [sideCounts, setSideCounts] = useState<Record<string, number>>({});
  const [screenCounts, setScreenCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | "high" | "clean">("flagged");

  const refresh = async () => {
    setLoading(true);
    const att = await supabase
      .from("assessment_attempts")
      .select("id,user_id,status,integrity_score,started_at,submitted_at, invite:assessment_invites(email,name)")
      .eq("assessment_id", assessmentId)
      .order("started_at", { ascending: false })
      .limit(500);
    const rows = (att.data ?? []) as unknown as Attempt[];
    setAttempts(rows);
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) { setLoading(false); return; }

    const [f, e, snaps, sides] = await Promise.all([
      supabase.from("assessment_proctor_findings")
        .select("id,attempt_id,severity,finding,created_at")
        .in("attempt_id", ids).order("created_at", { ascending: false }).limit(2000),
      supabase.from("attempt_events")
        .select("id,attempt_id,kind,created_at")
        .in("attempt_id", ids).order("created_at", { ascending: false }).limit(4000),
      supabase.from("assessment_proctor_snapshots")
        .select("attempt_id,source")
        .in("attempt_id", ids).limit(5000),
      supabase.from("assessment_side_camera_frames")
        .select("attempt_id")
        .in("attempt_id", ids).limit(5000),
    ]);

    setFindings((f.data ?? []) as Finding[]);
    setEvents((e.data ?? []) as Event[]);

    const sc: Record<string, number> = {};
    const scr: Record<string, number> = {};
    for (const r of (snaps.data ?? []) as { attempt_id: string; source: string }[]) {
      if (r.source === "screen") scr[r.attempt_id] = (scr[r.attempt_id] ?? 0) + 1;
      else sc[r.attempt_id] = (sc[r.attempt_id] ?? 0) + 1;
    }
    setSnapCounts(sc);
    setScreenCounts(scr);

    const sd: Record<string, number> = {};
    for (const r of (sides.data ?? []) as { attempt_id: string }[]) {
      sd[r.attempt_id] = (sd[r.attempt_id] ?? 0) + 1;
    }
    setSideCounts(sd);

    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [assessmentId]);

  useEffect(() => {
    const ch = supabase.channel(`triage-${assessmentId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "assessment_proctor_findings" }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [assessmentId]);

  const rows = useMemo(() => {
    const findingsBy = new Map<string, Finding[]>();
    for (const f of findings) {
      const arr = findingsBy.get(f.attempt_id) ?? [];
      arr.push(f);
      findingsBy.set(f.attempt_id, arr);
    }
    const eventsBy = new Map<string, Event[]>();
    for (const ev of events) {
      const arr = eventsBy.get(ev.attempt_id) ?? [];
      arr.push(ev);
      eventsBy.set(ev.attempt_id, arr);
    }
    return attempts.map((a) => {
      const fs = findingsBy.get(a.id) ?? [];
      const evs = eventsBy.get(a.id) ?? [];
      const high = fs.filter((x) => x.severity === "high" || x.severity === "critical").length;
      const med = fs.filter((x) => x.severity === "medium").length;
      const violations = evs.filter((x) => FLAG_EVENTS.has(x.kind)).length;
      return { a, fs, evs, high, med, violations };
    });
  }, [attempts, findings, events]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(({ a, high, med, violations }) => {
      if (filter === "high" && high === 0) return false;
      if (filter === "flagged" && high === 0 && med === 0 && violations === 0) return false;
      if (filter === "clean" && (high > 0 || med > 0 || violations > 0)) return false;
      if (!needle) return true;
      const hay = `${a.invite?.email ?? ""} ${a.invite?.name ?? ""}`.toLowerCase();
      return hay.includes(needle);
    }).sort((x, y) => (y.high - x.high) || (y.violations - x.violations));
  }, [rows, q, filter]);

  const summary = useMemo(() => {
    const total = rows.length;
    const flagged = rows.filter((r) => r.high > 0 || r.med > 0 || r.violations > 0).length;
    const high = rows.filter((r) => r.high > 0).length;
    return { total, flagged, high };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Attempts</div>
          <div className="text-2xl font-semibold">{summary.total}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Flagged</div>
          <div className="text-2xl font-semibold text-amber-600">{summary.flagged}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> High severity</div>
          <div className="text-2xl font-semibold text-red-600">{summary.high}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm">Proctoring triage</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email or name" className="h-8 pl-7 w-56" />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="flagged">Flagged only</SelectItem>
                <SelectItem value="high">High severity</SelectItem>
                <SelectItem value="clean">Clean</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={refresh} disabled={loading} aria-label="Refresh">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground p-6 text-center">
              {loading ? "Loading…" : "No attempts match this filter."}
            </p>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {filtered.map(({ a, fs, high, med, violations }) => {
                const wc = snapCounts[a.id] ?? 0;
                const sc = screenCounts[a.id] ?? 0;
                const sd = sideCounts[a.id] ?? 0;
                const topFinding = fs[0];
                const flags = topFinding ? [
                  topFinding.finding?.phone_in_frame && "phone",
                  topFinding.finding?.looking_away && "away",
                  typeof topFinding.finding?.person_count === "number" && topFinding.finding?.person_count !== 1 && `${topFinding.finding.person_count} people`,
                  topFinding.finding?.identity_unclear && "identity unclear",
                ].filter(Boolean) as string[] : [];
                return (
                  <Link
                    key={a.id}
                    to={`/b2b/assessments/${assessmentId}/attempts/${a.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.invite?.name ?? a.invite?.email ?? a.user_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.invite?.email}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Badge variant="secondary" className="h-5 gap-1"><Camera className="h-3 w-3" />{wc}</Badge>
                      <Badge variant="secondary" className="h-5 gap-1"><Monitor className="h-3 w-3" />{sc}</Badge>
                      <Badge variant="secondary" className="h-5 gap-1"><Smartphone className="h-3 w-3" />{sd}</Badge>
                    </div>
                    <div className="flex items-center gap-1 min-w-[160px] justify-end">
                      {high > 0 && <Badge variant="outline" className="h-5 text-[10px] bg-red-500/15 text-red-600 border-red-500/30">{high} high</Badge>}
                      {med > 0 && <Badge variant="outline" className="h-5 text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30">{med} med</Badge>}
                      {violations > 0 && <Badge variant="outline" className="h-5 text-[10px]">{violations} viol.</Badge>}
                      {high === 0 && med === 0 && violations === 0 && (
                        <Badge variant="outline" className="h-5 text-[10px] bg-emerald-500/15 text-emerald-700 border-emerald-500/30">clean</Badge>
                      )}
                    </div>
                    <div className="hidden md:block text-xs text-muted-foreground w-44 truncate">
                      {flags.length ? flags.join(" · ") : <span className="opacity-50">—</span>}
                    </div>
                    <div className="text-xs text-muted-foreground w-16 text-right">{a.integrity_score}</div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
