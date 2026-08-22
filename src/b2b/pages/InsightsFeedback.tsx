import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { OrgShell } from "../layouts/OrgShell";
import { useCurrentOrg } from "../context/OrgContext";
import { supabase } from "@/integrations/supabase/client";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThumbsUp, ThumbsDown, RefreshCw, MessageSquare } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

type SummaryRow = {
  insight_key: string;
  insight_title: string;
  up_count: number;
  down_count: number;
  total_count: number;
  net_score: number;
  last_at: string;
};

type TrendRow = {
  day: string;
  insight_key: string;
  insight_title: string;
  up_count: number;
  down_count: number;
};

type RangeDays = 7 | 30 | 90;
const RANGE_LABEL: Record<RangeDays, string> = {
  7: "Last 7 days",
  30: "Last 30 days",
  90: "Last 90 days",
};

export default function InsightsFeedback() {
  const { org, isLoading: orgLoading } = useCurrentOrg();
  const [days, setDays] = useState<RangeDays>(30);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const summary = useQuery({
    queryKey: ["b2b", "insight-feedback", "summary", org?.id],
    enabled: !!org?.id,
    queryFn: async (): Promise<SummaryRow[]> => {
      const { data, error } = await supabase.rpc(
        "get_ai_insight_feedback_summary",
        { _org_id: org!.id },
      );
      if (error) throw error;
      return (data ?? []) as SummaryRow[];
    },
  });

  const trend = useQuery({
    queryKey: ["b2b", "insight-feedback", "trend", org?.id, days],
    enabled: !!org?.id,
    queryFn: async (): Promise<TrendRow[]> => {
      const { data, error } = await supabase.rpc(
        "get_ai_insight_feedback_trend",
        { _org_id: org!.id, _days: days },
      );
      if (error) throw error;
      return (data ?? []) as TrendRow[];
    },
  });

  const totals = useMemo(() => {
    const rows = summary.data ?? [];
    return rows.reduce(
      (acc, r) => {
        acc.up += Number(r.up_count) || 0;
        acc.down += Number(r.down_count) || 0;
        acc.total += Number(r.total_count) || 0;
        return acc;
      },
      { up: 0, down: 0, total: 0 },
    );
  }, [summary.data]);

  // Build a complete daily series for the selected (or aggregate) insight
  const chartData = useMemo(() => {
    const rows = trend.data ?? [];
    const filtered = selectedKey
      ? rows.filter((r) => r.insight_key === selectedKey)
      : rows;

    const byDay = new Map<string, { up: number; down: number }>();
    for (const r of filtered) {
      const existing = byDay.get(r.day) ?? { up: 0, down: 0 };
      existing.up += Number(r.up_count) || 0;
      existing.down += Number(r.down_count) || 0;
      byDay.set(r.day, existing);
    }

    // Fill every day in the window so the line chart shows zeros
    const out: { day: string; up: number; down: number; net: number }[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      const v = byDay.get(key) ?? { up: 0, down: 0 };
      out.push({
        day: key.slice(5), // MM-DD for axis
        up: v.up,
        down: v.down,
        net: v.up - v.down,
      });
    }
    return out;
  }, [trend.data, selectedKey, days]);

  if (!orgLoading && !org) {
    return <Navigate to="/b2b/onboarding" replace />;
  }

  const onRefresh = () => {
    summary.refetch();
    trend.refetch();
  };

  return (
    <OrgShell
      title={
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[hsl(var(--primary))]" />
          <span>AI Insights Feedback</span>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Select
            value={String(days)}
            onValueChange={(v) => setDays(Number(v) as RangeDays)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[7, 30, 90].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {RANGE_LABEL[d as RangeDays]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={summary.isFetching || trend.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${summary.isFetching || trend.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Thumbs up"
            value={totals.up}
            icon={<ThumbsUp className="h-4 w-4 text-emerald-500" />}
          />
          <StatCard
            label="Thumbs down"
            value={totals.down}
            icon={<ThumbsDown className="h-4 w-4 text-rose-500" />}
          />
          <StatCard
            label="Total responses"
            value={totals.total}
            icon={<MessageSquare className="h-4 w-4 text-[hsl(var(--primary))]" />}
          />
        </div>

        {/* Trend */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-base font-semibold">
                Daily up/down trend
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedKey
                  ? "Filtered to the selected insight"
                  : "Across all insights for this organization"}
              </p>
            </div>
            <Select
              value={selectedKey ?? "__all"}
              onValueChange={(v) => setSelectedKey(v === "__all" ? null : v)}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="All insights" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All insights</SelectItem>
                {(summary.data ?? []).map((r) => (
                  <SelectItem key={r.insight_key} value={r.insight_key}>
                    {truncate(r.insight_title || r.insight_key, 50)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="h-[280px]">
            {trend.isLoading ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">
                Loading trend…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="up"
                    name="Up"
                    stroke="hsl(142 71% 45%)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="down"
                    name="Down"
                    stroke="hsl(0 84% 60%)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Per-insight table */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl">
          <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
            <h2 className="text-base font-semibold">By insight</h2>
            <p className="text-xs text-muted-foreground">
              Click a row to filter the trend chart above.
            </p>
          </div>
          {summary.isLoading ? (
            <div className="p-8 text-sm text-muted-foreground text-center">
              Loading…
            </div>
          ) : (summary.data ?? []).length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">
              No feedback recorded yet. Once members rate AI insights on the
              dashboard, results will appear here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insight</TableHead>
                  <TableHead className="text-right">Up</TableHead>
                  <TableHead className="text-right">Down</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Last response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(summary.data ?? []).map((r) => {
                  const isActive = selectedKey === r.insight_key;
                  return (
                    <TableRow
                      key={r.insight_key}
                      tabIndex={0}
                      onClick={() =>
                        setSelectedKey(isActive ? null : r.insight_key)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedKey(isActive ? null : r.insight_key);
                        }
                      }}
                      className={`cursor-pointer ${isActive ? "bg-[hsl(var(--accent))]/40" : ""}`}
                    >
                      <TableCell className="max-w-[420px]">
                        <div className="font-medium truncate">
                          {r.insight_title || r.insight_key}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate">
                          {r.insight_key}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {r.up_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className="bg-rose-500/10 text-rose-600 border-rose-500/20"
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          {r.down_count}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          Number(r.net_score) > 0
                            ? "text-emerald-600"
                            : Number(r.net_score) < 0
                              ? "text-rose-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {Number(r.net_score) > 0 ? "+" : ""}
                        {r.net_score}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.total_count}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {r.last_at
                          ? formatDistanceToNow(new Date(r.last_at), {
                              addSuffix: true,
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </OrgShell>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</div>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
