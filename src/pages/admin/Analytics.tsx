import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { RefreshCw, TrendingUp, Users, Eye, MousePointerClick, Search, Globe } from "lucide-react";
import { toast } from "sonner";

type GAResponse = { cached: boolean; data: any };
type GSCResponse = { cached: boolean; data: any };

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, var(--accent)))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export default function Analytics() {
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(false);
  const [ga, setGa] = useState<{ summary?: any; ts?: any; pages?: any; sources?: any; devices?: any; countries?: any }>({});
  const [gsc, setGsc] = useState<{ summary?: any; ts?: any; queries?: any; pages?: any; devices?: any; countries?: any }>({});

  async function load() {
    setLoading(true);
    try {
      const [s, t, p, src, dev, ctr] = await Promise.all([
        callFn<GAResponse>("ga4-report", { report: "summary", days }),
        callFn<GAResponse>("ga4-report", { report: "timeseries", days }),
        callFn<GAResponse>("ga4-report", { report: "topPages", days }),
        callFn<GAResponse>("ga4-report", { report: "trafficSources", days }),
        callFn<GAResponse>("ga4-report", { report: "devices", days }),
        callFn<GAResponse>("ga4-report", { report: "countries", days }),
      ]);
      setGa({ summary: s.data, ts: t.data, pages: p.data, sources: src.data, devices: dev.data, countries: ctr.data });
    } catch (e) {
      toast.error(`GA4: ${(e as Error).message}`);
    }
    try {
      const [s, t, q, p, dev, ctr] = await Promise.all([
        callFn<GSCResponse>("gsc-report", { report: "summary", days }),
        callFn<GSCResponse>("gsc-report", { report: "timeseries", days }),
        callFn<GSCResponse>("gsc-report", { report: "queries", days }),
        callFn<GSCResponse>("gsc-report", { report: "pages", days }),
        callFn<GSCResponse>("gsc-report", { report: "devices", days }),
        callFn<GSCResponse>("gsc-report", { report: "countries", days }),
      ]);
      setGsc({ summary: s.data, ts: t.data, queries: q.data, pages: p.data, devices: dev.data, countries: ctr.data });
    } catch (e) {
      toast.error(`Search Console: ${(e as Error).message}`);
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  // ---------- GA4 derived ----------
  const sumRow = ga.summary?.rows?.[0]?.metricValues ?? [];
  const gaKpis = [
    { label: "Active users", value: fmtNum(sumRow[0]?.value), icon: Users },
    { label: "New users", value: fmtNum(sumRow[1]?.value), icon: TrendingUp },
    { label: "Sessions", value: fmtNum(sumRow[2]?.value), icon: MousePointerClick },
    { label: "Pageviews", value: fmtNum(sumRow[3]?.value), icon: Eye },
    { label: "Avg session", value: fmtSec(sumRow[4]?.value), icon: TrendingUp },
    { label: "Bounce rate", value: fmtPct(sumRow[5]?.value), icon: TrendingUp },
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
  const gscKpis = [
    { label: "Clicks", value: fmtNum(gscSum.clicks) },
    { label: "Impressions", value: fmtNum(gscSum.impressions) },
    { label: "CTR", value: fmtPct(gscSum.ctr) },
    { label: "Avg position", value: Number(gscSum.position ?? 0).toFixed(1) },
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Analytics</h1>
          <p className="text-sm text-muted-foreground">
            GA4 & Google Search Console for parikshaa.org. Cached for 1 hour.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="28">Last 28 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

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
