import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { OrgShell } from "../../layouts/OrgShell";
import { useAssessment, useUpdateAssessment } from "../../hooks/useAssessments";
import { useInvites, buildJoinUrl } from "../../hooks/useInvites";
import {
  useLiveParticipants,
  useAssessmentActivity,
  useAssessmentEvidence,
  useForceSubmitAttempt,
  type LiveParticipant,
  type ParticipantStatus,
} from "../../hooks/useAssessmentLive";
import { useCanProctor } from "../../hooks/usePermissions";
import { useCurrentOrg, useOrgBasePath } from "../../context/OrgContext";
import ParticipantDetailDrawer from "../../components/ParticipantDetailDrawer";
import { paths } from "@/lib/routing/paths";
import { RetentionCard } from "@/components/proctoring/RetentionCard";
import { LiveProctorWall } from "../../components/LiveProctorWall";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill, type StatusTone } from "../../components/ui/StatusPill";
import { Input } from "@/components/ui/input";
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
import {
  ArrowLeft,
  Pencil,
  Send,
  Archive,
  Copy,
  Play,
  Activity,
  ShieldAlert,
  Users,
  Search,
  Eye,
  StopCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Camera,
  Monitor,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

type SortKey = "name" | "status" | "elapsed" | "score" | "integrity";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<ParticipantStatus, number> = {
  in_progress: 0,
  joined: 1,
  not_joined: 2,
  submitted: 3,
  auto_submitted: 4,
  abandoned: 5,
};

function elapsedMs(p: LiveParticipant): number | null {
  if (p.status === "in_progress" && p.started_at) {
    return Date.now() - new Date(p.started_at).getTime();
  }
  if (p.submitted_at && p.started_at) {
    return new Date(p.submitted_at).getTime() - new Date(p.started_at).getTime();
  }
  return null;
}
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { formatWindow, getScheduleState } from "../../lib/assessmentSchedule";

const STATUS_LABEL: Record<ParticipantStatus, string> = {
  not_joined: "Not joined",
  joined: "Joined",
  in_progress: "In progress",
  submitted: "Submitted",
  auto_submitted: "Auto-submitted",
  abandoned: "Abandoned",
};

const STATUS_TONE: Record<ParticipantStatus, StatusTone> = {
  not_joined: "neutral",
  joined: "scheduled",
  in_progress: "live",
  submitted: "success",
  auto_submitted: "warning",
  abandoned: "danger",
};

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-[hsl(var(--primary))]/10 blur-3xl" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Tick({ at }: { at: string | null }) {
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);
  if (!at) return <span className="text-muted-foreground">—</span>;
  const ms = Date.now() - new Date(at).getTime();
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return <span className="tabular-nums">{h ? `${h}h ${m % 60}m` : `${m}m ${s % 60}s`}</span>;
}

