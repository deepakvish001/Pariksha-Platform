import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import AttemptProctoringPanel from "@/b2b/components/AttemptProctoringPanel";
import { AttemptInspector } from "@/components/proctoring/AttemptInspector";
import { OrgShell } from "../layouts/OrgShell";
import { useCurrentOrg } from "../context/OrgContext";
import { useCanProctor } from "../hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, ArrowRight, Camera, ExternalLink, Eye, Monitor, RefreshCw, Search, ShieldAlert,
  Smartphone, ShieldCheck,
} from "lucide-react";

type Attempt = {
  id: string;
  user_id: string;
  assessment_id: string;
  status: string;
  integrity_score: number;
  started_at: string;
  invite?: { email: string; name: string | null } | null;
  assessment?: { id: string; title: string } | null;
};
type Finding = { id: string; attempt_id: string; severity: string; finding: any; created_at: string };
type Event = { id: string; attempt_id: string; kind: string };

const FLAG_EVENTS = new Set([
  "tab_blur", "fullscreen_exit", "copy", "paste", "right_click",
  "typing_burst", "device_changed", "side_eye_lost", "screen_share_lost",
]);

export default function B2BProctoring() {
  const { org, isLoading: orgLoading } = useCurrentOrg();
  const orgId = org?.id;

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [snapCounts, setSnapCounts] = useState<Record<string, { wc: number; sc: number }>>({});
  const [sideCounts, setSideCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | "high" | "live">("flagged");
  const [assessmentFilter, setAssessmentFilter] = useState<string>("all");
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [evidenceLabel, setEvidenceLabel] = useState<string>("");

  const refresh = async () => {
    if (!orgId) return;
    setLoading(true);
    const aRes = await supabase
      .from("assessments")
      .select("id")
      .eq("org_id", orgId);
    const assessmentIds = (aRes.data ?? []).map((r: any) => r.id);
    if (assessmentIds.length === 0) {
      setAttempts([]); setFindings([]); setEvents([]); setLoading(false);
      return;
    }
    const att = await supabase
      .from("assessment_attempts")
      .select("id,user_id,assessment_id,status,integrity_score,started_at, invite:assessment_invites(email,name), assessment:assessments(id,title)")
      .in("assessment_id", assessmentIds)
      .order("started_at", { ascending: false })
      .limit(500);
    const rows = (att.data ?? []) as unknown as Attempt[];
    setAttempts(rows);
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) { setLoading(false); return; }

    const [f, e, snaps, sides] = await Promise.all([
      supabase.from("assessment_proctor_findings").select("id,attempt_id,severity,finding,created_at").in("attempt_id", ids).limit(3000),
      supabase.from("attempt_events").select("id,attempt_id,kind").in("attempt_id", ids).limit(5000),
      supabase.from("assessment_proctor_snapshots").select("attempt_id,source").in("attempt_id", ids).limit(8000),
      supabase.from("assessment_side_camera_frames").select("attempt_id").in("attempt_id", ids).limit(8000),
    ]);
    setFindings((f.data ?? []) as Finding[]);
    setEvents((e.data ?? []) as Event[]);

    const sc: Record<string, { wc: number; sc: number }> = {};
    for (const r of (snaps.data ?? []) as { attempt_id: string; source: string }[]) {
      const cur = sc[r.attempt_id] ?? { wc: 0, sc: 0 };
      if (r.source === "screen") cur.sc++; else cur.wc++;
      sc[r.attempt_id] = cur;
    }
    setSnapCounts(sc);

    const sd: Record<string, number> = {};
    for (const r of (sides.data ?? []) as { attempt_id: string }[]) {
      sd[r.attempt_id] = (sd[r.attempt_id] ?? 0) + 1;
    }
    setSideCounts(sd);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase.channel(`b2b-proctor-${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "assessment_proctor_findings" }, () => void refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "assessment_attempts" }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [orgId]);

  const assessmentOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of attempts) if (a.assessment) m.set(a.assessment.id, a.assessment.title);
    return Array.from(m.entries()).map(([id, title]) => ({ id, title }));
  }, [attempts]);

  const rows = useMemo(() => {
    const findingsBy = new Map<string, Finding[]>();
    for (const f of findings) {
      const arr = findingsBy.get(f.attempt_id) ?? [];
      arr.push(f); findingsBy.set(f.attempt_id, arr);
    }
    const eventsBy = new Map<string, Event[]>();
    for (const ev of events) {
      const arr = eventsBy.get(ev.attempt_id) ?? [];
      arr.push(ev); eventsBy.set(ev.attempt_id, arr);
    }
    return attempts.map((a) => {
      const fs = findingsBy.get(a.id) ?? [];
      const evs = eventsBy.get(a.id) ?? [];
      const high = fs.filter((x) => x.severity === "high" || x.severity === "critical").length;
      const med = fs.filter((x) => x.severity === "medium").length;
      const violations = evs.filter((x) => FLAG_EVENTS.has(x.kind)).length;
      return { a, fs, high, med, violations };
    });
  }, [attempts, findings, events]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(({ a, high, med, violations }) => {
      if (assessmentFilter !== "all" && a.assessment_id !== assessmentFilter) return false;
      if (filter === "high" && high === 0) return false;
      if (filter === "flagged" && high === 0 && med === 0 && violations === 0) return false;
      if (filter === "live" && a.status !== "in_progress") return false;
      if (!needle) return true;
      const hay = `${a.invite?.email ?? ""} ${a.invite?.name ?? ""} ${a.assessment?.title ?? ""}`.toLowerCase();
      return hay.includes(needle);
    }).sort((x, y) => (y.high - x.high) || (y.violations - x.violations));
  }, [rows, q, filter, assessmentFilter]);

  const summary = useMemo(() => {
    const live = rows.filter((r) => r.a.status === "in_progress").length;
    const flagged = rows.filter((r) => r.high > 0 || r.med > 0 || r.violations > 0).length;
    const high = rows.filter((r) => r.high > 0).length;
    return { total: rows.length, live, flagged, high };
  }, [rows]);

  if (orgLoading) return <OrgShell title="Proctoring"><div /></OrgShell>;
  if (!org) return <OrgShell title="Proctoring"><div className="b2b-card p-6 text-sm">No organization found.</div></OrgShell>;

  return <ProctoringContent
    org={org} loading={loading} refresh={refresh} rows={rows} filtered={filtered}
    summary={summary} assessmentOptions={assessmentOptions}
    q={q} setQ={setQ} filter={filter} setFilter={setFilter}
    assessmentFilter={assessmentFilter} setAssessmentFilter={setAssessmentFilter}
    snapCounts={snapCounts} sideCounts={sideCounts}
    inspectingId={inspectingId} setInspectingId={setInspectingId}
  />;
}

function ProctoringContent(props: any) {
  const { org, loading, refresh, filtered, summary, assessmentOptions,
    q, setQ, filter, setFilter, assessmentFilter, setAssessmentFilter,
    snapCounts, sideCounts, inspectingId, setInspectingId } = props;
  const { canProctor, isLoading: permLoading } = useCanProctor(org.id);

  if (permLoading) return <OrgShell title="Proctoring"><div className="b2b-card p-6 text-sm text-muted-foreground">Checking permissions…</div></OrgShell>;
  if (!canProctor) {
    return (
      <OrgShell title="Proctoring">
        <div className="b2b-card p-8 max-w-xl mx-auto text-center">
          <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-amber-500" />
          <h2 className="text-base font-semibold mb-1">Restricted area</h2>
          <p className="text-sm text-muted-foreground">
            Proctoring evidence and AI reviews are limited to organization owners,
            admins, and members with the <span className="font-medium">Proctor</span> role.
            Ask an admin to update your role from the Team page if you need access.
          </p>
        </div>
      </OrgShell>
    );
  }

  return (
    <OrgShell title="Proctoring monitor">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Total attempts</div>
          <div className="text-2xl font-semibold">{summary.total}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Live now</div>
          <div className="text-2xl font-semibold">{summary.live}</div>
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
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm">All attempts across {org.name}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Candidate or assessment" className="h-8 pl-7 w-64" />
            </div>
            <Select value={assessmentFilter} onValueChange={setAssessmentFilter}>
              <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assessments</SelectItem>
                {assessmentOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="high">High severity</SelectItem>
                <SelectItem value="live">Live now</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground p-8 text-center">
              {loading ? "Loading…" : "No attempts match these filters."}
            </p>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {filtered.map(({ a, high, med, violations }) => {
                const ev = snapCounts[a.id] ?? { wc: 0, sc: 0 };
                const sd = sideCounts[a.id] ?? 0;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setInspectingId(a.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-sm text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.invite?.name ?? a.invite?.email ?? a.user_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.assessment?.title}</div>
                    </div>
                    {a.status === "in_progress" && (
                      <Badge className="h-5 text-[10px] bg-emerald-500/15 text-emerald-700 border-emerald-500/30" variant="outline">live</Badge>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Badge variant="secondary" className="h-5 gap-1"><Camera className="h-3 w-3" />{ev.wc}</Badge>
                      <Badge variant="secondary" className="h-5 gap-1"><Monitor className="h-3 w-3" />{ev.sc}</Badge>
                      <Badge variant="secondary" className="h-5 gap-1"><Smartphone className="h-3 w-3" />{sd}</Badge>
                    </div>
                    <div className="flex items-center gap-1 min-w-[180px] justify-end">
                      {high > 0 && <Badge variant="outline" className="h-5 text-[10px] bg-red-500/15 text-red-600 border-red-500/30">{high} high</Badge>}
                      {med > 0 && <Badge variant="outline" className="h-5 text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30">{med} med</Badge>}
                      {violations > 0 && <Badge variant="outline" className="h-5 text-[10px]">{violations} viol.</Badge>}
                      {high === 0 && med === 0 && violations === 0 && (
                        <Badge variant="outline" className="h-5 text-[10px] bg-emerald-500/15 text-emerald-700 border-emerald-500/30">clean</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground w-16 text-right">{a.integrity_score}</div>
                    <Link
                      to={`/b2b/assessments/${a.assessment_id}/attempts/${a.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Open full attempt page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AttemptInspector
        attemptId={inspectingId}
        open={!!inspectingId}
        onClose={() => setInspectingId(null)}
      />
    </OrgShell>
  );
}
