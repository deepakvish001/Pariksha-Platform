import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { OrgShell } from "../layouts/OrgShell";
import { StatTile } from "../components/StatTile";
import { useCurrentOrg, useOrgBasePath } from "../context/OrgContext";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { Button } from "@/components/ui/button";
import { FileText, Users, CheckCircle2, ShieldCheck, Plus, Home, Play, ClipboardList } from "lucide-react";
import { amberGradientText } from "../components/B2BBackdrop";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function B2BDashboard() {
  const { org, isLoading } = useCurrentOrg();
  const base = useOrgBasePath();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || base !== "/b2b") return;
    if (!org) {
      navigate("/b2b/onboarding", { replace: true });
      return;
    }
    const target = org.type === "company" ? `/companies/${org.slug}` : `/colleges/${org.slug}`;
    navigate(target, { replace: true });
  }, [org, isLoading, navigate, base]);

  const { data: stats } = useDashboardStats(org?.id);

  // E2E test assessment quick-launcher: finds the latest draft assessment for this org
  const [draftId, setDraftId] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  useEffect(() => {
    if (!org?.id) return;
    (async () => {
      const { data } = await supabase
        .from("assessments")
        .select("id")
        .eq("org_id", org.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setDraftId((data as { id?: string } | null)?.id ?? null);
    })();
  }, [org?.id]);

  const launchPreview = async () => {
    if (!draftId) return;
    setLaunching(true);
    try {
      const { data, error } = await (supabase as any).rpc("start_preview_attempt", { _assessment: draftId });
      if (error) throw error;
      const attemptId = typeof data === "string" ? data : (data as { id?: string })?.id;
      if (!attemptId) throw new Error("No attempt id returned");
      navigate(`/assessments/${attemptId}/play?preview=1`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to launch preview");
    } finally {
      setLaunching(false);
    }
  };

  if (isLoading) {
    return (
      <OrgShell title="Dashboard">
        <div className="text-sm text-[hsl(var(--muted-foreground))]"></div>
      </OrgShell>
    );
  }

  if (!org) return <Navigate to="/b2b/onboarding" replace />;

  return (
    <OrgShell
      title={
        <>
          <span className={amberGradientText}>{org.name}</span>{" "}
          <span className="text-[hsl(var(--muted-foreground))] font-normal">· Overview</span>
        </>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="h-4 w-4 mr-1" /> Home
          </Button>
          <Button
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            onClick={() => navigate(`${base}/assessments/new`)}
          >
            <Plus className="h-4 w-4 mr-1" /> New assessment
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Assessments" value={stats?.assessments ?? 0} icon={FileText} hint="Drafts and live tests" />
        <StatTile label="Invites sent" value={stats?.invites ?? 0} icon={Users} />
        <StatTile label="Submissions" value={stats?.submissions ?? 0} icon={CheckCircle2} />
        <StatTile
          label="Avg integrity"
          value={stats?.avgIntegrity != null ? `${stats.avgIntegrity}%` : "—"}
          icon={ShieldCheck}
          hint="Across submissions"
        />
      </div>

      <div className="mt-8 b2b-card p-8 text-center">
        <h2 className="text-base font-semibold">You're all set, {org.name}.</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
          Create your first assessment, invite candidates, and review results — all in one place.
        </p>
        <Button
          className="mt-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          onClick={() => navigate(`${base}/assessments/new`)}
        >
          <Plus className="h-4 w-4 mr-1" /> Create assessment
        </Button>
      </div>
    </OrgShell>
  );
}
