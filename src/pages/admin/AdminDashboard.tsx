import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Upload, Megaphone, CalendarClock, AlertTriangle } from "lucide-react";
import {
  useAdminKpis, useAdminTrendSubmissions, useAdminTrendSignups,
} from "@/hooks/admin/useAdminControl";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const Kpi = ({ label, value, accent }: { label: string; value: number | string; accent?: string }) => (
  <Card className="p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`mt-1 text-3xl font-bold ${accent ?? ""}`}>{value ?? "—"}</p>
  </Card>
);

const AdminDashboard = () => {
  const { data: k } = useAdminKpis();
  const { data: subs = [] } = useAdminTrendSubmissions(30);
  const { data: signups = [] } = useAdminTrendSignups(30);

  const kpi = (key: string) => (k?.[key] ?? 0) as number;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Full ownership control center.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/broadcast"><Megaphone className="mr-2 h-4 w-4" /> Broadcast</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/daily-challenge"><CalendarClock className="mr-2 h-4 w-4" /> Daily challenge</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/problems/import"><Upload className="mr-2 h-4 w-4" /> Import</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/problems/new"><Plus className="mr-2 h-4 w-4" /> New problem</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total users" value={kpi("total_users")} />
        <Kpi label="DAU (24h)" value={kpi("dau")} accent="text-primary" />
        <Kpi label="WAU (7d)" value={kpi("wau")} />
        <Kpi label="Signups 7d" value={kpi("signups_7d")} accent="text-emerald-500" />
        <Kpi label="Submissions" value={kpi("submissions_total")} />
        <Kpi label="Accepted today" value={kpi("accepted_today")} accent="text-emerald-500" />
        <Kpi label="AI content" value={kpi("ai_content_total")} />
        <Kpi label="Open reports" value={kpi("open_reports")} accent={kpi("open_reports") > 0 ? "text-destructive" : ""} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Submissions (30d)</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={subs}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" hide />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                <Area type="monotone" dataKey="accepted" stroke="hsl(142 70% 45%)" fill="hsl(142 70% 45% / 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Signups (30d)</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={signups}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" hide />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="signups" stroke="hsl(38 92% 50%)" fill="hsl(38 92% 50% / 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold">Quick stats</h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
          <div><span className="text-muted-foreground">Published problems:</span> <span className="font-semibold">{kpi("published_problems")}</span></div>
          <div><span className="text-muted-foreground">Drafts:</span> <span className="font-semibold">{kpi("draft_problems")}</span></div>
          <div><span className="text-muted-foreground">Open reports:</span> <span className="font-semibold">{kpi("open_reports")}</span></div>
        </div>
      </Card>
    </AdminShell>
  );
};

export default AdminDashboard;
