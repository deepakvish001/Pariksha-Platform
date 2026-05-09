import { OrgShell } from "../../layouts/OrgShell";
import { useMyOrganizations } from "../../hooks/useOrg";
import { useAssessments } from "../../hooks/useAssessments";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function B2BAssessmentsList() {
  const { data: orgs, isLoading } = useMyOrganizations();
  const navigate = useNavigate();
  const org = orgs?.[0];
  const { data: assessments, isLoading: aLoading } = useAssessments(org?.id);

  if (isLoading) return null;
  if (!orgs?.length) return <Navigate to="/b2b/onboarding" replace />;

  return (
    <OrgShell
      title="Assessments"
      actions={
        <Button
          className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          onClick={() => navigate("/b2b/assessments/new")}
        >
          <Plus className="h-4 w-4 mr-1" /> New assessment
        </Button>
      }
    >
      {aLoading ? (
        null
      ) : !assessments?.length ? (
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
      ) : (
        <div className="grid gap-3">
          {assessments.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/b2b/assessments/${a.id}`)}
              className="b2b-card p-4 text-left hover:border-[hsl(var(--primary))] transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.title}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {a.duration_min} min
                    </span>
                    <span>Updated {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <Badge variant={a.status === "published" ? "default" : "secondary"}>{a.status}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </OrgShell>
  );
}
