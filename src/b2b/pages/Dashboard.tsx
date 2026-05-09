import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { OrgShell } from "../layouts/OrgShell";
import { StatTile } from "../components/StatTile";
import { useMyOrganizations } from "../hooks/useOrg";
import { Button } from "@/components/ui/button";
import { FileText, Users, CheckCircle2, ShieldCheck, Plus } from "lucide-react";

export default function B2BDashboard() {
  const { data: orgs, isLoading } = useMyOrganizations();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (orgs?.length ?? 0) === 0) navigate("/b2b/onboarding", { replace: true });
  }, [orgs, isLoading, navigate]);

  if (isLoading) {
    return (
      <OrgShell title="Dashboard">
        <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>
      </OrgShell>
    );
  }

  if (!orgs || orgs.length === 0) return <Navigate to="/b2b/onboarding" replace />;
  const org = orgs[0];

  return (
    <OrgShell
      title={`${org.name} · Overview`}
      actions={
        <Button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90" onClick={() => navigate("/b2b/assessments/new")}>
          <Plus className="h-4 w-4 mr-1" /> New assessment
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Assessments" value={0} icon={FileText} hint="Drafts and live tests" />
        <StatTile label="Invites sent" value={0} icon={Users} />
        <StatTile label="Submissions" value={0} icon={CheckCircle2} />
        <StatTile label="Avg integrity" value="—" icon={ShieldCheck} hint="Across submissions" />
      </div>

      <div className="mt-8 b2b-card p-8 text-center">
        <h2 className="text-base font-semibold">You're all set, {org.name}.</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
          Create your first assessment, invite candidates, and review results — all in one place.
        </p>
        <Button
          className="mt-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          onClick={() => navigate("/b2b/assessments/new")}
        >
          <Plus className="h-4 w-4 mr-1" /> Create assessment
        </Button>
      </div>
    </OrgShell>
  );
}
