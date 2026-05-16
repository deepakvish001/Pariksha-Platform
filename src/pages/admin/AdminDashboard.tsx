import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Plus,
  Upload,
  Megaphone,
  Home,
  AlertTriangle,
  Users,
  Activity,
  TrendingUp,
  UserPlus,
  Code2,
  CheckCircle2,
  Flag,
  type LucideIcon,
} from "lucide-react";
import {
  useAdminKpis,
  useAdminTrendSubmissions,
  useAdminTrendSignups,
} from "@/hooks/admin/useAdminControl";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface KpiProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "success" | "danger";
  hint?: string;
}

const toneRing: Record<NonNullable<KpiProps["tone"]>, string> = {
  default: "from-foreground/10 to-foreground/0",
  primary: "from-primary/30 to-primary/0",
  success: "from-emerald-500/30 to-emerald-500/0",
  danger: "from-destructive/40 to-destructive/0",
};
const toneIcon: Record<NonNullable<KpiProps["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/15 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.35)]",
  success: "bg-emerald-500/15 text-emerald-500 shadow-[0_0_18px_hsl(142_70%_45%/0.35)]",
  danger: "bg-destructive/15 text-destructive shadow-[0_0_18px_hsl(var(--destructive)/0.35)]",
};

const Kpi = ({ label, value, icon: Icon, tone = "default", hint }: KpiProps) => (
  <Card
    className={cn(
      "group relative overflow-hidden border-border/40 bg-card/40 p-4 backdrop-blur-md transition-all duration-300",
      "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-20px_hsl(24_95%_53%/0.45)]",
    )}
  >
    {/* subtle top accent ring */}
    <span
      aria-hidden
      className={cn(
        "absolute inset-x-0 top-0 h-px bg-gradient-to-r",
        toneRing[tone],
      )}
    />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">
          {value ?? "—"}
        </p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", toneIcon[tone])}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  </Card>
);

const AdminDashboard = () => {
  const { data: k } = useAdminKpis();
  const { data: subs = [] } = useAdminTrendSubmissions(30);
  const { data: signups = [] } = useAdminTrendSignups(30);

  const kpi = (key: string) => (k?.[key] ?? 0) as number;
  const openReports = kpi("open_reports");

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Live · last 30 days"
        title="Admin Dashboard"
        description="Full ownership control center — monitor signal across users, content, and engagement at a glance."
        chips={[
          { label: `${kpi("total_users")} users`, tone: "default" },
          { label: `${kpi("dau")} DAU`, tone: "primary" },
          { label: `${kpi("published_problems")} live problems`, tone: "default" },
          {
            label: openReports > 0 ? `${openReports} open reports` : "No open reports",
            tone: openReports > 0 ? "danger" : "success",
          },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-border/60 bg-card/40 backdrop-blur">
              <Link to="/admin/broadcast">
                <Megaphone className="mr-2 h-4 w-4" /> Broadcast
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-border/60 bg-card/40 backdrop-blur">
              <Link to="/admin/problems/import">
                <Upload className="mr-2 h-4 w-4" /> Import
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-primary to-amber-500 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)] hover:opacity-95"
            >
              <Link to="/admin/problems/new">
                <Plus className="mr-2 h-4 w-4" /> New problem
              </Link>
            </Button>
          </div>
        }
      />

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vital signs
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Total users" value={kpi("total_users")} icon={Users} />
          <Kpi label="DAU (24h)" value={kpi("dau")} icon={Activity} tone="primary" />
          <Kpi label="WAU (7d)" value={kpi("wau")} icon={TrendingUp} />
          <Kpi label="Signups 7d" value={kpi("signups_7d")} icon={UserPlus} tone="success" />
          <Kpi label="Submissions" value={kpi("submissions_total")} icon={Code2} />
          <Kpi label="Accepted today" value={kpi("accepted_today")} icon={CheckCircle2} tone="success" />
          
          <Kpi
            label="Open reports"
            value={openReports}
            icon={Flag}
            tone={openReports > 0 ? "danger" : "default"}
          />
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trends
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="relative overflow-hidden border-border/40 bg-card/40 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Submissions (30d)</h3>
              <span className="rounded-full border border-border/50 bg-card/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                total · accepted
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={subs}>
                  <defs>
                    <linearGradient id="grad-total" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="grad-acc" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142 70% 45%)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(142 70% 45%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                  <XAxis dataKey="day" hide />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#grad-total)" strokeWidth={2} />
                  <Area type="monotone" dataKey="accepted" stroke="hsl(142 70% 45%)" fill="url(#grad-acc)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="relative overflow-hidden border-border/40 bg-card/40 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Signups (30d)</h3>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-500">
                new accounts
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={signups}>
                  <defs>
                    <linearGradient id="grad-signup" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                  <XAxis dataKey="day" hide />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="signups" stroke="hsl(38 92% 50%)" fill="url(#grad-signup)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      <Card className="relative mt-8 overflow-hidden border-border/40 bg-card/40 p-5 backdrop-blur-md">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,hsl(38_92%_50%/0.18),transparent_60%)] blur-2xl"
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15 text-amber-500 shadow-[0_0_14px_hsl(38_92%_50%/0.4)]">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-semibold">Quick stats</h2>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Published problems</p>
              <p className="mt-1 text-xl font-semibold">{kpi("published_problems")}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Drafts</p>
              <p className="mt-1 text-xl font-semibold">{kpi("draft_problems")}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Open reports</p>
              <p className={cn("mt-1 text-xl font-semibold", openReports > 0 && "text-destructive")}>
                {openReports}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </AdminShell>
  );
};

export default AdminDashboard;
