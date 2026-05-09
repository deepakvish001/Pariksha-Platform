import { Link } from "react-router-dom";
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
} from "lucide-react";
import { LearnHeader } from "./LearnShell";
import { useAdminKpis } from "@/hooks/admin/useAdminControl";

const Kpi = ({ label, value, accent }: { label: string; value: number | string; accent?: string }) => (
  <Card className="p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`mt-1 text-3xl font-bold ${accent ?? ""}`}>{value ?? "—"}</p>
  </Card>
);

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
  const { data: k } = useAdminKpis();
  const kpi = (key: string) => (k?.[key] ?? 0) as number;

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

      <div className="p-6 space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">At a glance</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Total users" value={kpi("total_users")} />
            <Kpi label="DAU (24h)" value={kpi("dau")} accent="text-primary" />
            <Kpi label="Submissions" value={kpi("submissions_total")} />
            <Kpi
              label="Open reports"
              value={kpi("open_reports")}
              accent={kpi("open_reports") > 0 ? "text-destructive" : ""}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Manage</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink
              to="/admin/problems"
              icon={FileCode2}
              label="Coding Problems"
              desc={`${kpi("published_problems")} published · ${kpi("draft_problems")} drafts`}
            />
            <QuickLink
              to="/admin/users"
              icon={Users}
              label="Users"
              desc={`${kpi("total_users")} total accounts`}
            />
            <QuickLink
              to="/admin/daily-challenge"
              icon={CalendarClock}
              label="Daily Challenge"
              desc="Schedule and curate the daily problem"
            />
            <QuickLink
              to="/admin/ai-content"
              icon={Sparkles}
              label="AI Content"
              desc={`${kpi("ai_content_total")} pieces to moderate`}
            />
            <QuickLink
              to="/admin/reports"
              icon={Flag}
              label="Reports"
              desc={`${kpi("open_reports")} open`}
            />
            <QuickLink
              to="/admin/broadcast"
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
