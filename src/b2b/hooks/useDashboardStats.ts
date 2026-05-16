import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DeltaPct = number | null; // % change vs previous period; null = no baseline

export type DashboardStats = {
  // Totals (all-time) — used for the big KPI numbers.
  assessments: number;
  invites: number;
  submissions: number;
  avgIntegrity: number | null;
  // Deltas: current 30-day window vs previous 30-day window.
  deltas: {
    assessments: DeltaPct;
    invites: DeltaPct;
    submissions: DeltaPct;
    avgIntegrity: DeltaPct;
  };
};

export type StatsRange = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<StatsRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function pctChange(curr: number, prev: number): DeltaPct {
  if (prev === 0) return curr === 0 ? 0 : null; // no baseline to compare
  return Math.round(((curr - prev) / prev) * 1000) / 10; // 1 decimal
}

export function useDashboardStats(orgId?: string, range: StatsRange = "30d") {
  return useQuery({
    queryKey: ["b2b", "dashboard-stats", orgId, range],
    enabled: !!orgId,
    queryFn: async (): Promise<DashboardStats> => {
      const windowDays = RANGE_DAYS[range];
      const now = new Date();
      const currStart = new Date(now);
      currStart.setDate(now.getDate() - windowDays);
      const prevStart = new Date(now);
      prevStart.setDate(now.getDate() - windowDays * 2);
      const currStartIso = currStart.toISOString();
      const prevStartIso = prevStart.toISOString();

      const [{ count: aCount }, { data: assessments }] = await Promise.all([
        supabase
          .from("assessments")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId!),
        supabase
          .from("assessments")
          .select("id, created_at")
          .eq("org_id", orgId!),
      ]);

      const ids = (assessments ?? []).map((a: any) => a.id);

      // Assessment created-at windows
      const assessmentsCurr = (assessments ?? []).filter(
        (a: any) => a.created_at >= currStartIso,
      ).length;
      const assessmentsPrev = (assessments ?? []).filter(
        (a: any) => a.created_at >= prevStartIso && a.created_at < currStartIso,
      ).length;

      let invites = 0;
      let submissions = 0;
      let avgIntegrity: number | null = null;
      let invitesCurr = 0;
      let invitesPrev = 0;
      let submissionsCurr = 0;
      let submissionsPrev = 0;
      let avgIntegrityCurr: number | null = null;
      let avgIntegrityPrev: number | null = null;

      if (ids.length) {
        const [
          { count: iCount },
          { data: invitesRows },
          { data: attempts },
        ] = await Promise.all([
          supabase
            .from("assessment_invites")
            .select("id", { count: "exact", head: true })
            .in("assessment_id", ids),
          supabase
            .from("assessment_invites")
            .select("created_at")
            .in("assessment_id", ids)
            .gte("created_at", prevStartIso),
          supabase
            .from("assessment_attempts")
            .select("status, integrity_score, submitted_at")
            .in("assessment_id", ids),
        ]);

        invites = iCount ?? 0;
        invitesCurr = (invitesRows ?? []).filter(
          (r: any) => r.created_at >= currStartIso,
        ).length;
        invitesPrev = (invitesRows ?? []).filter(
          (r: any) =>
            r.created_at >= prevStartIso && r.created_at < currStartIso,
        ).length;

        const submitted = (attempts ?? []).filter(
          (a: any) => a.status === "submitted",
        );
        submissions = submitted.length;
        if (submitted.length) {
          const sum = submitted.reduce(
            (s: number, a: any) => s + (a.integrity_score ?? 0),
            0,
          );
          avgIntegrity = Math.round(sum / submitted.length);
        }

        const submittedCurr = submitted.filter(
          (a: any) => a.submitted_at && a.submitted_at >= currStartIso,
        );
        const submittedPrev = submitted.filter(
          (a: any) =>
            a.submitted_at &&
            a.submitted_at >= prevStartIso &&
            a.submitted_at < currStartIso,
        );
        submissionsCurr = submittedCurr.length;
        submissionsPrev = submittedPrev.length;

        if (submittedCurr.length) {
          avgIntegrityCurr = Math.round(
            submittedCurr.reduce(
              (s: number, a: any) => s + (a.integrity_score ?? 0),
              0,
            ) / submittedCurr.length,
          );
        }
        if (submittedPrev.length) {
          avgIntegrityPrev = Math.round(
            submittedPrev.reduce(
              (s: number, a: any) => s + (a.integrity_score ?? 0),
              0,
            ) / submittedPrev.length,
          );
        }
      }

      const integrityDelta: DeltaPct =
        avgIntegrityCurr != null && avgIntegrityPrev != null
          ? Math.round((avgIntegrityCurr - avgIntegrityPrev) * 10) / 10 // absolute pts diff
          : null;

      return {
        assessments: aCount ?? 0,
        invites,
        submissions,
        avgIntegrity,
        deltas: {
          assessments: pctChange(assessmentsCurr, assessmentsPrev),
          invites: pctChange(invitesCurr, invitesPrev),
          submissions: pctChange(submissionsCurr, submissionsPrev),
          avgIntegrity: integrityDelta,
        },
      };
    },
  });
}
