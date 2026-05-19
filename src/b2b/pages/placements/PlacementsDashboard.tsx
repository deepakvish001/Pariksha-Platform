import { useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { OrgShell } from "../../layouts/OrgShell";
import { useCurrentOrg } from "../../context/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Briefcase, Building2, TrendingUp, Trophy, Sparkles, Users, IndianRupee, Star, RefreshCw, Share2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { RankingsTab } from "./RankingsTab";
import { SharesTab } from "./SharesTab";

type Filters = {
  batch_years?: number[];
  branches?: string[];
  sections?: string[];
  drive_statuses?: string[];
  sectors?: string[];
  student_status?: "any" | "placed" | "unplaced" | "multi_offer";
  ctc_min?: string;
  ctc_max?: string;
  date_from?: string;
  date_to?: string;
};

type Overview = {
  kpis: Record<string, number | null>;
  funnel: { stage: string; count: number }[];
  by_branch: { branch: string; total: number; placed: number }[];
  by_sector: { sector: string; offers: number; avg_ctc: number | null }[];
  ctc_distribution: { band: string; count: number }[];
  top_recruiters: {
    recruiter_id: string;
    name: string;
    sector: string;
    offers: number;
    avg_ctc: number | null;
    is_repeat: boolean;
  }[];
  live_drives: {
    drive_id: string;
    title: string;
    recruiter_name: string;
    sector: string;
    status: string;
    opens_at: string | null;
    closes_at: string | null;
    ctc_min: number | null;
    ctc_max: number | null;
    applied: number;
    shortlisted: number;
    offered: number;
  }[];
  filter_options: {
    branches: string[];
    batch_years: number[];
    sections: string[];
    sectors: string[];
  };
};

const fmtLakh = (v?: number | null) =>
  v == null ? "—" : `₹${(Number(v) / 100000).toFixed(1)}L`;

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]/70 bg-gradient-to-br from-[hsl(var(--card))]/80 to-[hsl(var(--card))]/40 backdrop-blur-xl shadow-[0_1px_0_0_hsl(0_0%_100%/0.04)_inset,0_20px_50px_-30px_hsl(0_0%_0%/0.6)] ${className}`}
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[hsl(var(--primary))]/8 blur-3xl" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, hint,
}: { icon: any; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight truncate">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
        </div>
        <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary))]/12 text-[hsl(var(--primary))] grid place-items-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </GlassCard>
  );
}

function parseList(v: string | null): string[] {
  return v ? v.split(",").filter(Boolean) : [];
}

export default function PlacementsDashboard() {
  const { org, isLoading: orgLoading } = useCurrentOrg();
  const [sp, setSp] = useSearchParams();

  const filters: Filters = useMemo(() => ({
    batch_years: parseList(sp.get("batch")).map(Number).filter((n) => !Number.isNaN(n)),
    branches: parseList(sp.get("branch")),
    sections: parseList(sp.get("section")),
    drive_statuses: parseList(sp.get("status")),
    sectors: parseList(sp.get("sector")),
    student_status: (sp.get("ss") as Filters["student_status"]) || "any",
    ctc_min: sp.get("cmin") || undefined,
    ctc_max: sp.get("cmax") || undefined,
    date_from: sp.get("from") || undefined,
    date_to: sp.get("to") || undefined,
  }), [sp]);

  const setFilter = (key: string, val: string | undefined) => {
    const next = new URLSearchParams(sp);
    if (!val) next.delete(key);
    else next.set(key, val);
    setSp(next, { replace: true });
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["placement_overview", org?.id, sp.toString()],
    enabled: !!org?.id,
    queryFn: async (): Promise<Overview> => {
      const payload: Record<string, unknown> = {};
      if (filters.batch_years?.length) payload.batch_years = filters.batch_years;
      if (filters.branches?.length) payload.branches = filters.branches;
      if (filters.sections?.length) payload.sections = filters.sections;
      if (filters.drive_statuses?.length) payload.drive_statuses = filters.drive_statuses;
      if (filters.sectors?.length) payload.sectors = filters.sectors;
      if (filters.student_status && filters.student_status !== "any")
        payload.student_status = filters.student_status;
      if (filters.ctc_min) payload.ctc_min = filters.ctc_min;
      if (filters.ctc_max) payload.ctc_max = filters.ctc_max;
      if (filters.date_from) payload.date_from = filters.date_from;
      if (filters.date_to) payload.date_to = filters.date_to;

      const { data, error } = await supabase.rpc("placement_overview" as any, {
        _org: org!.id,
        _filters: payload,
      });
      if (error) throw error;
      return data as unknown as Overview;
    },
  });

  if (orgLoading) return null;
  if (!org) return <Navigate to="/b2b" replace />;

  const kpis = data?.kpis ?? {};
  const opts = data?.filter_options ?? { branches: [], batch_years: [], sections: [], sectors: [] };

  const fillFor = (i: number) =>
    ["hsl(var(--primary))", "hsl(var(--primary)/0.85)", "hsl(var(--primary)/0.7)",
     "hsl(var(--primary)/0.55)", "hsl(var(--primary)/0.4)"][i % 5];

  return (
    <OrgShell
      title="Placement Report"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      <div className="px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <Tabs value={sp.get("tab") || "overview"} onValueChange={(v) => { sp.set("tab", v); setSp(sp, { replace: true }); }} className="space-y-5">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rankings">
              <Trophy className="h-3.5 w-3.5 mr-1.5" />Student Rankings
            </TabsTrigger>
            <TabsTrigger value="shares">
              <Share2 className="h-3.5 w-3.5 mr-1.5" />Shares
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5">
        {/* Filter bar */}
        <GlassCard className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" /> Filters
            </Badge>

            <Select
              value={(filters.batch_years?.[0] ?? "").toString() || "all"}
              onValueChange={(v) => setFilter("batch", v === "all" ? undefined : v)}
            >
              <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Batch year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                {opts.batch_years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.branches?.[0] || "all"}
              onValueChange={(v) => setFilter("branch", v === "all" ? undefined : v)}
            >
              <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {opts.branches.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.drive_statuses?.[0] || "all"}
              onValueChange={(v) => setFilter("status", v === "all" ? undefined : v)}
            >
              <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Drive status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sectors?.[0] || "all"}
              onValueChange={(v) => setFilter("sector", v === "all" ? undefined : v)}
            >
              <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Sector" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sectors</SelectItem>
                {opts.sectors.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.student_status || "any"}
              onValueChange={(v) => setFilter("ss", v === "any" ? undefined : v)}
            >
              <SelectTrigger className="h-8 w-[150px]"><SelectValue placeholder="Student status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All students</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="unplaced">Unplaced</SelectItem>
                <SelectItem value="multi_offer">Multi-offer</SelectItem>
              </SelectContent>
            </Select>

            {Array.from(sp.keys()).length > 0 && (
              <Button variant="ghost" size="sm" className="h-8" onClick={() => setSp({}, { replace: true })}>
                Clear
              </Button>
            )}
          </div>
        </GlassCard>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Kpi icon={Users} label="Eligible" value={kpis.eligible ?? 0} />
          <Kpi icon={TrendingUp} label="Placement %" value={`${kpis.placement_pct ?? 0}%`}
               hint={`${kpis.accepted ?? 0} accepted`} />
          <Kpi icon={Trophy} label="Multi-offer" value={kpis.multi_offer ?? 0} />
          <Kpi icon={IndianRupee} label="Avg CTC" value={fmtLakh(kpis.avg_ctc)} hint={`Med ${fmtLakh(kpis.median_ctc)}`} />
          <Kpi icon={Star} label="Top CTC" value={fmtLakh(kpis.top_ctc)} hint={`${kpis.dream_offers ?? 0} dream`} />
          <Kpi icon={Building2} label="Recruiters" value={kpis.recruiters_total ?? 0}
               hint={`${kpis.drives_open ?? 0} drives open`} />
        </div>

        {/* Funnel + branch */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold tracking-tight">Placement funnel</h3>
              <Badge variant="outline" className="text-[10px]">Eligible → Accepted</Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.funnel ?? []} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={90}
                         stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {(data?.funnel ?? []).map((_, i) => <Cell key={i} fill={fillFor(i)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold tracking-tight">Branch performance</h3>
              <Badge variant="outline" className="text-[10px]">Placed / Total</Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.by_branch ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis dataKey="branch" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="total" fill="hsl(var(--muted-foreground)/0.3)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="placed" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* CTC distribution + top recruiters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold tracking-tight mb-3">CTC distribution</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.ctc_distribution ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis dataKey="band" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold tracking-tight mb-3">Top recruiters</h3>
            <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]/60">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(var(--muted))]/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Recruiter</th>
                    <th className="text-left px-3 py-2 font-medium">Sector</th>
                    <th className="text-right px-3 py-2 font-medium">Offers</th>
                    <th className="text-right px-3 py-2 font-medium">Avg CTC</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.top_recruiters ?? []).length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground text-xs">No offers yet — add drives & offers to see rankings.</td></tr>
                  ) : (data?.top_recruiters ?? []).map((r) => (
                    <tr key={r.recruiter_id} className="border-t border-[hsl(var(--border))]/40">
                      <td className="px-3 py-2 font-medium">
                        {r.name} {r.is_repeat && <Badge variant="outline" className="ml-1 text-[10px]">Repeat</Badge>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.sector}</td>
                      <td className="px-3 py-2 text-right">{r.offers}</td>
                      <td className="px-3 py-2 text-right">{fmtLakh(r.avg_ctc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Live drives */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> Drives ({data?.live_drives?.length ?? 0})
            </h3>
          </div>
          <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]/60">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--muted))]/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Drive</th>
                  <th className="text-left px-3 py-2 font-medium">Recruiter</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-right px-3 py-2 font-medium">CTC range</th>
                  <th className="text-right px-3 py-2 font-medium">Applied</th>
                  <th className="text-right px-3 py-2 font-medium">Shortlisted</th>
                  <th className="text-right px-3 py-2 font-medium">Offered</th>
                </tr>
              </thead>
              <tbody>
                {(data?.live_drives ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center">
                      <div className="text-sm text-muted-foreground">No drives recorded yet.</div>
                      <div className="text-xs text-muted-foreground/70 mt-1">
                        Add recruiters and drives to start populating this report.
                      </div>
                    </td>
                  </tr>
                ) : (data?.live_drives ?? []).map((d) => (
                  <tr key={d.drive_id} className="border-t border-[hsl(var(--border))]/40">
                    <td className="px-3 py-2 font-medium truncate max-w-[280px]">{d.title}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.recruiter_name}</td>
                    <td className="px-3 py-2">
                      <Badge variant={d.status === "open" ? "default" : "outline"} className="capitalize text-[10px]">
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      {d.ctc_min || d.ctc_max ? `${fmtLakh(d.ctc_min)} – ${fmtLakh(d.ctc_max)}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{d.applied}</td>
                    <td className="px-3 py-2 text-right">{d.shortlisted}</td>
                    <td className="px-3 py-2 text-right">{d.offered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {isLoading && (
          <div className="text-center text-xs text-muted-foreground py-4">Loading…</div>
        )}
          </TabsContent>

          <TabsContent value="rankings">
            <RankingsTab orgId={org.id} />
          </TabsContent>

          <TabsContent value="shares">
            <SharesTab orgId={org.id} />
          </TabsContent>
        </Tabs>
      </div>
    </OrgShell>
  );
}
