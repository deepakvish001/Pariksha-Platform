import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShellHeader } from "./ParikshaaShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Eye,
  MousePointerClick,
  Send,
  Building2,
  ArrowDown,
  TrendingDown,
  CalendarIcon,
  Globe,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

type Preset = "1" | "7" | "30" | "90" | "custom";

const PRESETS: { v: Preset; l: string }[] = [
  { v: "1", l: "Last 24 hours" },
  { v: "7", l: "Last 7 days" },
  { v: "30", l: "Last 30 days" },
  { v: "90", l: "Last 90 days" },
  { v: "custom", l: "Custom range" },
];

const ALL_PAGES = "__all__";

export default function FunnelDashboard() {
  const [preset, setPreset] = useState<Preset>("30");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [page, setPage] = useState<string>(ALL_PAGES);

  const { from, to } = useMemo(() => {
    if (preset === "custom" && customFrom) {
      const t = customTo ?? new Date();
      return { from: customFrom.toISOString(), to: new Date(t.getTime() + 86_400_000).toISOString() };
    }
    const d = new Date();
    d.setDate(d.getDate() - parseInt(preset === "custom" ? "30" : preset, 10));
    return { from: d.toISOString(), to: new Date().toISOString() };
  }, [preset, customFrom, customTo]);

  // Distinct landing pages for the filter
  const { data: pages = [] } = useQuery({
    queryKey: ["funnel-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_events")
        .select("page")
        .not("page", "is", null)
        .limit(2000);
      if (error) throw error;
      const set = new Set<string>();
      for (const r of data ?? []) if (r.page) set.add(r.page);
      return Array.from(set).sort();
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["funnel-events", from, to, page],
    queryFn: async () => {
      let q = supabase
        .from("lead_events")
        .select("event_type, session_id, created_at, page")
        .gte("created_at", from)
        .lt("created_at", to)
        .limit(20000);
      if (page !== ALL_PAGES) q = q.eq("page", page);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["funnel-orgs", from, to, page],
    queryFn: async () => {
      // Page filter only applies when we can correlate; orgs aren't page-scoped.
      const { data, error } = await supabase
        .from("organizations")
        .select("id, created_at")
        .gte("created_at", from)
        .lt("created_at", to)
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const sessions: Record<string, Set<string>> = {
      view: new Set(),
      start: new Set(),
      submit: new Set(),
    };
    const counts: Record<string, number> = { view: 0, start: 0, submit: 0 };
    for (const ev of events) {
      const sid = ev.session_id ?? `evt:${ev.created_at}`;
      const t = ev.event_type ?? "";
      if (t === "b2b_landing_view" || t === "landing_page_view") {
        sessions.view.add(sid); counts.view++;
      } else if (t === "b2b_hero_form_start") {
        sessions.start.add(sid); counts.start++;
      } else if (t === "b2b_hero_form_submit" || t === "hero_lead_submitted") {
        sessions.submit.add(sid); counts.submit++;
      }
    }
    return {
      view: sessions.view.size || counts.view,
      start: sessions.start.size || counts.start,
      submit: sessions.submit.size || counts.submit,
      onboarded: page === ALL_PAGES ? orgs.length : 0,
    };
  }, [events, orgs, page]);

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

  const steps = [
    { key: "view", label: "Page view", value: stats.view, icon: Eye, color: "hsl(199 89% 56%)", grad: "from-sky-500 to-sky-400" },
    { key: "start", label: "Form start", value: stats.start, icon: MousePointerClick, color: "hsl(38 92% 55%)", grad: "from-amber-500 to-amber-400" },
    { key: "submit", label: "Form submit", value: stats.submit, icon: Send, color: "hsl(24 95% 53%)", grad: "from-orange-500 to-orange-400" },
    { key: "onboarded", label: "Onboarded org", value: stats.onboarded, icon: Building2, color: "hsl(160 84% 39%)", grad: "from-emerald-500 to-emerald-400" },
  ];

  const chartData = steps.map((s, i) => {
    const prev = i > 0 ? steps[i - 1].value : null;
    const drop = prev != null ? prev - s.value : 0;
    return {
      name: s.label,
      value: s.value,
      dropped: drop > 0 ? drop : 0,
      conv: prev != null ? pct(s.value, prev) : null,
      color: s.color,
    };
  });

  return (
    <>
      <ShellHeader
        title="Conversion Funnel"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <Select value={page} onValueChange={setPage}>
                <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PAGES}>All landing pages</SelectItem>
                  {pages.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRESETS.map((w) => (<SelectItem key={w.v} value={w.v}>{w.l}</SelectItem>))}
              </SelectContent>
            </Select>
            {preset === "custom" && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-9 justify-start text-left font-normal", !customFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {customFrom ? format(customFrom, "MMM d") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-9 justify-start text-left font-normal", !customTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {customTo ? format(customTo, "MMM d") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((s, i) => {
            const prev = i > 0 ? steps[i - 1].value : null;
            const conv = prev != null ? pct(s.value, prev) : null;
            const Icon = s.icon;
            return (
              <div key={s.key} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {conv != null && (
                    <span className={`text-[11px] font-medium ${conv < 30 ? "text-red-400" : conv < 60 ? "text-amber-400" : "text-emerald-400"}`}>
                      {conv}% from prev
                    </span>
                  )}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">{s.value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Drop-off chart */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Funnel drop-off</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {page === ALL_PAGES ? "All landing pages" : page} · {format(new Date(from), "MMM d")} → {format(new Date(to), "MMM d")}
              </p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <RTooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number, _n, item: any) => {
                    const conv = item?.payload?.conv;
                    return [`${v.toLocaleString()}${conv != null ? `  (${conv}% conv.)` : ""}`, "Sessions"];
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  <LabelList dataKey="value" position="top" fontSize={11} fill="hsl(var(--foreground))" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Step bars with drop-off labels */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-semibold tracking-tight mb-1">Step-by-step breakdown</h3>
          <p className="text-xs text-muted-foreground mb-5">
            Sessions tracked via <code className="text-[10px]">lead_events</code>{page !== ALL_PAGES ? " · onboarding excluded when filtering by page" : ""}.
          </p>
          <div className="space-y-3">
            {(() => {
              const max = Math.max(...steps.map((s) => s.value), 1);
              return steps.map((s, i) => {
                const width = (s.value / max) * 100;
                const prev = i > 0 ? steps[i - 1].value : null;
                const drop = prev != null ? prev - s.value : 0;
                const dropPct = prev != null ? pct(drop, prev) : 0;
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium">{s.label}</span>
                      <span className="text-muted-foreground">{s.value.toLocaleString()}</span>
                    </div>
                    <div className="h-8 rounded-md bg-muted/40 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${s.grad} transition-all`}
                        style={{ width: `${Math.max(width, 2)}%` }}
                      />
                    </div>
                    {prev != null && drop > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-red-400/80 mt-1.5 pl-1">
                        <TrendingDown className="h-3 w-3" />
                        <span>
                          {drop.toLocaleString()} dropped ({dropPct}%) between {steps[i - 1].label} → {s.label}
                        </span>
                      </div>
                    )}
                    {i < steps.length - 1 && <div className="flex justify-center my-1"><ArrowDown className="h-3 w-3 text-muted-foreground/40" /></div>}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Insight */}
        <div className="rounded-lg border bg-card p-5 text-sm">
          <p className="font-medium mb-2">Quick insight</p>
          {stats.view === 0 ? (
            <p className="text-muted-foreground text-xs">No traffic yet in this window — share your landing page to start collecting funnel data.</p>
          ) : (
            <p className="text-muted-foreground text-xs">
              <strong className="text-foreground">{pct(stats.submit, stats.view)}%</strong> of visitors submitted the demo form
              {page === ALL_PAGES && (<>, and <strong className="text-foreground">{pct(stats.onboarded, stats.submit)}%</strong> of submitters created an organization</>)}.
              {stats.view > stats.start * 5 && " Most drop-off is between view → form start — consider clearer hero CTAs."}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