export default function AssessmentManage() {
  const { id: idOrSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { org } = useCurrentOrg();
  const basePath = useOrgBasePath();
  const { data: assessment, isLoading } = useAssessment(idOrSlug, org?.id);
  const id = assessment?.id;
  const update = useUpdateAssessment();
  const { data: participants } = useLiveParticipants(id);
  const {
    data: eventsData,
    fetchNextPage: fetchMoreEvents,
    hasNextPage: hasMoreEvents,
    isFetchingNextPage: loadingMoreEvents,
  } = useAssessmentActivity(id);
  const events = useMemo(
    () => (eventsData?.pages ?? []).flat(),
    [eventsData]
  );
  const { data: invites } = useInvites(id);
  const { data: evidenceMap } = useAssessmentEvidence(id);
  const forceSubmit = useForceSubmitAttempt();
  const { canProctor } = useCanProctor(org?.id);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ParticipantStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);
  const [showRetention, setShowRetention] = useState(false);
  const resolvedStorageKey = `pariksha:integrity-resolved:${id ?? "_"}`;
  const [resolvedAlerts, setResolvedAlerts] = useState<Record<string, { type: string; at: string }>>({});
  const [showResolved, setShowResolved] = useState(false);

  // Load resolved state from localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(resolvedStorageKey);
      if (raw) setResolvedAlerts(JSON.parse(raw));
      else setResolvedAlerts({});
    } catch {
      setResolvedAlerts({});
    }
  }, [resolvedStorageKey]);

  const persistResolved = (next: Record<string, { type: string; at: string }>) => {
    setResolvedAlerts(next);
    try {
      localStorage.setItem(resolvedStorageKey, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  };

  const alertKey = (attemptId: string, type: string) => `${attemptId}:${type}`;
  const isResolved = (attemptId: string, type: string) => !!resolvedAlerts[alertKey(attemptId, type)];
  const markResolved = (attemptId: string, type: string, label: string) => {
    persistResolved({
      ...resolvedAlerts,
      [alertKey(attemptId, type)]: { type, at: new Date().toISOString() },
    });
    toast.success(`Marked "${label}" alert as resolved`);
  };
  const unmarkResolved = (attemptId: string, type: string) => {
    const next = { ...resolvedAlerts };
    delete next[alertKey(attemptId, type)];
    persistResolved(next);
    toast.message("Alert reopened");
  };

  // Open drawer from ?attempt= query param.
  useEffect(() => {
    const a = searchParams.get("attempt");
    if (!a || !participants) return;
    const p = participants.find((x) => x.attempt_id === a);
    if (p) setSelectedInviteId(p.invite_id);
  }, [searchParams, participants]);

  const selectedParticipant = useMemo(
    () => participants?.find((p) => p.invite_id === selectedInviteId) ?? null,
    [participants, selectedInviteId]
  );

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "score" || k === "integrity" || k === "elapsed" ? "desc" : "asc");
    }
  };

  const counts = useMemo(() => {
    const c = {
      invited: participants?.length ?? 0,
      joined: 0,
      in_progress: 0,
      submitted: 0,
      avg_integrity: 0,
    };
    let intSum = 0;
    let intN = 0;
    for (const p of participants ?? []) {
      if (p.status === "joined") c.joined += 1;
      if (p.status === "in_progress") c.in_progress += 1;
      if (p.status === "submitted" || p.status === "auto_submitted") c.submitted += 1;
      if (p.integrity_score !== null) {
        intSum += p.integrity_score;
        intN += 1;
      }
    }
    c.avg_integrity = intN ? Math.round(intSum / intN) : 100;
    return c;
  }, [participants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = (participants ?? []).filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.email.toLowerCase().includes(q) ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.external_id ?? "").toLowerCase().includes(q)
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    const nullLast = (v: number | null) => (v === null ? Number.POSITIVE_INFINITY : v);
    const sorted = [...rows].sort((a, b) => {
      switch (sortKey) {
        case "name": {
          const an = (a.name ?? a.email ?? "").toLowerCase();
          const bn = (b.name ?? b.email ?? "").toLowerCase();
          return an.localeCompare(bn) * dir;
        }
        case "status":
          return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * dir;
        case "elapsed":
          return (nullLast(elapsedMs(a)) - nullLast(elapsedMs(b))) * dir;
        case "score":
          return (nullLast(a.score) - nullLast(b.score)) * dir;
        case "integrity":
          return (nullLast(a.integrity_score) - nullLast(b.integrity_score)) * dir;
      }
    });
    return sorted;
  }, [participants, query, statusFilter, sortKey, sortDir]);

  if (isLoading) return null;
  if (!assessment) return <Navigate to="/b2b/assessments" replace />;

  // Canonicalise URL: when accessed via UUID, redirect to the slug URL.
  if (assessment.slug && idOrSlug && idOrSlug !== assessment.slug) {
    return <Navigate to={paths.b2b.assessmentManage(basePath, assessment)} replace />;
  }

  const state = getScheduleState(assessment);
  const isPublished = assessment.status === "published";
  const firstInvite = invites?.[0];

  return (
    <OrgShell
      title={assessment.title}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(paths.b2b.assessmentsList(basePath))}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Hub
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(paths.b2b.assessment(basePath, assessment))}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const { supabase } = await import("@/integrations/supabase/client");
              const { data, error } = await supabase.rpc("start_preview_attempt", { _assessment: assessment.id });
              if (error) return toast.error(error.message);
              navigate(`/assessments/${(data as any).id}/play?preview=1`);
            }}
          >
            <Play className="h-4 w-4 mr-1" /> Preview
          </Button>
          {firstInvite && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(buildJoinUrl(firstInvite.token));
                toast.success("Join link copied");
              }}
            >
              <Copy className="h-4 w-4 mr-1" /> Link
            </Button>
          )}
          {!isPublished ? (
            <Button
              size="sm"
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              onClick={async () => {
                await update.mutateAsync({ id: assessment.id, patch: { status: "published" } });
                toast.success("Published");
              }}
            >
              <Send className="h-4 w-4 mr-1" /> Publish
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await update.mutateAsync({ id: assessment.id, patch: { status: "archived" } });
                toast.success("Archived");
              }}
            >
              <Archive className="h-4 w-4 mr-1" /> Archive
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Schedule strip */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span className="text-sm font-medium">{formatWindow(assessment)}</span>
              <Badge variant="outline" className="text-[10px] uppercase">{state}</Badge>
            </div>
            <div className="ml-auto grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              {[
                ["Invited", counts.invited],
                ["Joined", counts.joined],
                ["In progress", counts.in_progress],
                ["Submitted", counts.submitted],
                ["Avg integrity", counts.avg_integrity],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-lg px-3 py-1.5 bg-white/[0.03] border border-white/5">
                  <div className="text-muted-foreground">{label}</div>
                  <div className="text-base font-semibold tabular-nums">{val as number}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {canProctor && (
          <LiveProctorWall
            orgId={org?.id}
            attempts={(participants ?? [])
              .filter((p) => p.status === "in_progress" && p.attempt_id)
              .map((p) => ({
                attempt_id: p.attempt_id as string,
                candidate_name: p.name ?? p.email ?? "Candidate",
              }))}
          />
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Participants */}
          <GlassCard className="lg:col-span-2 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
                <h2 className="text-sm font-semibold">Live participants</h2>
                <Badge variant="outline" className="text-[10px]">{filtered.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, email, id…"
                    className="h-8 pl-7 w-56 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {(["all", "in_progress", "joined", "submitted", "not_joined", "abandoned"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                    statusFilter === s
                      ? "bg-[hsl(var(--primary))]/15 border-[hsl(var(--primary))]/40 text-[hsl(var(--primary))]"
                      : "border-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "All" : STATUS_LABEL[s as ParticipantStatus]}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No candidates match the current filter.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1 b2b-scroll b2b-scroll-slim">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b border-white/5">
                      <SortTh label="Candidate" k="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      <SortTh label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      <SortTh label="Elapsed" k="elapsed" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      <SortTh label="Score" k="score" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      <SortTh label="Integrity" k="integrity" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      {canProctor && <th className="font-medium py-2 px-2 text-left">Evidence</th>}
                      <th className="text-right font-medium py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((p) => (
                      <ParticipantRow
                        key={p.invite_id}
                        p={p}
                        assessmentId={assessment.id}
                        detailHref={
                          p.attempt_id
                            ? paths.b2b.candidate(
                                basePath,
                                assessment,
                                { id: p.attempt_id, slug: p.attempt_slug ?? null },
                                { name: p.name, email: p.email, external_id: p.external_id },
                              )
                            : null
                        }
                        pending={forceSubmit.isPending}
                        evidence={p.attempt_id ? evidenceMap?.[p.attempt_id] : undefined}
                        canProctor={canProctor}
                        onOpen={() => setSelectedInviteId(p.invite_id)}
                        onForceSubmit={() => {
                          if (!p.attempt_id) return;
                          forceSubmit.mutate(
                            { attempt_id: p.attempt_id, assessment_id: assessment.id },
                            {
                              onSuccess: () =>
                                toast.success(`Force-submitted ${p.name ?? p.email}`),
                              onError: (e: any) =>
                                toast.error(e?.message ?? "Failed to force submit"),
                            }
                          );
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* Activity feed */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h2 className="text-sm font-semibold">Activity feed</h2>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto b2b-scroll b2b-scroll-slim pr-1">
              {events.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">No activity yet.</div>
              )}
              {events.map((e) => (
                <div key={e.id} className="rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">
                      {e.candidate?.name ?? e.candidate?.email ?? "Candidate"}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-muted-foreground capitalize">{e.kind.replace(/_/g, " ")}</div>
                </div>
              ))}
              {events.length > 0 && (
                <div className="pt-2">
                  {hasMoreEvents ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full h-7 text-[11px]"
                      onClick={() => fetchMoreEvents()}
                      disabled={loadingMoreEvents}
                    >
                      {loadingMoreEvents ? "Loading…" : "Load more"}
                    </Button>
                  ) : (
                    <div className="text-center text-[10px] text-muted-foreground py-1">
                      End of feed
                    </div>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Integrity alerts */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold">Integrity alerts</h2>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="h-3 w-3 accent-[hsl(var(--primary))]"
              />
              Show resolved
            </label>
          </div>
          {(() => {
            type AlertRow = {
              p: LiveParticipant;
              type: "low_integrity" | "findings_high" | "findings_med";
              label: string;
              detail: string;
            };
            const rows: AlertRow[] = [];
            for (const p of participants ?? []) {
              if (!p.attempt_id) continue;
              if (p.integrity_score !== null && p.integrity_score < 70) {
                rows.push({ p, type: "low_integrity", label: "Low integrity", detail: `Integrity ${p.integrity_score}` });
              }
              const ev = evidenceMap?.[p.attempt_id];
              if (ev?.findings_high) {
                rows.push({ p, type: "findings_high", label: "High-severity findings", detail: `${ev.findings_high} high` });
              }
              if (ev?.findings_med) {
                rows.push({ p, type: "findings_med", label: "Medium-severity findings", detail: `${ev.findings_med} med` });
              }
            }
            const visible = rows.filter((r) => showResolved || !isResolved(r.p.attempt_id!, r.type));
            const resolvedCount = rows.filter((r) => isResolved(r.p.attempt_id!, r.type)).length;
            if (rows.length === 0)
              return <div className="text-xs text-muted-foreground py-3">All clear — no integrity violations flagged.</div>;
            if (visible.length === 0)
              return (
                <div className="text-xs text-muted-foreground py-3">
                  All {resolvedCount} alert{resolvedCount === 1 ? "" : "s"} marked resolved. Toggle "Show resolved" to review.
                </div>
              );
            return (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {visible.map((r) => {
                    const resolved = isResolved(r.p.attempt_id!, r.type);
                    return (
                      <div
                        key={`${r.p.invite_id}:${r.type}`}
                        className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                          resolved
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedInviteId(r.p.invite_id)}
                          className="text-left w-full"
                        >
                          <div className="font-medium truncate">{r.p.name ?? r.p.email}</div>
                          <div className={resolved ? "text-emerald-300/90" : "text-amber-300/90"}>
                            {r.label} · {r.detail}
                          </div>
                        </button>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {resolved ? (
                            <>
                              <span className="text-[10px] text-emerald-300/80 inline-flex items-center gap-1">
                                <Check className="h-3 w-3" /> Resolved
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px]"
                                onClick={() => unmarkResolved(r.p.attempt_id!, r.type)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" /> Reopen
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px] ml-auto"
                              onClick={() => markResolved(r.p.attempt_id!, r.type, r.label)}
                            >
                              <Check className="h-3 w-3 mr-1" /> Mark resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {resolvedCount > 0 && !showResolved && (
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    {resolvedCount} resolved alert{resolvedCount === 1 ? "" : "s"} hidden.
                  </div>
                )}
              </>
            );
          })()}
        </GlassCard>

        {/* Data retention (admins) */}
        {canProctor && (
          <GlassCard className="p-4">
            <button
              type="button"
              onClick={() => setShowRetention((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[hsl(var(--primary))]" /> Proctoring data retention
              </span>
              {showRetention ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showRetention && (
              <div className="mt-3">
                <RetentionCard />
              </div>
            )}
          </GlassCard>
        )}
      </div>

      <ParticipantDetailDrawer
        open={!!selectedInviteId}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedInviteId(null);
            if (searchParams.get("attempt")) {
              const next = new URLSearchParams(searchParams);
              next.delete("attempt");
              setSearchParams(next, { replace: true });
            }
          }
        }}
        participant={selectedParticipant}
        assessmentId={assessment.id}
        evidence={selectedParticipant?.attempt_id ? evidenceMap?.[selectedParticipant.attempt_id] : undefined}
        canProctor={canProctor}
        orgId={org?.id}
        forceSubmitPending={forceSubmit.isPending}
        onForceSubmit={(p) => {
          if (!p.attempt_id) return;
          forceSubmit.mutate(
            { attempt_id: p.attempt_id, assessment_id: assessment.id },
            {
              onSuccess: () => toast.success(`Force-submitted ${p.name ?? p.email}`),
              onError: (e: any) => toast.error(e?.message ?? "Failed to force submit"),
            }
          );
        }}
      />
    </OrgShell>
  );
}

function ParticipantRow({
  p,
  assessmentId,
  onForceSubmit,
  onOpen,
  detailHref,
  pending,
  evidence,
  canProctor,
}: {
  p: LiveParticipant;
  assessmentId: string;
  onForceSubmit: () => void;
  onOpen: () => void;
  detailHref: string | null;
  pending?: boolean;
  evidence?: import("../../hooks/useAssessmentLive").EvidenceCounts;
  canProctor: boolean;
}) {
  const canForceSubmit =
    !!p.attempt_id && p.status !== "submitted" && p.status !== "auto_submitted";
  const ev = evidence;
  const navigate = useNavigate();
  const goToDetail = (e?: React.MouseEvent) => {
    if (!detailHref) {
      onOpen();
      return;
    }
    if (e && (e.metaKey || e.ctrlKey || (e as any).button === 1)) {
      window.open(detailHref, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(detailHref);
  };
  const onRowClick = (e: React.MouseEvent) => {
    // Avoid triggering on action button clicks
    if ((e.target as HTMLElement).closest("[data-row-action]")) return;
    goToDetail(e);
  };

  return (
    <tr
      className="hover:bg-white/[0.02] cursor-pointer"
      onClick={onRowClick}
      title={detailHref ? "Open candidate page" : "Open candidate details"}
    >
      <td className="py-2.5 px-2 min-w-0">
        {detailHref ? (
          <a
            href={detailHref}
            onClick={(e) => {
              e.stopPropagation();
              if (e.metaKey || e.ctrlKey || e.button === 1) return;
              e.preventDefault();
              navigate(detailHref);
            }}
            className="font-medium truncate text-left hover:underline hover:text-primary inline-flex items-center gap-1"
          >
            {p.name ?? p.email}
          </a>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="font-medium truncate text-left hover:underline hover:text-primary inline-flex items-center gap-1"
          >
            {p.name ?? p.email}
          </button>
        )}
        <div className="text-muted-foreground text-[10px] truncate">
          {p.email}
          {p.external_id ? ` · ${p.external_id}` : ""}
        </div>
      </td>

      <td className="py-2.5 px-2">
        <StatusPill tone={STATUS_TONE[p.status]} pulse={p.status === "in_progress"}>
          {STATUS_LABEL[p.status]}
        </StatusPill>
      </td>
      <td className="py-2.5 px-2">
        {p.status === "in_progress" ? (
          <Tick at={p.started_at} />
        ) : p.submitted_at && p.started_at ? (
          <span className="text-muted-foreground tabular-nums">
            {Math.round((new Date(p.submitted_at).getTime() - new Date(p.started_at).getTime()) / 60000)}m
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 px-2 tabular-nums">
        {p.score ?? <span className="text-muted-foreground">—</span>}
      </td>
      <td className="py-2.5 px-2 tabular-nums">
        {p.integrity_score !== null ? (
          <span
            className={
              p.integrity_score >= 80
                ? "text-emerald-300"
                : p.integrity_score >= 60
                ? "text-amber-300"
                : "text-rose-300"
            }
          >
            {p.integrity_score}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      {canProctor && (
        <td className="py-2.5 px-2">
          {ev ? (
            <div className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5"><Camera className="h-3 w-3" />{ev.webcam}</span>
              <span className="inline-flex items-center gap-0.5"><Monitor className="h-3 w-3" />{ev.screen}</span>
              <span className="inline-flex items-center gap-0.5"><Smartphone className="h-3 w-3" />{ev.side_cam}</span>
              {ev.findings_high > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {ev.findings_high} high
                </span>
              )}
              {ev.findings_med > 0 && ev.findings_high === 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {ev.findings_med} med
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
      )}
      <td className="py-2.5 px-2 text-right" data-row-action>
        <div className="inline-flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2" title="Quick view (drawer)" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {detailHref && (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              title="Open full candidate page in new tab"
            >
              <a
                href={detailHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={!canForceSubmit || pending}
                className="h-7 px-2 text-rose-300 hover:text-rose-200 disabled:opacity-40"
                title={canForceSubmit ? "Force submit attempt" : "No active attempt"}
              >
                <StopCircle className="h-3.5 w-3.5 mr-1" />
                <span className="text-[11px]">Force submit</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Force submit attempt?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end <span className="font-medium">{p.name ?? p.email}</span>'s attempt
                  immediately and mark it as auto-submitted. Their current answers will be scored.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-500/90 hover:bg-rose-500 text-white"
                  onClick={onForceSubmit}
                >
                  Force submit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}

function SortTh({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={`font-medium py-2 px-2 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition-colors ${
          active ? "text-[hsl(var(--primary))]" : "hover:text-foreground"
        }`}
      >
        {label}
        <Icon className="h-3 w-3 opacity-70" />
      </button>
    </th>
  );
}
