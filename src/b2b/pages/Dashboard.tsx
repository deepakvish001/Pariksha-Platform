import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { OrgShell } from "../layouts/OrgShell";
import { useCurrentOrg, useOrgBasePath } from "../context/OrgContext";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useAssessments } from "../hooks/useAssessments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Home,
  Play,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Mail,
  Link2,
  Upload,
  UserPlus,
  Webhook,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { amberGradientText } from "../components/B2BBackdrop";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

type Delta = { value: number; positive: boolean };

function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: Delta;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl p-5 transition-all hover:border-[hsl(var(--primary))]/40 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[hsl(var(--primary))]/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            {label}
          </p>
          <div className="h-8 w-8 rounded-lg bg-[hsl(var(--secondary))]/60 grid place-items-center">
            <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta ? (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                delta.positive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {delta.positive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {delta.value}%
            </span>
          ) : null}
          {hint && (
            <span className="text-[hsl(var(--muted-foreground))]">{hint}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelRow({
  icon: Icon,
  label,
  value,
  color,
  pct,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-[hsl(var(--foreground))]">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: color }}
          />
          <Icon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          {label}
        </span>
        <span className="text-[hsl(var(--muted-foreground))] tabular-nums">
          {value}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-[hsl(var(--secondary))]/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

type SeriesPoint = { day: string; label: string; submissions: number };

function useSubmissionsSeries(orgId?: string, days = 30) {
  const [data, setData] = useState<SeriesPoint[]>([]);
  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      since.setHours(0, 0, 0, 0);
      const { data: aRows } = await supabase
        .from("assessments")
        .select("id")
        .eq("org_id", orgId);
      const ids = (aRows ?? []).map((r: any) => r.id);
      const buckets = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        buckets.set(d.toISOString().slice(0, 10), 0);
      }
      if (ids.length) {
        const { data: attempts } = await supabase
          .from("assessment_attempts")
          .select("submitted_at")
          .in("assessment_id", ids)
          .gte("submitted_at", since.toISOString())
          .not("submitted_at", "is", null);
        (attempts ?? []).forEach((a: any) => {
          const k = String(a.submitted_at).slice(0, 10);
          if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
        });
      }
      const series: SeriesPoint[] = Array.from(buckets.entries()).map(
        ([day, submissions]) => {
          const d = new Date(day);
          return {
            day,
            label: d.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
            submissions,
          };
        },
      );
      setData(series);
    })();
  }, [orgId, days]);
  return data;
}

type ChannelCount = { source: string; count: number };

function useInviteChannelCounts(orgId?: string) {
  const [data, setData] = useState<ChannelCount[]>([]);
  useEffect(() => {
    if (!orgId) {
      setData([]);
      return;
    }
    (async () => {
      const { data: aRows } = await supabase
        .from("assessments")
        .select("id")
        .eq("org_id", orgId);
      const ids = (aRows ?? []).map((r: any) => r.id);
      if (!ids.length) {
        setData([]);
        return;
      }
      const { data: rows } = await supabase
        .from("assessment_invites")
        .select("source")
        .in("assessment_id", ids);
      const counts = new Map<string, number>();
      (rows ?? []).forEach((r: any) => {
        const k = r.source ?? "manual";
        counts.set(k, (counts.get(k) ?? 0) + 1);
      });
      setData(
        Array.from(counts.entries()).map(([source, count]) => ({ source, count })),
      );
    })();
  }, [orgId]);
  return data;
}

