import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DashboardStats = {
  assessments: number;
  invites: number;
  submissions: number;
  avgIntegrity: number | null;
};

export function useDashboardStats(orgId?: string) {
  return useQuery({
    queryKey: ["b2b", "dashboard-stats", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<DashboardStats> => {
      const [{ count: aCount }, { data: assessments }] = await Promise.all([
        supabase.from("assessments").select("id", { count: "exact", head: true }).eq("org_id", orgId!),
        supabase.from("assessments").select("id").eq("org_id", orgId!),
      ]);
      const ids = (assessments ?? []).map((a: any) => a.id);
      let invites = 0;
      let submissions = 0;
      let avgIntegrity: number | null = null;
      if (ids.length) {
        const [{ count: iCount }, { data: attempts }] = await Promise.all([
          supabase.from("assessment_invites").select("id", { count: "exact", head: true }).in("assessment_id", ids),
          supabase.from("assessment_attempts").select("status, integrity_score").in("assessment_id", ids),
        ]);
        invites = iCount ?? 0;
        const submitted = (attempts ?? []).filter((a: any) => a.status === "submitted");
        submissions = submitted.length;
        if (submitted.length) {
          const sum = submitted.reduce((s: number, a: any) => s + (a.integrity_score ?? 0), 0);
          avgIntegrity = Math.round(sum / submitted.length);
        }
      }
      return { assessments: aCount ?? 0, invites, submissions, avgIntegrity };
    },
  });
}
