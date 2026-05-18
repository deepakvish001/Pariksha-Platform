import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { OrgShell } from "../layouts/OrgShell";
import { useCurrentOrg, useOrgBasePath } from "../context/OrgContext";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useAssessments } from "../hooks/useAssessments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Users,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Home,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CalendarClock,
  AlertTriangle,
  Trophy,
  Library,
  LucideIcon,
} from "lucide-react";
import { amberGradientText } from "../components/B2BBackdrop";
import { KpiTile } from "../components/ui/KpiTile";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* -------------------------------------------------------------------------- */
/* Card primitive — glass + amber glow                                         */
/* -------------------------------------------------------------------------- */

function GlassCard({
  children,
  className = "",
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]/70 bg-gradient-to-br from-[hsl(var(--card))]/80 to-[hsl(var(--card))]/40 backdrop-blur-xl shadow-[0_1px_0_0_hsl(0_0%_100%/0.04)_inset,0_20px_50px_-30px_hsl(0_0%_0%/0.6)] transition-all duration-300 hover:border-[hsl(var(--primary))]/40 hover:shadow-[0_1px_0_0_hsl(0_0%_100%/0.06)_inset,0_25px_60px_-25px_hsl(var(--primary)/0.35)] ${className}`}
    >
      {glow && (
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[hsl(var(--primary))]/10 blur-3xl" />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function CardHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-5 pb-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--primary))]/5 ring-1 ring-[hsl(var(--primary))]/25 grid place-items-center">
          <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight truncate">{title}</h2>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* KPI card                                                                    */
/* -------------------------------------------------------------------------- */

type Delta = {
  value: number;
  direction: "up" | "down" | "flat";
  unit?: "%" | "pts";
};

function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  windowDays = 30,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: Delta;
  windowDays?: number;
}) {
  const unitLabel = delta?.unit === "pts" ? "percentage points" : "percent";
  const directionWord =
    delta?.direction === "up"
      ? "Up"
      : delta?.direction === "down"
        ? "Down"
        : "Unchanged";
  const tooltipBody = delta
    ? delta.direction === "flat"
      ? `Unchanged vs the previous ${windowDays}-day window.`
      : `${directionWord} ${delta.value} ${unitLabel} vs the previous ${windowDays}-day window.`
    : `No baseline yet — there was no data in the previous ${windowDays}-day window.`;

  return (
    <GlassCard>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
              {label}
            </p>
            <TooltipProvider delayDuration={150}>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`How ${label} is calculated`}
                    className="text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                  {tooltipBody}
                </TooltipContent>
              </UiTooltip>
            </TooltipProvider>
          </div>
          <div className="h-9 w-9 rounded-xl bg-[hsl(var(--primary))]/10 ring-1 ring-[hsl(var(--primary))]/20 grid place-items-center">
            <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
          </div>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {delta && delta.direction !== "flat" && (
            <span
              className={`mb-1 inline-flex items-center gap-0.5 text-xs font-medium ${
                delta.direction === "up" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {delta.direction === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {delta.value}
              {delta.unit}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">vs prev {windowDays}d</p>
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Data hooks for new widgets                                                  */
/* -------------------------------------------------------------------------- */

type UpcomingAssessment = {
  id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  duration_min: number;
  invites: number;
};

function useUpcomingAssessments(orgId?: string) {
  return useQuery({
    queryKey: ["b2b", "dash", "upcoming", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<UpcomingAssessment[]> => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("assessments")
        .select("id, title, starts_at, ends_at, duration_min, assessment_invites(count)")
        .eq("org_id", orgId!)
        .eq("status", "published")
        .or(`starts_at.gte.${nowIso},ends_at.gte.${nowIso}`)
        .order("starts_at", { ascending: true, nullsFirst: false })
        .limit(5);
      if (error) throw error;
      return ((data ?? []) as any[]).map((a) => ({
        id: a.id,
        title: a.title,
        starts_at: a.starts_at,
        ends_at: a.ends_at,
        duration_min: a.duration_min,
        invites: a.assessment_invites?.[0]?.count ?? 0,
      }));
    },
  });
}

type IntegrityAlert = {
  id: string;
  assessment_id: string;
  assessment_title: string;
  candidate: string;
  integrity_score: number;
  submitted_at: string | null;
};

function useIntegrityAlerts(orgId?: string) {
  return useQuery({
    queryKey: ["b2b", "dash", "integrity", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<IntegrityAlert[]> => {
      const { data: assessments } = await supabase
        .from("assessments")
        .select("id, title")
        .eq("org_id", orgId!);
      const ids = (assessments ?? []).map((a: any) => a.id);
      if (!ids.length) return [];
      const titleMap = new Map<string, string>(
        (assessments ?? []).map((a: any) => [a.id, a.title]),
      );
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select(
          "id, assessment_id, integrity_score, submitted_at, started_at, invite:assessment_invites(email, name)",
        )
        .in("assessment_id", ids)
        .lt("integrity_score", 70)
        .order("started_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id,
        assessment_id: r.assessment_id,
        assessment_title: titleMap.get(r.assessment_id) ?? "Assessment",
        candidate: r.invite?.name || r.invite?.email || "Anonymous",
        integrity_score: r.integrity_score,
        submitted_at: r.submitted_at ?? r.started_at,
      }));
    },
  });
}

type TopPerformer = {
  id: string;
  candidate: string;
  assessment_title: string;
  score: number;
  submitted_at: string | null;
};

function useTopPerformers(orgId?: string, days = 30) {
  return useQuery({
    queryKey: ["b2b", "dash", "top", orgId, days],
    enabled: !!orgId,
    queryFn: async (): Promise<TopPerformer[]> => {
      const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data: assessments } = await supabase
        .from("assessments")
        .select("id, title")
        .eq("org_id", orgId!);
      const ids = (assessments ?? []).map((a: any) => a.id);
      if (!ids.length) return [];
      const titleMap = new Map<string, string>(
        (assessments ?? []).map((a: any) => [a.id, a.title]),
      );
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select(
          "id, assessment_id, score, submitted_at, invite:assessment_invites(email, name)",
        )
        .in("assessment_id", ids)
        .not("score", "is", null)
        .gte("submitted_at", sinceIso)
        .order("score", { ascending: false })
        .limit(5);
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id,
        candidate: r.invite?.name || r.invite?.email || "Anonymous",
        assessment_title: titleMap.get(r.assessment_id) ?? "Assessment",
        score: r.score,
        submitted_at: r.submitted_at,
      }));
    },
  });
}