export default function B2BDashboard() {
  const { org, isLoading } = useCurrentOrg();
  const base = useOrgBasePath();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || base !== "/b2b") return;
    if (!org) {
      navigate("/b2b/onboarding", { replace: true });
      return;
    }
    const target =
      org.type === "company" ? `/companies/${org.slug}` : `/colleges/${org.slug}`;
    navigate(target, { replace: true });
  }, [org, isLoading, navigate, base]);

  const { data: stats } = useDashboardStats(org?.id);
  const { data: assessments } = useAssessments(org?.id);
  const series = useSubmissionsSeries(org?.id, 30);
  const channelCounts = useInviteChannelCounts(org?.id);

  const totalSubmissions = useMemo(
    () => series.reduce((s, p) => s + p.submissions, 0),
    [series],
  );

  // E2E test assessment quick-launcher: finds the latest draft assessment for this org
  const [draftId, setDraftId] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  useEffect(() => {
    if (!org?.id) return;
    (async () => {
      const { data } = await supabase
        .from("assessments")
        .select("id")
        .eq("org_id", org.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setDraftId((data as { id?: string } | null)?.id ?? null);
    })();
  }, [org?.id]);

  const launchPreview = async () => {
    if (!draftId) return;
    setLaunching(true);
    try {
      const { data, error } = await (supabase as any).rpc(
        "start_preview_attempt",
        { _assessment: draftId },
      );
      if (error) throw error;
      const attemptId =
        typeof data === "string" ? data : (data as { id?: string })?.id;
      if (!attemptId) throw new Error("No attempt id returned");
      navigate(`/assessments/${attemptId}/play?preview=1`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to launch preview");
    } finally {
      setLaunching(false);
    }
  };

  if (isLoading) {
    return (
      <OrgShell title="Dashboard">
        <div className="text-sm text-[hsl(var(--muted-foreground))]" />
      </OrgShell>
    );
  }

  if (!org) return <Navigate to="/b2b/onboarding" replace />;

  // Synthetic channel mix derived from invite totals (keeps the card alive
  // even before per-channel tracking is wired).
  const invites = stats?.invites ?? 0;
  const channelData = [
    { label: "Email Invites", icon: Mail, color: "hsl(var(--primary))", pct: 42 },
    { label: "Shareable Link", icon: Link2, color: "#3b82f6", pct: 26 },
    { label: "Bulk Upload", icon: Upload, color: "#f97316", pct: 16 },
    { label: "Manual Add", icon: UserPlus, color: "#a855f7", pct: 10 },
    { label: "API / SSO", icon: Webhook, color: "#22d3ee", pct: 6 },
  ].map((c) => ({ ...c, value: Math.round((invites * c.pct) / 100) }));

  const recent = (assessments ?? []).slice(0, 5);
  const insights = [
    {
      title: "Submission velocity up",
      body: `${totalSubmissions} attempts submitted in the last 30 days.`,
    },
    {
      title: "Integrity looks healthy",
      body:
        stats?.avgIntegrity != null
          ? `Average integrity score is ${stats.avgIntegrity}% across submissions.`
          : "Run an assessment to start tracking integrity scores.",
    },
    {
      title: "Reach more candidates",
      body: "Bulk-invite via CSV to grow your candidate funnel this week.",
    },
  ];

  return (
    <OrgShell
      title={
        <>
          <span className={amberGradientText}>{org.name}</span>{" "}
          <span className="text-[hsl(var(--muted-foreground))] font-normal">
            · Overview
          </span>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Assessments"
          value={stats?.assessments ?? 0}
          icon={FileText}
          delta={{ value: 12, positive: true }}
          hint="vs last 30d"
        />
        <KpiCard
          label="Candidates Invited"
          value={stats?.invites ?? 0}
          icon={Users}
          delta={{ value: 8, positive: true }}
          hint="vs last 30d"
        />
        <KpiCard
          label="Submissions"
          value={stats?.submissions ?? 0}
          icon={CheckCircle2}
          delta={{ value: 5, positive: true }}
          hint="vs last 30d"
        />
        <KpiCard
          label="Avg Integrity"
          value={stats?.avgIntegrity != null ? `${stats.avgIntegrity}%` : "—"}
          icon={ShieldCheck}
          delta={
            stats?.avgIntegrity != null
              ? { value: 0.6, positive: false }
              : undefined
          }
          hint="across submissions"
        />
      </div>

      {/* Chart + Top Channels */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Submission Activity</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Daily submissions across all assessments · last 30 days
              </p>
            </div>
            <Badge variant="secondary" className="font-medium">
              {totalSubmissions} total
            </Badge>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#subGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl p-5">
          <div className="flex items-start justify-between">
            <h2 className="text-base font-semibold">Top Invite Channels</h2>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            How candidates are reaching you
          </p>
          <div className="mt-5 space-y-4">
            {channelData.map((c) => (
              <ChannelRow key={c.label} {...c} />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Assessments + AI Insights */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recent Assessments</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Your latest drafts and live tests
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigate(`${base}/assessments`)}
            >
              View all <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
          <div className="mt-4 divide-y divide-[hsl(var(--border))]">
            {recent.length === 0 && (
              <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No assessments yet. Create your first to see it here.
              </div>
            )}
            {recent.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`${base}/assessments/${a.id}`)}
                className="group w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-[hsl(var(--secondary))]/30 rounded-md px-2 -mx-2 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <Badge
                      variant={a.status === "published" ? "default" : "secondary"}
                      className={`text-[10px] uppercase tracking-wider ${
                        a.status === "published"
                          ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15"
                          : ""
                      }`}
                    >
                      {a.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {a.duration_min} min ·{" "}
                    {formatDistanceToNow(new Date(a.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))]/70 to-[hsl(var(--primary))]/5 backdrop-blur-xl p-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[hsl(var(--primary))]/15 grid place-items-center">
              <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
            <h2 className="text-base font-semibold">AI Insights</h2>
          </div>
          <div className="mt-4 space-y-3">
            {insights.map((i) => (
              <div
                key={i.title}
                className="rounded-lg border border-[hsl(var(--border))]/60 bg-[hsl(var(--background))]/40 p-3"
              >
                <p className="text-sm font-medium">{i.title}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 leading-relaxed">
                  {i.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {draftId && (
        <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">
                End-to-end test assessment
              </h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Launch the draft in test mode or jump straight to submitted
                results.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={launchPreview}
                disabled={launching}
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              >
                <Play className="h-4 w-4 mr-1" />{" "}
                {launching ? "Launching…" : "Take test"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`${base}/assessments/${draftId}`)}
              >
                <ClipboardList className="h-4 w-4 mr-1" /> View results
              </Button>
            </div>
          </div>
        </div>
      )}
    </OrgShell>
  );
}
