import { useMemo, useState } from "react";
import { OrgShell } from "../../layouts/OrgShell";
import { useMyOrganizations } from "../../hooks/useOrg";
import { useAssessments, type Assessment } from "../../hooks/useAssessments";
import { ASSESSMENT_TYPES, getTemplate, type AssessmentType } from "../../lib/assessmentTemplates";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FileText,
  Clock,
  Pencil,
  Activity,
  Search,
  Radio,
  CalendarClock,
  CheckCircle2,
  FileEdit,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { bucketAssessments, formatWindow, getScheduleState, type ScheduleState } from "../../lib/assessmentSchedule";
import { useFlaggedAcrossOrg } from "../../hooks/useAssessmentLive";
import { useCan } from "../../hooks/usePermissions";
import { ShieldAlert } from "lucide-react";
import { StatusPill, type StatusTone } from "../../components/ui/StatusPill";
import { EmptyState } from "../../components/ui/EmptyState";

type TabKey = "live" | "upcoming" | "drafts" | "closed" | "all";

const TAB_META: Record<TabKey, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  live: { label: "Live now", icon: Radio },
  upcoming: { label: "Upcoming", icon: CalendarClock },
  drafts: { label: "Drafts", icon: FileEdit },
  closed: { label: "Closed", icon: CheckCircle2 },
  all: { label: "All", icon: FileText },
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

const STATE_TONE: Record<ScheduleState, StatusTone> = {
  live: "live",
  scheduled: "scheduled",
  draft: "draft",
  closed: "closed",
  archived: "archived",
};

export default function B2BAssessmentsList() {
  const { data: orgs, isLoading } = useMyOrganizations();
  const navigate = useNavigate();
  const org = orgs?.[0];
  const { data: assessments, isLoading: aLoading } = useAssessments(org?.id);
  const { data: flagged } = useFlaggedAcrossOrg(org?.id, 5);
  const canWrite = useCan(org?.id, "assessments.write").allowed;

  const [tab, setTab] = useState<TabKey>("live");
  const [query, setQuery] = useState("");

  const buckets = useMemo(() => bucketAssessments(assessments ?? []), [assessments]);
  const tabCounts: Record<TabKey, number> = {
    live: buckets.live.length,
    upcoming: buckets.upcoming.length,
    drafts: buckets.drafts.length,
    closed: buckets.closed.length,
    all: assessments?.length ?? 0,
  };

  const visible = useMemo(() => {
    let list: Assessment[];
    if (tab === "live") list = buckets.live;
    else if (tab === "upcoming") list = buckets.upcoming;
    else if (tab === "drafts") list = buckets.drafts;
    else if (tab === "closed") list = buckets.closed;
    else list = assessments ?? [];
    const q = query.trim().toLowerCase();
    return q ? list.filter((a) => a.title.toLowerCase().includes(q)) : list;
  }, [tab, buckets, assessments, query]);

  if (isLoading) return null;
  if (!orgs?.length) return <Navigate to="/b2b/onboarding" replace />;

  return (
    <OrgShell
      title="Assessments"
      actions={
        canWrite ? (
          <Button
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            onClick={() => navigate("/b2b/assessments/new")}
          >
            <Plus className="h-4 w-4 mr-1" /> New assessment
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        {flagged && flagged.length > 0 && (
          <GlassCard className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <ShieldAlert className="h-3.5 w-3.5" /> Flagged across all assessments
              </div>
              <div className="flex flex-wrap gap-1.5">
                {flagged.map((f) => (
                  <button
                    key={f.attempt_id}
                    onClick={() =>
                      navigate(`/b2b/assessments/${f.assessment_id}/manage?attempt=${f.attempt_id}`)
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border border-amber-500/30 bg-amber-500/5 text-amber-200 hover:border-amber-500/60 transition-colors"
                    title={`${f.assessment_title} · ${f.status}`}
                  >
                    <span className="font-medium truncate max-w-[140px]">{f.candidate}</span>
                    <span className="opacity-70">·</span>
                    <span className="tabular-nums">{f.integrity_score}%</span>
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        )}
        {/* Tabs */}
        <GlassCard className="p-2">
          <div className="flex flex-wrap items-center gap-1">
            {(Object.keys(TAB_META) as TabKey[]).map((k) => {
              const Icon = TAB_META[k].icon;
              const active = tab === k;
              return (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {TAB_META[k].label}
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/10 text-[10px] tabular-nums">
                    {tabCounts[k]}
                  </span>
                </button>
              );
            })}
            <div className="relative ml-auto">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search assessments…"
                className="h-8 pl-7 w-56 text-xs"
              />
            </div>
          </div>
        </GlassCard>

        {aLoading ? null : !visible.length ? (
          <EmptyState
            icon={FileText}
            title="Nothing here yet"
            description={
              tab === "live"
                ? "No live assessments right now. Publish one or schedule a window."
                : tab === "upcoming"
                ? "No scheduled assessments. Set a future start time on a published assessment."
                : tab === "drafts"
                ? "No drafts. Create a new assessment to start composing."
                : "No matching assessments."
            }
            action={
              canWrite && (
                <Button
                  className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
                  onClick={() => navigate("/b2b/assessments/new")}
                >
                  <Plus className="h-4 w-4 mr-1" /> New assessment
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((a) => {
              const state = getScheduleState(a);
              return (
                <GlassCard key={a.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{a.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                        {(() => {
                          const tpl = getTemplate((a as any).type);
                          const TIcon = tpl.icon;
                          return (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${tpl.badgeClass}`}>
                              <TIcon className="h-3 w-3" /> {tpl.label}
                            </span>
                          );
                        })()}
                        <Clock className="h-3 w-3" /> {a.duration_min}m
                        <span>·</span>
                        <span className="truncate">
                          Updated {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <StatusPill tone={STATE_TONE[state]} pulse={state === "live"}>
                      {state}
                    </StatusPill>
                  </div>

                  <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
                    {formatWindow(a)}
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/b2b/assessments/${a.id}`)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
                      onClick={() => navigate(`/b2b/assessments/${a.id}/manage`)}
                    >
                      <Activity className="h-3.5 w-3.5 mr-1" /> Manage
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </OrgShell>
  );
}
