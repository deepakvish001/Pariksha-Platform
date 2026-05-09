import { OrgShell } from "../layouts/OrgShell";
import { useMyOrganizations } from "../hooks/useOrg";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

export default function B2BAssessmentsList() {
  const { data: orgs, isLoading } = useMyOrganizations();
  const navigate = useNavigate();
  if (isLoading) return <OrgShell title="Assessments">Loading…</OrgShell>;
  if (!orgs?.length) return <Navigate to="/b2b/onboarding" replace />;

  return (
    <OrgShell
      title="Assessments"
      actions={
        <Button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90" onClick={() => navigate("/b2b/assessments/new")}>
          <Plus className="h-4 w-4 mr-1" /> New assessment
        </Button>
      }
    >
      <div className="b2b-card p-12 text-center">
        <FileText className="h-8 w-8 mx-auto text-[hsl(var(--muted-foreground))]" />
        <p className="mt-3 font-medium">No assessments yet</p>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Create your first coding, MCQ, or SQL assessment to invite candidates.
        </p>
        <Button
          className="mt-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          onClick={() => navigate("/b2b/assessments/new")}
        >
          <Plus className="h-4 w-4 mr-1" /> New assessment
        </Button>
      </div>
    </OrgShell>
  );
}