type QbHealth = {
  total: number;
  byType: { type: string; count: number; pct: number }[];
};

function useQuestionBankHealth(orgId?: string) {
  return useQuery({
    queryKey: ["b2b", "dash", "qb-health", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<QbHealth> => {
      const { data, error } = await supabase
        .from("questions")
        .select("type")
        .eq("org_id", orgId!);
      if (error) throw error;
      const rows = (data ?? []) as { type: string }[];
      const total = rows.length;
      const counts = new Map<string, number>();
      for (const r of rows) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
      const byType = Array.from(counts.entries())
        .map(([type, count]) => ({
          type,
          count,
          pct: total ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);
      return { total, byType };
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Widgets                                                                     */
/* -------------------------------------------------------------------------- */

function UpcomingWidget({ orgId, basePath }: { orgId: string; basePath: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useUpcomingAssessments(orgId);
  return (
    <GlassCard className="h-full">
      <CardHeader
        icon={CalendarClock}
        title="Upcoming assessments"
        subtitle="Published tests starting or running soon"
        action={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate(`${basePath}/assessments`)}
          >
            View all <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
          </Button>
        }
      />
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/30 animate-pulse"
              />
            ))}
          </div>
        ) : !data?.length ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No scheduled assessments. Publish one with a start date.
          </p>
        ) : (
          <ul className="divide-y divide-[hsl(var(--border))]/40">
            {data.map((a) => {
              const when = a.starts_at ? new Date(a.starts_at) : null;
              const now = new Date();
              const live = when && when <= now && (!a.ends_at || new Date(a.ends_at) >= now);
              return (
                <li key={a.id}>
                  <button
                    onClick={() => navigate(`${basePath}/assessments/${a.id}`)}
                    className="group w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-[hsl(var(--secondary))]/30 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        {live ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15 text-[10px] uppercase tracking-wider border-emerald-500/30">
                            Live
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                            Scheduled
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {when ? format(when, "MMM d · h:mm a") : "No start date"} · {a.duration_min} min · {a.invites} invited
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}

function IntegrityAlertsWidget({
  orgId,
  basePath,
}: {
  orgId: string;
  basePath: string;
}) {
  const navigate = useNavigate();
  const { data, isLoading } = useIntegrityAlerts(orgId);

  const toneFor = (score: number) =>
    score < 40
      ? { dot: "bg-rose-500", text: "text-rose-400", ring: "ring-rose-500/30" }
      : score < 60
        ? { dot: "bg-orange-500", text: "text-orange-400", ring: "ring-orange-500/30" }
        : { dot: "bg-amber-500", text: "text-amber-400", ring: "ring-amber-500/30" };

  return (
    <GlassCard className="h-full">
      <CardHeader
        icon={AlertTriangle}
        title="Integrity alerts"
        subtitle="Attempts flagged below 70% integrity"
        action={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate(`${basePath}/assessments`)}
          >
            Review <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
          </Button>
        }
      />
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/30 animate-pulse"
              />
            ))}
          </div>
        ) : !data?.length ? (
          <div className="py-8 text-center">
            <ShieldCheck className="mx-auto h-7 w-7 text-emerald-500/80" />
            <p className="mt-2 text-xs text-muted-foreground">All clear — no flagged attempts.</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {data.map((a) => {
              const tone = toneFor(a.integrity_score);
              return (
                <li key={a.id}>
                  <button
                    onClick={() =>
                      navigate(`${basePath}/assessments/${a.assessment_id}/manage?attempt=${a.id}`)
                    }
                    className="group w-full flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))]/40 bg-[hsl(var(--background))]/30 px-3 py-2 text-left hover:border-[hsl(var(--primary))]/30 hover:bg-[hsl(var(--secondary))]/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`h-2 w-2 rounded-full ${tone.dot} ring-2 ${tone.ring}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.candidate}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {a.assessment_title}
                          {a.submitted_at &&
                            ` · ${formatDistanceToNow(new Date(a.submitted_at), { addSuffix: true })}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${tone.text} shrink-0`}>
                      {a.integrity_score}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}

function TopPerformersWidget({ orgId }: { orgId: string }) {
  const { data, isLoading } = useTopPerformers(orgId, 30);
  const medal = ["text-amber-400", "text-slate-300", "text-amber-700"];

  return (
    <GlassCard className="h-full">
      <CardHeader
        icon={Trophy}
        title="Top performers"
        subtitle="Highest scores in the last 30 days"
      />
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-11 rounded-lg border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/30 animate-pulse"
              />
            ))}
          </div>
        ) : !data?.length ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No graded submissions yet.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {data.map((p, idx) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))]/40 bg-[hsl(var(--background))]/30 px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold tabular-nums ${
                      idx < 3
                        ? `bg-[hsl(var(--primary))]/10 ring-1 ring-[hsl(var(--primary))]/30 ${medal[idx]}`
                        : "bg-[hsl(var(--secondary))]/50 text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.candidate}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {p.assessment_title}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums text-[hsl(var(--primary))] shrink-0">
                  {p.score}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </GlassCard>
  );
}

const QB_TYPE_LABELS: Record<string, string> = {
  coding: "Coding",
  mcq: "Multiple choice",
  sql: "SQL",
  subjective: "Subjective",
  true_false: "True / False",
  short_answer: "Short answer",
  matching: "Matching",
};

function QuestionBankHealthWidget({
  orgId,
  basePath,
}: {
  orgId: string;
  basePath: string;
}) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuestionBankHealth(orgId);

  return (
    <GlassCard className="h-full">
      <CardHeader
        icon={Library}
        title="Question bank health"
        subtitle="Coverage across question types"
        action={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate(`${basePath}/question-bank`)}
          >
            Manage <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
          </Button>
        }
      />
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="h-32 rounded-lg border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/30 animate-pulse" />
        ) : !data || data.total === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Your question bank is empty. Add questions to power new assessments.
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">{data.total}</span>
              <span className="text-xs text-muted-foreground">total questions</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {data.byType.map((row) => (
                <div key={row.type}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {QB_TYPE_LABELS[row.type] ?? row.type}
                    </span>
                    <span className="tabular-nums text-foreground/80">
                      {row.count}{" "}
                      <span className="text-muted-foreground/70">· {row.pct}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-[hsl(var(--secondary))]/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--primary))]/80 to-[hsl(var(--primary))]/40"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function Dashboard() {
  const { org, isLoading } = useCurrentOrg();
  const base = useOrgBasePath();
  const navigate = useNavigate();

  // Redirect legacy /b2b to first org if any (existing behavior preserved).
  useEffect(() => {
    if (!isLoading && !org && base === "/b2b") navigate("/b2b/onboarding");
  }, [org, isLoading, navigate, base]);

  const [statsRange, setStatsRange] = useState<"7d" | "30d" | "60d" | "90d">("30d");
  const statsWindowDays =
    statsRange === "7d" ? 7 : statsRange === "60d" ? 60 : statsRange === "90d" ? 90 : 30;
  const { data: stats } = useDashboardStats(org?.id, statsRange);
  const { data: assessments } = useAssessments(org?.id);

  if (isLoading) {
    return (
      <OrgShell title="Dashboard">
        <div className="text-sm text-muted-foreground" />
      </OrgShell>
    );
  }
  if (!org) return <Navigate to="/b2b/onboarding" replace />;

  const recent = (assessments ?? []).slice(0, 5);

  const d = stats?.deltas;
  const toDelta = (
    v: number | null | undefined,
    unit: "%" | "pts",
  ): Delta | undefined => {
    if (v == null) return undefined;
    const magnitude = Math.round(Math.abs(v) * 10) / 10;
    const direction = v > 0 ? "up" : v < 0 ? "down" : "flat";
    return { value: magnitude, direction, unit };
  };

  return (
    <OrgShell
      title={
        <>
          <span className={amberGradientText}>{org.name}</span>{" "}
          <span className="text-muted-foreground font-normal">· Overview</span>
        </>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="h-4 w-4 mr-1" /> Home
          </Button>
          <Button
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            onClick={() => navigate(`${base}/assessments/new`)}
          >
            <Plus className="h-4 w-4 mr-1" /> New assessment
          </Button>
        </div>
      }
    >
      {/* KPI tiles */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            Key metrics
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Compare</span>
            <Select
              value={statsRange}
              onValueChange={(v) => setStatsRange(v as "7d" | "30d" | "60d" | "90d")}
            >
              <SelectTrigger
                aria-label="KPI comparison window"
                className="h-8 w-[140px] text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="60d">Last 60 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Assessments"
            value={stats?.assessments ?? 0}
            icon={FileText}
            delta={toDelta(d?.assessments, "%")}
            windowDays={statsWindowDays}
          />
          <KpiCard
            label="Candidates Invited"
            value={stats?.invites ?? 0}
            icon={Users}
            delta={toDelta(d?.invites, "%")}
            windowDays={statsWindowDays}
          />
          <KpiCard
            label="Submissions"
            value={stats?.submissions ?? 0}
            icon={CheckCircle2}
            delta={toDelta(d?.submissions, "%")}
            windowDays={statsWindowDays}
          />
          <KpiCard
            label="Avg Integrity"
            value={stats?.avgIntegrity != null ? `${stats.avgIntegrity}%` : "—"}
            icon={ShieldCheck}
            delta={toDelta(d?.avgIntegrity, "pts")}
            windowDays={statsWindowDays}
          />
        </div>
      </section>

      {/* Row 1: Upcoming + Integrity alerts */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <UpcomingWidget orgId={org.id} basePath={base} />
        <IntegrityAlertsWidget orgId={org.id} basePath={base} />
      </section>

      {/* Row 2: Top performers + Question bank */}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <TopPerformersWidget orgId={org.id} />
        <QuestionBankHealthWidget orgId={org.id} basePath={base} />
      </section>

      {/* Recent assessments */}
      <section className="mt-4">
        <GlassCard>
          <CardHeader
            icon={FileText}
            title="Recent assessments"
            subtitle="Your latest drafts and live tests"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => navigate(`${base}/assessments`)}
              >
                View all <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
              </Button>
            }
          />
          <div className="px-5 pb-5">
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No assessments yet. Create your first to see it here.
              </p>
            ) : (
              <ul className="divide-y divide-[hsl(var(--border))]/40">
                {recent.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => navigate(`${base}/assessments/${a.id}`)}
                      className="group w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-[hsl(var(--secondary))]/30 rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <Badge
                            variant={a.status === "published" ? "default" : "secondary"}
                            className={`text-[10px] uppercase tracking-wider ${
                              a.status === "published"
                                ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15 border-emerald-500/30"
                                : ""
                            }`}
                          >
                            {a.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {a.duration_min} min ·{" "}
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </GlassCard>
      </section>
    </OrgShell>
  );
}
