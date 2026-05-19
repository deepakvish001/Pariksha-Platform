/**
 * Admin-facing landing for an assessment. Replaces the previous "drop straight
 * into the editor" experience: when an admin opens an assessment from the
 * list (or finishes creating one), they see this overview first and explicitly
 * pick the next action — Edit, Take preview, Copy invite, Live monitor, or
 * Publish/Archive.
 */
import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Pencil,
  Play,
  Activity,
  Send,
  Archive,
  Copy,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { OrgShell } from "../../layouts/OrgShell";
import {
  useAssessment,
  useSections,
  useUpdateAssessment,
} from "../../hooks/useAssessments";
import { useInvites, buildJoinUrl } from "../../hooks/useInvites";
import { useCurrentOrg, useOrgBasePath } from "../../context/OrgContext";
import { useActiveOrg } from "../../hooks/useOrg";
import { Button } from "@/components/ui/button";
import { paths } from "@/lib/routing/paths";
import { supabase } from "@/integrations/supabase/client";
import {
  AssessmentLanding,
  type LandingSection,
} from "../../components/assessment/AssessmentLanding";

export default function AssessmentLandingPage() {
  const { id: idOrSlug } = useParams();
  const navigate = useNavigate();
  const { org } = useCurrentOrg();
  const basePath = useOrgBasePath();
  const { data: assessment, isLoading } = useAssessment(idOrSlug, org?.id);
  const { data: sections } = useSections(assessment?.id);
  const { data: invites } = useInvites(assessment?.id);
  const { data: orgRow } = useActiveOrg(assessment?.org_id);
  const update = useUpdateAssessment();

  const sectionIds = useMemo(
    () => (sections ?? []).map((s) => s.id),
    [sections],
  );

  const { data: counts } = useQuery({
    queryKey: ["b2b", "section-question-counts", assessment?.id, sectionIds.join(",")],
    enabled: !!assessment?.id && sectionIds.length > 0,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("section_questions")
        .select("section_id")
        .in("section_id", sectionIds);
      if (error) throw error;
      const acc: Record<string, number> = {};
      (data ?? []).forEach((row: { section_id: string }) => {
        acc[row.section_id] = (acc[row.section_id] ?? 0) + 1;
      });
      return acc;
    },
  });

  if (isLoading) {
    return (
      <OrgShell title="Assessment">
        <div className="h-40" />
      </OrgShell>
    );
  }
  if (!assessment) return <Navigate to={paths.b2b.assessmentsList(basePath)} replace />;
  if (assessment.slug && idOrSlug && idOrSlug !== assessment.slug) {
    return <Navigate to={paths.b2b.assessment(basePath, assessment)} replace />;
  }

  const landingSections: LandingSection[] = (sections ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    description: (s as { description?: string | null }).description ?? null,
    question_count: counts?.[s.id] ?? 0,
  }));

  const totalQuestions = landingSections.reduce((a, s) => a + s.question_count, 0);
  const isDraft = assessment.status === "draft";
  const isPublished = assessment.status === "published";

  // Draft readiness checklist
  const missing: string[] = [];
  if (landingSections.length === 0) missing.push("Add at least one section");
  if (totalQuestions === 0) missing.push("Add questions to your sections");

  const firstInvite = invites?.[0];

  return (
    <OrgShell title="">
      <AssessmentLanding
        mode="admin"
        chrome="embedded"
        org={{
          name: orgRow?.name ?? org?.name ?? "Your organization",
          logo_url: orgRow?.logo_url ?? null,
          brand_color: orgRow?.brand_color ?? null,
        }}
        assessment={{
          title: assessment.title,
          description: (assessment as { description?: string | null }).description ?? null,
          duration_min: assessment.duration_min,
          max_attempts: assessment.max_attempts,
          proctoring_enabled: assessment.proctoring_enabled,
          proctoring_config: (assessment as { proctoring_config?: unknown }).proctoring_config,
          show_results_to_candidate:
            (assessment as { show_results_to_candidate?: boolean }).show_results_to_candidate !== false,
          starts_at: (assessment as { starts_at?: string | null }).starts_at ?? null,
          ends_at: (assessment as { ends_at?: string | null }).ends_at ?? null,
          status: assessment.status,
          brand_color: (assessment as { brand_color?: string | null }).brand_color ?? null,
        }}
        sections={landingSections}
        extraCards={
          isDraft && missing.length > 0 ? (
            <div className="b2b-card p-5 border-amber-500/30">
              <div className="flex items-center gap-2 mb-2 text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <h2 className="text-sm font-semibold">Before you publish</h2>
              </div>
              <ul className="space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                {missing.map((m) => (
                  <li key={m} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ) : isDraft ? (
            <div className="b2b-card p-5 border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <h2 className="text-sm font-semibold">Ready to publish</h2>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                You can publish now — candidates with an invite link will be able to start.
              </p>
            </div>
          ) : null
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(paths.b2b.assessmentEdit(basePath, assessment))}
            >
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const { data, error } = await supabase.rpc("start_preview_attempt", {
                  _assessment: assessment.id,
                });
                if (error) {
                  toast.error(error.message);
                  return;
                }
                const attempt = data as { id: string; slug?: string | null };
                navigate(paths.student.play(attempt, { preview: true }));
              }}
            >
              <Play className="h-4 w-4 mr-1" /> Take preview
            </Button>
            {firstInvite && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = buildJoinUrl(firstInvite.token);
                  navigator.clipboard.writeText(url).then(
                    () => toast.success("Invite link copied"),
                    () => toast.error("Couldn't copy link"),
                  );
                }}
              >
                <Copy className="h-4 w-4 mr-1" /> Copy invite link
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(paths.b2b.assessmentManage(basePath, assessment))}
            >
              <Activity className="h-4 w-4 mr-1" /> Live monitor
            </Button>
            {isPublished ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await update.mutateAsync({
                    id: assessment.id,
                    patch: { status: "archived" } as never,
                  });
                  toast.success("Archived");
                }}
              >
                <Archive className="h-4 w-4 mr-1" /> Archive
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={missing.length > 0 || update.isPending}
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
                onClick={async () => {
                  await update.mutateAsync({
                    id: assessment.id,
                    patch: { status: "published" } as never,
                  });
                  toast.success("Published");
                }}
              >
                <Send className="h-4 w-4 mr-1" />
                {update.isPending ? "Publishing…" : "Publish assessment"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </>
        }
      />
    </OrgShell>
  );
}
