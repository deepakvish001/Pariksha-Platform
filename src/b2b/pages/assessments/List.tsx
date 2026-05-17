import { useMemo, useState } from "react";
import { OrgShell } from "../../layouts/OrgShell";
import { useMyOrganizations } from "../../hooks/useOrg";
import { useAssessments, type Assessment } from "../../hooks/useAssessments";
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
import { ShieldAlert } from "lucide-react";

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

const STATE_PILL: Record<ScheduleState, string> = {
  live: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 animate-pulse",
  scheduled: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  draft: "bg-muted text-muted-foreground border border-white/10",
  closed: "bg-zinc-500/15 text-zinc-300 border border-zinc-500/30",
  archived: "bg-zinc-700/30 text-zinc-400 border border-zinc-500/20",
};

export default function B2BAssessmentsList() {
  const { data: orgs, isLoading } = useMyOrganizations();
  const navigate = useNavigate();
  const org = orgs?.[0];
  const { data: assessments, isLoading: aLoading } = useAssessments(org?.id);

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
        <Button
          className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          onClick={() => navigate("/b2b/assessments/new")}
        >
          <Plus className="h-4 w-4 mr-1" /> New assessment
        </Button>
      }
    >
      <div className="space-y-4">
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
          <GlassCard className="p-12 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-3 font-medium">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "live"
                ? "No live assessments right now. Publish one or schedule a window."
                : tab === "upcoming"
                ? "No scheduled assessments. Set a future start time on a published assessment."
                : tab === "drafts"
                ? "No drafts. Create a new assessment to start composing."
                : "No matching assessments."}
            </p>
            <Button
              className="mt-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              onClick={() => navigate("/b2b/assessments/new")}
            >
              <Plus className="h-4 w-4 mr-1" /> New assessment
            </Button>
          </GlassCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((a) => {
              const state = getScheduleState(a);
              return (
                <GlassCard key={a.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{a.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {a.duration_min}m
                        <span>·</span>
                        <span className="truncate">
                          Updated {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${STATE_PILL[state]}`}>
                      {state}
                    </span>
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
