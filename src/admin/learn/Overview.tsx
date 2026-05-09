import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileCode2,
  Users,
  CalendarClock,
  Sparkles,
  Flag,
  Megaphone,
  Plus,
  Upload,
  RefreshCw,
} from "lucide-react";
import { LearnHeader } from "./LearnShell";
import {
  useAdminKpis,
  useAdminTrendSubmissions,
  useAdminTrendSignups,
} from "@/hooks/admin/useAdminControl";
import { useQueryClient } from "@tanstack/react-query";

type Range = "24h" | "7d" | "30d";
const RANGE_DAYS: Record<Range, number> = { "24h": 1, "7d": 7, "30d": 30 };

const Kpi = ({
  label,
  value,
  accent,
  to,
}: {
  label: string;
  value: number | string;
  accent?: string;
  to?: string;
}) => {
  const body = (
    <Card
      className={`p-4 h-full ${
        to ? "transition hover:border-primary/50 hover:bg-secondary/40 cursor-pointer" : ""
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ?? ""}`}>{value ?? "—"}</p>
    </Card>
  );
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
};

const QuickLink = ({
  to,
  icon: Icon,
  label,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}) => (
  <Link
    to={to}
    className="group rounded-lg border bg-card p-4 transition hover:border-primary/50 hover:bg-secondary/50"
  >
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/15">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  </Link>
);

export default function LearnOverview() {
  const [range, setRange] = useState<Range>("7d");
  const days = RANGE_DAYS[range];

  const qc = useQueryClient();
  const { data: k, refetch: refetchKpis, isFetching: kpisFetching } = useAdminKpis();
  const { data: subs, refetch: refetchSubs, isFetching: subsFetching } =
    useAdminTrendSubmissions(days);
  const { data: signups, refetch: refetchSignups, isFetching: signupsFetching } =
    useAdminTrendSignups(days);

  const kpi = (key: string) => (k?.[key] ?? 0) as number;

  const windowSubs = useMemo(
    () => (subs ?? []).reduce((a, r) => a + (r.total ?? 0), 0),
    [subs],
  );
  const windowAccepted = useMemo(
    () => (subs ?? []).reduce((a, r) => a + (r.accepted ?? 0), 0),
    [subs],
  );
  const windowSignups = useMemo(
    () => (signups ?? []).reduce((a, r) => a + (r.signups ?? 0), 0),
    [signups],
  );
  const acceptanceRate = windowSubs > 0 ? Math.round((windowAccepted / windowSubs) * 100) : 0;

  const refreshAll = () => {
    refetchKpis();
    refetchSubs();
    refetchSignups();
    qc.invalidateQueries({ queryKey: ["admin-kpis"] });
  };

  const fetching = kpisFetching || subsFetching || signupsFetching;

  return (
    <>
      <LearnHeader
        title="Learn Admin"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/problems/import">
                <Upload className="mr-2 h-4 w-4" /> Import
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/problems/new">
                <Plus className="mr-2 h-4 w-4" /> New problem
              </Link>
            </Button>
          </>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              At a glance · last {range}
            </h2>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border bg-card p-0.5">
                {(["24h", "7d", "30d"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      range === r
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={refreshAll}
                disabled={fetching}
                aria-label="Refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Total users" value={kpi("total_users")} to={`/admin/learn/users?range=${range}`} />
            <Kpi
              label={`New signups (${range})`}
              value={windowSignups}
              accent="text-primary"
              to={`/admin/learn/users?range=${range}&filter=new`}
            />
            <Kpi
              label={`Submissions (${range})`}
              value={windowSubs}
              to={`/admin/learn/problems?range=${range}`}
            />
            <Kpi
              label="Acceptance rate"
              value={`${acceptanceRate}%`}
              accent={acceptanceRate >= 50 ? "text-primary" : ""}
              to={`/admin/learn/problems?range=${range}`}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="DAU (24h)" value={kpi("dau")} to={`/admin/learn/users?range=24h`} />
            <Kpi
              label="Submissions (all time)"
              value={kpi("submissions_total")}
              to={`/admin/learn/problems`}
            />
            <Kpi
              label="Open reports"
              value={kpi("open_reports")}
              accent={kpi("open_reports") > 0 ? "text-destructive" : ""}
              to={`/admin/learn/reports?range=${range}`}
            />
            <Kpi
              label="AI content"
              value={kpi("ai_content_total")}
              to={`/admin/learn/ai-content?range=${range}`}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Manage</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink
              to={`/admin/learn/problems?range=${range}`}
              icon={FileCode2}
              label="Coding Problems"
              desc={`${kpi("published_problems")} published · ${kpi("draft_problems")} drafts`}
            />
            <QuickLink
              to={`/admin/learn/users?range=${range}`}
              icon={Users}
              label="Users"
              desc={`${kpi("total_users")} total accounts`}
            />
            <QuickLink
              to="/admin/learn/daily"
              icon={CalendarClock}
              label="Daily Challenge"
              desc="Schedule and curate the daily problem"
            />
            <QuickLink
              to={`/admin/learn/ai-content?range=${range}`}
              icon={Sparkles}
              label="AI Content"
              desc={`${kpi("ai_content_total")} pieces to moderate`}
            />
            <QuickLink
              to={`/admin/learn/reports?range=${range}`}
              icon={Flag}
              label="Reports"
              desc={`${kpi("open_reports")} open`}
            />
            <QuickLink
              to="/admin/learn/broadcast"
              icon={Megaphone}
              label="Broadcast"
              desc="Send announcements to learners"
            />
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          Need more? Open the{" "}
          <Link to="/admin" className="underline hover:text-foreground">
            full admin
          </Link>{" "}
          for advanced tools.
        </p>
      </div>
    </>
  );
}
