import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, subDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  RefreshCw, TrendingUp, TrendingDown, Users, Eye, MousePointerClick,
  Search, Globe, CalendarIcon, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

type GAResponse = { cached?: boolean; data?: any; startDate?: string; endDate?: string; error?: string; setupRequired?: boolean };
type GSCResponse = { cached?: boolean; data?: any; startDate?: string; endDate?: string; error?: string; setupRequired?: boolean };

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, var(--accent)))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// Properties exposed to the dashboard. Server-side allowlist is the source of truth;
// this is just the picker. Extend via VITE_GA4_PROPERTIES='[{"id":"123","name":"Site"}]'.
const GA4_PROPERTIES: { id: string; name: string }[] = (() => {
  try {
    const raw = (import.meta as any).env?.VITE_GA4_PROPERTIES;
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [{ id: "default", name: "Parikshaa (parikshaa.org)" }];
})();

const GSC_SITES: { url: string; name: string }[] = (() => {
  try {
    const raw = (import.meta as any).env?.VITE_GSC_SITES;
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [{ url: "https://www.parikshaa.org/", name: "parikshaa.org" }];
})();

type DateRange = { start: Date; end: Date };

const PRESETS: { label: string; days: number }[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 28 days", days: 28 },
  { label: "Last 90 days", days: 90 },
];

function iso(d: Date) { return format(d, "yyyy-MM-dd"); }

function fmtNum(n: number | string | undefined) {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}
function fmtPct(n: number | string | undefined) {
  return `${(Number(n ?? 0) * 100).toFixed(1)}%`;
}
function fmtSec(n: number | string | undefined) {
  const v = Number(n ?? 0);
  if (v >= 60) return `${Math.floor(v / 60)}m ${Math.round(v % 60)}s`;
  return `${v.toFixed(1)}s`;
}
function delta(curr: number, prev: number) {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

function gaRows(data: any) {
  const rows = data?.rows ?? [];
  return rows.map((r: any) => ({
    dims: r.dimensionValues?.map((d: any) => d.value) ?? [],
    metrics: r.metricValues?.map((m: any) => m.value) ?? [],
  }));
}

async function callFn<T>(name: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message);
  if ((data as any)?.error && (data as any)?.setupRequired) return data as T;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

function previousRange(r: DateRange): DateRange {
  const span = differenceInDays(r.end, r.start) + 1;
  return { end: subDays(r.start, 1), start: subDays(r.start, span) };
}

function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [tmp, setTmp] = useState<{ from?: Date; to?: Date }>({ from: value.start, to: value.end });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal")}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          {format(value.start, "MMM d")} – {format(value.end, "MMM d, yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={tmp as any}
          onSelect={(r: any) => setTmp(r ?? {})}
          numberOfMonths={2}
          disabled={(d) => d > new Date()}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
        <div className="flex items-center justify-between p-3 border-t">
          <span className="text-xs text-muted-foreground">Pick a start and end date.</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setTmp({ from: value.start, to: value.end }); setOpen(false); }}>Cancel</Button>
            <Button size="sm" disabled={!tmp.from || !tmp.to} onClick={() => {
              if (tmp.from && tmp.to) { onChange({ start: tmp.from, end: tmp.to }); setOpen(false); }
            }}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null || !isFinite(value)) return null;
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium",
      positive ? "text-emerald-500" : "text-rose-500")}>
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export default function Analytics() {
  const [range, setRange] = useState<DateRange>({ start: subDays(new Date(), 28), end: new Date() });
  const [compare, setCompare] = useState(false);
  const [propertyId, setPropertyId] = useState<string>(GA4_PROPERTIES[0]?.id ?? "default");
  const [siteUrl, setSiteUrl] = useState<string>(GSC_SITES[0]?.url ?? "https://www.parikshaa.org/");
  const [loading, setLoading] = useState(false);
  const [ga, setGa] = useState<{ summary?: any; ts?: any; pages?: any; sources?: any; devices?: any; countries?: any; prevSummary?: any }>({});
  const [gsc, setGsc] = useState<{ summary?: any; ts?: any; queries?: any; pages?: any; devices?: any; countries?: any; prevSummary?: any }>({});

  const prev = useMemo(() => previousRange(range), [range]);

  async function load() {
    setLoading(true);
    const baseGa = { propertyId, startDate: iso(range.start), endDate: iso(range.end) };
    const baseGaPrev = { propertyId, startDate: iso(prev.start), endDate: iso(prev.end) };
    const baseGsc = { siteUrl, startDate: iso(range.start), endDate: iso(range.end) };
    const baseGscPrev = { siteUrl, startDate: iso(prev.start), endDate: iso(prev.end) };

    try {
      const reqs: Promise<GAResponse>[] = [
        callFn<GAResponse>("ga4-report", { ...baseGa, report: "summary" }),
        callFn<GAResponse>("ga4-report", { ...baseGa, report: "timeseries" }),
        callFn<GAResponse>("ga4-report", { ...baseGa, report: "topPages" }),
        callFn<GAResponse>("ga4-report", { ...baseGa, report: "trafficSources" }),
        callFn<GAResponse>("ga4-report", { ...baseGa, report: "devices" }),
        callFn<GAResponse>("ga4-report", { ...baseGa, report: "countries" }),
      ];
      if (compare) reqs.push(callFn<GAResponse>("ga4-report", { ...baseGaPrev, report: "summary" }));
      const [s, t, p, src, dev, ctr, ps] = await Promise.all(reqs);
      setGa({ summary: s.data, ts: t.data, pages: p.data, sources: src.data, devices: dev.data, countries: ctr.data, prevSummary: ps?.data });
    } catch (e) {
      toast.error(`GA4: ${(e as Error).message}`);
    }
    try {
      const reqs: Promise<GSCResponse>[] = [
        callFn<GSCResponse>("gsc-report", { ...baseGsc, report: "summary" }),
        callFn<GSCResponse>("gsc-report", { ...baseGsc, report: "timeseries" }),
        callFn<GSCResponse>("gsc-report", { ...baseGsc, report: "queries" }),
        callFn<GSCResponse>("gsc-report", { ...baseGsc, report: "pages" }),
        callFn<GSCResponse>("gsc-report", { ...baseGsc, report: "devices" }),
        callFn<GSCResponse>("gsc-report", { ...baseGsc, report: "countries" }),
      ];
      if (compare) reqs.push(callFn<GSCResponse>("gsc-report", { ...baseGscPrev, report: "summary" }));
      const [s, t, q, p, dev, ctr, ps] = await Promise.all(reqs);
      setGsc({ summary: s.data, ts: t.data, queries: q.data, pages: p.data, devices: dev.data, countries: ctr.data, prevSummary: ps?.data });
    } catch (e) {
      toast.error(`Search Console: ${(e as Error).message}`);
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [range.start, range.end, propertyId, siteUrl, compare]);

  // ---------- GA4 derived ----------
  const sumRow = ga.summary?.rows?.[0]?.metricValues ?? [];
  const prevRow = ga.prevSummary?.rows?.[0]?.metricValues ?? [];
  const gaKpis = [
    { label: "Active users", value: fmtNum(sumRow[0]?.value), curr: Number(sumRow[0]?.value ?? 0), prev: Number(prevRow[0]?.value ?? 0), icon: Users },
    { label: "New users", value: fmtNum(sumRow[1]?.value), curr: Number(sumRow[1]?.value ?? 0), prev: Number(prevRow[1]?.value ?? 0), icon: TrendingUp },
    { label: "Sessions", value: fmtNum(sumRow[2]?.value), curr: Number(sumRow[2]?.value ?? 0), prev: Number(prevRow[2]?.value ?? 0), icon: MousePointerClick },
    { label: "Pageviews", value: fmtNum(sumRow[3]?.value), curr: Number(sumRow[3]?.value ?? 0), prev: Number(prevRow[3]?.value ?? 0), icon: Eye },
    { label: "Avg session", value: fmtSec(sumRow[4]?.value), curr: Number(sumRow[4]?.value ?? 0), prev: Number(prevRow[4]?.value ?? 0), icon: TrendingUp },
    { label: "Bounce rate", value: fmtPct(sumRow[5]?.value), curr: Number(sumRow[5]?.value ?? 0), prev: Number(prevRow[5]?.value ?? 0), icon: TrendingUp },
  ];
  const gaTs = gaRows(ga.ts).map((r: any) => ({
    date: `${r.dims[0]?.slice(4, 6)}/${r.dims[0]?.slice(6, 8)}`,
    users: Number(r.metrics[0] ?? 0),
    sessions: Number(r.metrics[1] ?? 0),
    views: Number(r.metrics[2] ?? 0),
  }));
  const gaPages = gaRows(ga.pages).map((r: any) => ({
    path: r.dims[0], title: r.dims[1], views: Number(r.metrics[0] ?? 0), users: Number(r.metrics[1] ?? 0),
  }));
  const gaSources = gaRows(ga.sources).map((r: any) => ({
    name: r.dims[0] || "(direct)", value: Number(r.metrics[0] ?? 0),
  }));
  const gaDevices = gaRows(ga.devices).map((r: any) => ({
    name: r.dims[0], users: Number(r.metrics[0] ?? 0), sessions: Number(r.metrics[1] ?? 0),
  }));
  const gaCountries = gaRows(ga.countries).map((r: any) => ({
    name: r.dims[0], users: Number(r.metrics[0] ?? 0),
  }));

  // ---------- GSC derived ----------
  const gscSum = gsc.summary?.rows?.[0] ?? {};
  const gscPrev = gsc.prevSummary?.rows?.[0] ?? {};
  const gscKpis = [
    { label: "Clicks", value: fmtNum(gscSum.clicks), curr: Number(gscSum.clicks ?? 0), prev: Number(gscPrev.clicks ?? 0) },
    { label: "Impressions", value: fmtNum(gscSum.impressions), curr: Number(gscSum.impressions ?? 0), prev: Number(gscPrev.impressions ?? 0) },
    { label: "CTR", value: fmtPct(gscSum.ctr), curr: Number(gscSum.ctr ?? 0), prev: Number(gscPrev.ctr ?? 0) },
    { label: "Avg position", value: Number(gscSum.position ?? 0).toFixed(1), curr: Number(gscSum.position ?? 0), prev: Number(gscPrev.position ?? 0) },
  ];
  const gscTs = (gsc.ts?.rows ?? []).map((r: any) => ({
    date: r.keys?.[0]?.slice(5) ?? "",
    clicks: Number(r.clicks ?? 0),
    impressions: Number(r.impressions ?? 0),
    ctr: Number(r.ctr ?? 0) * 100,
    position: Number(r.position ?? 0),
  }));
  const gscQueries = (gsc.queries?.rows ?? []).map((r: any) => ({
    query: r.keys?.[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
  }));
  const gscPages = (gsc.pages?.rows ?? []).map((r: any) => ({
    page: r.keys?.[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
  }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Analytics</h1>
          <p className="text-sm text-muted-foreground">
            GA4 & Google Search Console. Cached for 1 hour. All admin views are audit-logged.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="GA4 property" /></SelectTrigger>
            <SelectContent>
              {GA4_PROPERTIES.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={siteUrl} onValueChange={setSiteUrl}>
            <SelectTrigger className="w-56"><SelectValue placeholder="GSC site" /></SelectTrigger>
            <SelectContent>
              {GSC_SITES.map((s) => (
                <SelectItem key={s.url} value={s.url}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(differenceInDays(range.end, range.start) + 1)}
            onValueChange={(v) => {
              const days = Number(v);
              if (!Number.isFinite(days)) return;
              setRange({ start: subDays(new Date(), days), end: new Date() });
            }}
          >
            <SelectTrigger className="w-36"><SelectValue placeholder="Preset" /></SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.days} value={String(p.days)}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker value={range} onChange={setRange} />
          <div className="flex items-center gap-2 px-2">
            <Switch id="compare" checked={compare} onCheckedChange={setCompare} />
            <Label htmlFor="compare" className="text-sm">Compare prior</Label>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {compare && (
        <p className="text-xs text-muted-foreground -mt-3">
          Comparing to {format(prev.start, "MMM d")} – {format(prev.end, "MMM d, yyyy")}.
        </p>
      )}

      <Tabs defaultValue="ga4" className="w-full">
        <TabsList>
          <TabsTrigger value="ga4"><Globe className="h-4 w-4 mr-1" /> Google Analytics</TabsTrigger>
          <TabsTrigger value="gsc"><Search className="h-4 w-4 mr-1" /> Search Console</TabsTrigger>
        </TabsList>

        {/* GA4 */}
        <TabsContent value="ga4" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {gaKpis.map((k) => (
              <Card key={k.label}><CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><k.icon className="h-3 w-3" />{k.label}</div>
                <div className="text-2xl font-bold mt-1">{loading ? <Skeleton className="h-7 w-16" /> : k.value}</div>
                {compare && !loading && <div className="mt-1"><DeltaBadge value={delta(k.curr, k.prev)} /></div>}
              </CardContent></Card>
            ))}
          </div>

          <Card><CardHeader><CardTitle className="text-base">Daily traffic</CardTitle></CardHeader>
            <CardContent className="h-72">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gaTs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sessions" stroke={COLORS[2]} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="views" stroke={COLORS[3]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-base">Traffic sources</CardTitle></CardHeader>
              <CardContent className="h-64">
                {gaSources.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gaSources} dataKey="value" nameKey="name" outerRadius={80} label>
                        {gaSources.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>

            <Card><CardHeader><CardTitle className="text-base">Devices</CardTitle></CardHeader>
              <CardContent className="h-64">
                {gaDevices.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gaDevices}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="users" fill={COLORS[0]} />
                      <Bar dataKey="sessions" fill={COLORS[2]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>
          </div>

          <Card><CardHeader><CardTitle className="text-base">Top pages</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-auto">
                {gaPages.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
                {gaPages.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{p.title || p.path}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.path}</div>
                    </div>
                    <div className="flex items-center gap-3 text-sm shrink-0">
                      <Badge variant="secondary">{fmtNum(p.views)} views</Badge>
                      <span className="text-muted-foreground">{fmtNum(p.users)} users</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle className="text-base">Top countries</CardTitle></CardHeader>
            <CardContent className="h-64">
              {gaCountries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gaCountries} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="users" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">No data</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GSC */}
        <TabsContent value="gsc" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gscKpis.map((k) => (
              <Card key={k.label}><CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className="text-2xl font-bold mt-1">{loading ? <Skeleton className="h-7 w-16" /> : k.value}</div>
                {compare && !loading && <div className="mt-1"><DeltaBadge value={delta(k.curr, k.prev)} /></div>}
              </CardContent></Card>
            ))}
          </div>

          <Card><CardHeader><CardTitle className="text-base">Clicks & impressions</CardTitle></CardHeader>
            <CardContent className="h-72">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gscTs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="clicks" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="impressions" stroke={COLORS[3]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-base">Top queries</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-80 overflow-auto">
                  {gscQueries.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
                  {gscQueries.map((q: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className="text-sm truncate flex-1">{q.query}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <Badge variant="secondary">{fmtNum(q.clicks)}</Badge>
                        <span>{fmtNum(q.impressions)} impr</span>
                        <span>{fmtPct(q.ctr)}</span>
                        <span>#{Number(q.position).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base">Top pages</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-80 overflow-auto">
                  {gscPages.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
                  {gscPages.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className="text-sm truncate flex-1">{p.page?.replace("https://www.parikshaa.org", "")}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <Badge variant="secondary">{fmtNum(p.clicks)}</Badge>
                        <span>{fmtNum(p.impressions)} impr</span>
                        <span>{fmtPct(p.ctr)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
