import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Download,
  MessageSquare,
  Loader2,
  LucideIcon,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

type Delta = {
  value: number; // absolute magnitude, already rounded by the hook
  direction: "up" | "down" | "flat";
  unit?: "%" | "pts";
};

import { Info } from "lucide-react";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  windowDays = 30,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: Delta;
  hint?: string;
  windowDays?: number;
}) {
  const unitLabel = delta?.unit === "pts" ? "percentage points" : "percent";
  const prevRangeLabel = `days ${windowDays + 1}–${windowDays * 2}`;
  const directionWord =
    delta?.direction === "up"
      ? "Up"
      : delta?.direction === "down"
        ? "Down"
        : "Unchanged";
  const tooltipBody = delta
    ? delta.direction === "flat"
      ? `Unchanged vs the previous ${windowDays}-day window (${prevRangeLabel}).`
      : `Change vs the previous ${windowDays}-day window. ${directionWord} ${delta.value} ${unitLabel} compared to ${prevRangeLabel}.`
    : `No baseline: there was no activity in the previous ${windowDays}-day window (${prevRangeLabel}), so a % change can't be computed yet.`;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl p-5 transition-all hover:border-[hsl(var(--primary))]/40 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[hsl(var(--primary))]/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              {label}
            </p>
            <TooltipProvider delayDuration={150}>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`How ${label} delta is calculated`}
                    className="text-[hsl(var(--muted-foreground))]/70 hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                  <p className="font-medium mb-1">How this is calculated</p>
                  <p className="text-[hsl(var(--muted-foreground))]">
                    Current window: the last {windowDays} days. Previous window: the {windowDays} days
                    before that ({prevRangeLabel}). Delta ={" "}
                    <span className="font-mono">(current − previous) ÷ previous × 100</span>.
                  </p>
                  <p className="mt-1.5">{tooltipBody}</p>
                  {!delta && (
                    <p className="mt-1.5 text-[hsl(var(--muted-foreground))]">
                      Once the previous window has any activity, a percentage will appear here.
                    </p>
                  )}
                </TooltipContent>
              </UiTooltip>
            </TooltipProvider>
          </div>
          <div className="h-8 w-8 rounded-lg bg-[hsl(var(--secondary))]/60 grid place-items-center">
            <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta ? (() => {
            const unitSuffix = delta.unit === "pts" ? " pts" : "%";
            const sign =
              delta.direction === "up"
                ? "+"
                : delta.direction === "down"
                  ? "−"
                  : "";
            const colorClass =
              delta.direction === "up"
                ? "text-emerald-500"
                : delta.direction === "down"
                  ? "text-rose-500"
                  : "text-[hsl(var(--muted-foreground))]";
            const Arrow =
              delta.direction === "up"
                ? ArrowUpRight
                : delta.direction === "down"
                  ? ArrowDownRight
                  : null;
            const ariaLabel =
              delta.direction === "flat"
                ? `No change vs previous ${windowDays} days`
                : `${delta.direction === "up" ? "Up" : "Down"} ${delta.value}${unitSuffix} vs previous ${windowDays} days`;
            return (
              <span
                aria-label={ariaLabel}
                className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${colorClass}`}
              >
                {Arrow ? <Arrow aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                <span>
                  {sign}
                  {delta.value}
                  {unitSuffix}
                </span>
              </span>
            );
          })() : (
            <span
              role="status"
              aria-label="No baseline: previous 30-day window had no activity, so percent change cannot be calculated"
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-1.5 py-0.5 font-medium text-[hsl(var(--muted-foreground))]"
            >
              <span aria-hidden="true" className="font-mono leading-none">—</span>
              <span>No baseline</span>
            </span>
          )}
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

type AiInsight = {
  title: string;
  body: string;
  severity: "info" | "positive" | "warning";
  action?: string | null;
};

type InsightWindowsForExport = {
  windowDays: number;
  assessments: { curr: number | null; prev: number | null };
  invites: { curr: number | null; prev: number | null };
  submissions: { curr: number | null; prev: number | null };
  avgIntegrity: { curr: number | null; prev: number | null };
};

function exportInsightsToPdf(
  orgName: string,
  insights: AiInsight[],
  windows: InsightWindowsForExport | null,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AI Insights Report", margin, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`${orgName} · Generated ${new Date().toLocaleString()}`, margin, 68);
  doc.setTextColor(0);

  let cursorY = 90;

  if (windows) {
    const wd = windows.windowDays;
    const fmt = (v: number | null, suffix = "") => (v == null ? "—" : `${v}${suffix}`);
    autoTable(doc, {
      startY: cursorY,
      head: [["Metric", `Last ${wd}d`, `Prev ${wd}d`]],
      body: [
        ["Assessments", fmt(windows.assessments.curr), fmt(windows.assessments.prev)],
        ["Candidates invited", fmt(windows.invites.curr), fmt(windows.invites.prev)],
        ["Submissions", fmt(windows.submissions.curr), fmt(windows.submissions.prev)],
        ["Avg integrity", fmt(windows.avgIntegrity.curr, "%"), fmt(windows.avgIntegrity.prev, "%")],
      ],
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [30, 30, 30], textColor: 255 },
      margin: { left: margin, right: margin },
      theme: "grid",
    });
    // @ts-expect-error autotable adds lastAutoTable
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 24;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Recommendations", margin, cursorY);
  cursorY += 14;

  const maxWidth = pageWidth - margin * 2;
  const ensureSpace = (needed: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (cursorY + needed > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  };

  if (insights.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text("No insights available.", margin, cursorY + 10);
  }

  insights.forEach((ins, idx) => {
    const sevLabel = ins.severity.toUpperCase();
    const sevColor: [number, number, number] =
      ins.severity === "positive" ? [16, 185, 129]
      : ins.severity === "warning" ? [245, 158, 11]
      : [100, 116, 139];

    ensureSpace(60);

    // Severity tag
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...sevColor);
    doc.text(sevLabel, margin, cursorY);

    // Title
    doc.setTextColor(0);
    doc.setFontSize(12);
    const titleLines = doc.splitTextToSize(`${idx + 1}. ${ins.title}`, maxWidth);
    doc.text(titleLines, margin, cursorY + 14);
    cursorY += 14 + titleLines.length * 14;

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    const bodyLines = doc.splitTextToSize(ins.body, maxWidth);
    ensureSpace(bodyLines.length * 12 + 10);
    doc.text(bodyLines, margin, cursorY);
    cursorY += bodyLines.length * 12 + 4;

    if (ins.action) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      const actionLines = doc.splitTextToSize(`Action: ${ins.action}`, maxWidth);
      ensureSpace(actionLines.length * 12 + 6);
      doc.text(actionLines, margin, cursorY);
      cursorY += actionLines.length * 12;
    }

    cursorY += 16;
    doc.setTextColor(0);
  });

  const pageCount = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" },
    );
  }

  const safeName = orgName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "org";
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`ai-insights-${safeName}-${stamp}.pdf`);
}

// Cache + in-flight dedupe for AI insights. Keyed by org id, kept module-level
// so navigations between pages don't refetch within the TTL.
const INSIGHTS_TTL_MS = 5 * 60 * 1000; // 5 minutes — matches edge function cost
const INSIGHTS_MIN_REFRESH_MS = 15 * 1000; // user-facing refresh debounce
type InsightsCacheEntry = { data: AiInsight[]; fetchedAt: number };
const insightsCache = new Map<string, InsightsCacheEntry>();
const insightsInFlight = new Map<string, Promise<AiInsight[]>>();

async function fetchInsights(orgId: string, force: boolean): Promise<AiInsight[]> {
  const now = Date.now();
  if (!force) {
    const cached = insightsCache.get(orgId);
    if (cached && now - cached.fetchedAt < INSIGHTS_TTL_MS) {
      return cached.data;
    }
  }
  const existing = insightsInFlight.get(orgId);
  if (existing) return existing;

  const p = (async () => {
    const { data, error: invokeErr } = await supabase.functions.invoke(
      "b2b-dashboard-insights",
      { body: { org_id: orgId } },
    );
    if (invokeErr) throw invokeErr;
    if (data?.error) throw new Error(data.error);
    const list = (data?.insights ?? []) as AiInsight[];
    insightsCache.set(orgId, { data: list, fetchedAt: Date.now() });
    return list;
  })().finally(() => {
    insightsInFlight.delete(orgId);
  });

  insightsInFlight.set(orgId, p);
  return p;
}

function useAiInsights(orgId?: string) {
  const [insights, setInsights] = useState<AiInsight[] | null>(() => {
    if (!orgId) return null;
    const c = insightsCache.get(orgId);
    return c && Date.now() - c.fetchedAt < INSIGHTS_TTL_MS ? c.data : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<number>(0);

  const load = async (force = false) => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchInsights(orgId, force);
      setInsights(list);
      setLastRefreshAt(Date.now());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load insights");
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced user-initiated refresh: ignore clicks within the cooldown window.
  const refresh = () => {
    if (loading) return;
    if (Date.now() - lastRefreshAt < INSIGHTS_MIN_REFRESH_MS) return;
    load(true);
  };

  useEffect(() => {
    if (!orgId) {
      setInsights(null);
      return;
    }
    const cached = insightsCache.get(orgId);
    if (cached && Date.now() - cached.fetchedAt < INSIGHTS_TTL_MS) {
      setInsights(cached.data);
      return;
    }
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Tick once per second while the refresh cooldown is active so the UI
  // (disabled state + countdown label) updates without extra refetches.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!lastRefreshAt) return;
    const remaining = INSIGHTS_MIN_REFRESH_MS - (Date.now() - lastRefreshAt);
    if (remaining <= 0) return;
    const id = window.setInterval(() => forceTick((n) => n + 1), 1000);
    const timeout = window.setTimeout(() => {
      window.clearInterval(id);
      forceTick((n) => n + 1);
    }, remaining + 50);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(timeout);
    };
  }, [lastRefreshAt]);

  const cooldownRemaining = Math.max(
    0,
    INSIGHTS_MIN_REFRESH_MS - (Date.now() - lastRefreshAt),
  );

  return {
    insights: insights ?? [],
    loading,
    error,
    refresh,
    cooldownRemaining,
  };
}

type InsightRating = "up" | "down";

// Stable key for an insight so feedback can be tied to a specific recommendation
// even though we don't persist insights themselves.
function insightKey(i: { title: string; body: string }) {
  // Lightweight, deterministic hash (djb2-ish) of title|body. Sufficient for
  // a per-(user, org) uniqueness key — not used for security.
  const s = `${i.title}\u0001${i.body}`;
  let h = 5381;
  for (let n = 0; n < s.length; n++) h = ((h << 5) + h + s.charCodeAt(n)) | 0;
  return `v1:${(h >>> 0).toString(36)}`;
}

function useInsightFeedback(orgId: string | undefined, insights: AiInsight[]) {
  const [ratings, setRatings] = useState<Record<string, InsightRating>>({});
  // Per-key pending action: which button is mid-flight ("up" | "down" | "remove")
  const [pending, setPending] = useState<
    Record<string, "up" | "down" | "remove">
  >({});

  const keys = useMemo(() => insights.map(insightKey), [insights]);

  useEffect(() => {
    if (!orgId || keys.length === 0) {
      setRatings({});
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("ai_insight_feedback")
        .select("insight_key, rating")
        .eq("org_id", orgId)
        .in("insight_key", keys);
      if (cancelled || error) return;
      const next: Record<string, InsightRating> = {};
      for (const r of data ?? []) {
        next[r.insight_key as string] = r.rating as InsightRating;
      }
      setRatings(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, keys.join("|")]);

  const submit = async (insight: AiInsight, rating: InsightRating) => {
    if (!orgId) return;
    const key = insightKey(insight);
    const current = ratings[key];
    const isRemoval = current === rating;
    const action: "up" | "down" | "remove" = isRemoval ? "remove" : rating;

    // Block double-clicks on this insight while a request is in flight.
    if (pending[key]) return;
    setPending((p) => ({ ...p, [key]: action }));

    const toastId = toast.loading(
      isRemoval
        ? "Removing your feedback…"
        : rating === "up"
          ? "Saving 👍…"
          : "Saving 👎…",
    );

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Please sign in to leave feedback.");

      if (isRemoval) {
        // Toggle off → remove feedback
        const { error } = await supabase
          .from("ai_insight_feedback")
          .delete()
          .eq("user_id", userId)
          .eq("org_id", orgId)
          .eq("insight_key", key);
        if (error) throw error;
        setRatings((r) => {
          const { [key]: _, ...rest } = r;
          return rest;
        });
        toast.success("Feedback removed", { id: toastId });
      } else {
        const { error } = await supabase
          .from("ai_insight_feedback")
          .upsert(
            {
              user_id: userId,
              org_id: orgId,
              insight_key: key,
              insight_title: insight.title,
              rating,
            },
            { onConflict: "user_id,org_id,insight_key" },
          );
        if (error) throw error;
        setRatings((r) => ({ ...r, [key]: rating }));
        toast.success(
          rating === "up"
            ? "Thanks for the 👍"
            : "Thanks — we'll use this to improve",
          { id: toastId },
        );
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save feedback", { id: toastId });
    } finally {
      setPending((p) => {
        const { [key]: _, ...rest } = p;
        return rest;
      });
    }
  };

  return { ratings, pending, submit };
}

type ChannelCount = { source: string; count: number };
export type ChannelRange = "7d" | "30d" | "90d" | "all";

const RANGE_LABELS: Record<ChannelRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

function rangeSince(range: ChannelRange): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function useInviteChannelCounts(orgId?: string, range: ChannelRange = "30d") {
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
      let q = supabase
        .from("assessment_invites")
        .select("source")
        .in("assessment_id", ids);
      const since = rangeSince(range);
      if (since) q = q.gte("created_at", since);
      const { data: rows } = await q;
      const counts = new Map<string, number>();
      (rows ?? []).forEach((r: any) => {
        const k = r.source ?? "manual";
        counts.set(k, (counts.get(k) ?? 0) + 1);
      });
      setData(
        Array.from(counts.entries()).map(([source, count]) => ({ source, count })),
      );
    })();
  }, [orgId, range]);
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

  const [statsRange, setStatsRange] = useState<"7d" | "30d" | "90d">("30d");
  const { data: stats } = useDashboardStats(org?.id, statsRange);
  const { data: assessments } = useAssessments(org?.id);
  const series = useSubmissionsSeries(org?.id, 30);
  const [channelRange, setChannelRange] = useState<ChannelRange>("30d");
  const channelCounts = useInviteChannelCounts(org?.id, channelRange);

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

  // Real per-source invite counts (assessment_invites.source).
  const CHANNEL_DEFS: {
    source: string;
    label: string;
    icon: LucideIcon;
    color: string;
  }[] = [
    { source: "email", label: "Email Invites", icon: Mail, color: "hsl(var(--primary))" },
    { source: "link", label: "Shareable Link", icon: Link2, color: "#3b82f6" },
    { source: "bulk_upload", label: "Bulk Upload", icon: Upload, color: "#f97316" },
    { source: "manual", label: "Manual Add", icon: UserPlus, color: "#a855f7" },
    { source: "api", label: "API / SSO", icon: Webhook, color: "#22d3ee" },
  ];
  const countBySource = new Map(channelCounts.map((c) => [c.source, c.count]));
  const channelTotal = channelCounts.reduce((s, c) => s + c.count, 0);
  const channelData = CHANNEL_DEFS.map((c) => {
    const value = countBySource.get(c.source) ?? 0;
    const pct = channelTotal ? Math.round((value / channelTotal) * 100) : 0;
    return { ...c, value, pct };
  });

  const recent = (assessments ?? []).slice(0, 5);
  const {
    insights,
    loading: insightsLoading,
    error: insightsError,
    refresh: refreshInsights,
    cooldownRemaining: insightsCooldown,
  } = useAiInsights(org?.id);
  const {
    ratings: insightRatings,
    pending: insightPending,
    submit: submitInsightFeedback,
  } = useInsightFeedback(org?.id, insights);

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
      {(() => {
        const d = stats?.deltas;
        const toDelta = (
          v: number | null | undefined,
          unit: "%" | "pts",
        ): Delta | undefined => {
          if (v == null) return undefined;
          // Round magnitude to 1 decimal so "pts" deltas read consistently as
          // absolute percentage-point changes (e.g. "+3.2 pts", "−1.5 pts").
          const magnitude = Math.round(Math.abs(v) * 10) / 10;
          const direction = v > 0 ? "up" : v < 0 ? "down" : "flat";
          return { value: magnitude, direction, unit };
        };
        const windowDays = statsRange === "7d" ? 7 : statsRange === "90d" ? 90 : 30;
        const hint = `vs prev ${windowDays}d`;
        return (
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Key metrics
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Compare
                </span>
                <Select
                  value={statsRange}
                  onValueChange={(v) => setStatsRange(v as "7d" | "30d" | "90d")}
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
                hint={hint}
                windowDays={windowDays}
              />
              <KpiCard
                label="Candidates Invited"
                value={stats?.invites ?? 0}
                icon={Users}
                delta={toDelta(d?.invites, "%")}
                hint={hint}
                windowDays={windowDays}
              />
              <KpiCard
                label="Submissions"
                value={stats?.submissions ?? 0}
                icon={CheckCircle2}
                delta={toDelta(d?.submissions, "%")}
                hint={hint}
                windowDays={windowDays}
              />
              <KpiCard
                label="Avg Integrity"
                value={
                  stats?.avgIntegrity != null ? `${stats.avgIntegrity}%` : "—"
                }
                icon={ShieldCheck}
                delta={toDelta(d?.avgIntegrity, "pts")}
                hint={hint}
                windowDays={windowDays}
              />
            </div>
          </div>
        );
      })()}

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
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-semibold">Top Invite Channels</h2>
            <Badge variant="secondary" className="font-medium">
              {channelTotal} invites
            </Badge>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Source mix · {RANGE_LABELS[channelRange].toLowerCase()}
            </p>
            <Select
              value={channelRange}
              onValueChange={(v) => setChannelRange(v as ChannelRange)}
            >
              <SelectTrigger className="h-7 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RANGE_LABELS) as ChannelRange[]).map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {RANGE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-5 space-y-4">
            {channelTotal === 0 ? (
              <p className="text-xs text-[hsl(var(--muted-foreground))] py-6 text-center">
                No invites in this range yet. Try a wider window.
              </p>
            ) : (
              channelData.map((c) => <ChannelRow key={c.source} {...c} />)
            )}
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[hsl(var(--primary))]/15 grid place-items-center">
                <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
              </div>
              <div>
                <h2 className="text-base font-semibold">AI Insights</h2>
                <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Generated from your last {stats?.windows.windowDays ?? 30} days
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                title="View feedback dashboard"
                aria-label="View AI insights feedback dashboard"
              >
                <a href={base === "/b2b" ? "/b2b/insights/feedback" : `${base}/insights/feedback`}>
                  <MessageSquare className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() =>
                  exportInsightsToPdf(
                    org.name,
                    insights,
                    stats?.windows ?? null,
                  )
                }
                disabled={insightsLoading || insights.length === 0}
                title="Export AI insights as PDF"
                aria-label="Export AI insights as PDF"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => refreshInsights()}
                disabled={insightsLoading || insightsCooldown > 0}
                title={
                  insightsCooldown > 0
                    ? `Please wait ${Math.ceil(insightsCooldown / 1000)}s before refreshing again`
                    : "Refresh insights"
                }
                aria-label="Refresh AI insights"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${insightsLoading ? "animate-spin" : ""}`}
                />
                {insightsCooldown > 0 && !insightsLoading && (
                  <span className="ml-1 tabular-nums text-[hsl(var(--muted-foreground))]">
                    {Math.ceil(insightsCooldown / 1000)}s
                  </span>
                )}
              </Button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {insightsLoading && insights.length === 0 && (
              <>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg border border-[hsl(var(--border))]/60 bg-[hsl(var(--background))]/30 animate-pulse"
                  />
                ))}
              </>
            )}
            {!insightsLoading && insightsError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-400">
                Could not generate insights: {insightsError}
              </div>
            )}
            {!insightsLoading &&
              !insightsError &&
              insights.length === 0 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] py-4 text-center">
                  Not enough activity yet. Run an assessment to unlock insights.
                </p>
              )}
            {stats?.windows && (insights.length > 0 || !insightsLoading) && (() => {
              const w = stats.windows;
              const fmtPair = (curr: number | null, prev: number | null, suffix = "") => {
                const c = curr == null ? "—" : `${curr}${suffix}`;
                const p = prev == null ? "—" : `${prev}${suffix}`;
                return `${c} vs ${p}`;
              };
              const rows: { label: string; value: string }[] = [
                { label: "Assessments", value: fmtPair(w.assessments.curr, w.assessments.prev) },
                { label: "Candidates invited", value: fmtPair(w.invites.curr, w.invites.prev) },
                { label: "Submissions", value: fmtPair(w.submissions.curr, w.submissions.prev) },
                { label: "Avg integrity", value: fmtPair(w.avgIntegrity.curr, w.avgIntegrity.prev, "%") },
              ];
              return (
                <details className="group rounded-lg border border-[hsl(var(--border))]/60 bg-[hsl(var(--background))]/30 text-xs">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                    <span>
                      Underlying numbers
                      <span className="ml-1.5 text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]/80">
                        last {w.windowDays}d vs prev {w.windowDays}d
                      </span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                  </summary>
                  <dl className="divide-y divide-[hsl(var(--border))]/40 border-t border-[hsl(var(--border))]/40">
                    {rows.map((r) => (
                      <div key={r.label} className="flex items-center justify-between gap-3 px-3 py-1.5">
                        <dt className="text-[hsl(var(--muted-foreground))]">{r.label}</dt>
                        <dd className="font-mono tabular-nums">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              );
            })()}
            {insights.map((i, idx) => {
              const tone =
                i.severity === "positive"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : i.severity === "warning"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-[hsl(var(--border))]/60 bg-[hsl(var(--background))]/40";
              const dot =
                i.severity === "positive"
                  ? "bg-emerald-500"
                  : i.severity === "warning"
                  ? "bg-amber-500"
                  : "bg-[hsl(var(--primary))]";
              const key = insightKey(i);
              const rating = insightRatings[key];
              const pendingAction = insightPending[key];
              const isPending = !!pendingAction;
              const upBusy =
                pendingAction === "up" ||
                (pendingAction === "remove" && rating === "up");
              const downBusy =
                pendingAction === "down" ||
                (pendingAction === "remove" && rating === "down");
              const thumbBase =
                "inline-flex items-center justify-center h-6 w-6 rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
              return (
                <div
                  key={`${i.title}-${idx}`}
                  className={`rounded-lg border p-3 ${tone}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    <p className="text-sm font-medium">{i.title}</p>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 leading-relaxed">
                    {i.body}
                  </p>
                  {i.action && (
                    <p className="text-xs text-[hsl(var(--primary))] mt-1.5 font-medium">
                      → {i.action}
                    </p>
                  )}
                  {stats?.windows && (() => {
                    const w = stats.windows;
                    const fmtPair = (
                      curr: number | null,
                      prev: number | null,
                      suffix = "",
                    ) => {
                      const c = curr == null ? "—" : `${curr}${suffix}`;
                      const p = prev == null ? "—" : `${prev}${suffix}`;
                      return `${c} vs ${p}`;
                    };
                    const allRows: {
                      label: string;
                      value: string;
                      keywords: RegExp;
                    }[] = [
                      {
                        label: "Assessments",
                        value: fmtPair(w.assessments.curr, w.assessments.prev),
                        keywords: /assessment|test|exam|quiz/i,
                      },
                      {
                        label: "Candidates invited",
                        value: fmtPair(w.invites.curr, w.invites.prev),
                        keywords: /invit|candidat|pending|reminder|outreach/i,
                      },
                      {
                        label: "Submissions",
                        value: fmtPair(w.submissions.curr, w.submissions.prev),
                        keywords: /submission|submit|complet|response|attempt/i,
                      },
                      {
                        label: "Avg integrity",
                        value: fmtPair(
                          w.avgIntegrity.curr,
                          w.avgIntegrity.prev,
                          "%",
                        ),
                        keywords: /integrity|cheat|proctor|flag|suspicious|honest/i,
                      },
                    ];
                    const haystack = `${i.title}\n${i.body}\n${i.action ?? ""}`;
                    const matched = allRows.filter((r) =>
                      r.keywords.test(haystack),
                    );
                    const rows = matched.length ? matched : allRows;
                    return (
                      <details className="group mt-2">
                        <summary className="flex cursor-pointer list-none items-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                          <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                          <span>View sources</span>
                          <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]/70">
                            last {w.windowDays}d vs prev {w.windowDays}d
                          </span>
                        </summary>
                        <dl className="mt-1.5 rounded-md border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/40 divide-y divide-[hsl(var(--border))]/40 text-xs">
                          {rows.map((r) => (
                            <div
                              key={r.label}
                              className="flex items-center justify-between gap-3 px-2.5 py-1.5"
                            >
                              <dt className="text-[hsl(var(--muted-foreground))]">
                                {r.label}
                              </dt>
                              <dd className="font-mono tabular-nums">
                                {r.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    );
                  })()}
                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[hsl(var(--border))]/40 pt-2">
                    <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Was this helpful?
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Mark insight as helpful"
                        aria-pressed={rating === "up"}
                        aria-busy={upBusy}
                        disabled={isPending}
                        onClick={() => submitInsightFeedback(i, "up")}
                        className={`${thumbBase} ${
                          rating === "up"
                            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-500"
                            : "border-[hsl(var(--border))]/60 text-[hsl(var(--muted-foreground))] hover:text-emerald-500 hover:border-emerald-500/40"
                        }`}
                      >
                        {upBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label="Mark insight as not helpful"
                        aria-pressed={rating === "down"}
                        aria-busy={downBusy}
                        disabled={isPending}
                        onClick={() => submitInsightFeedback(i, "down")}
                        className={`${thumbBase} ${
                          rating === "down"
                            ? "border-rose-500/60 bg-rose-500/15 text-rose-500"
                            : "border-[hsl(var(--border))]/60 text-[hsl(var(--muted-foreground))] hover:text-rose-500 hover:border-rose-500/40"
                        }`}
                      >
                        {downBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ThumbsDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
