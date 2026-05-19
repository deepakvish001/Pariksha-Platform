import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OpenOrgAssessment = {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  duration_min: number;
  starts_at: string | null;
  ends_at: string | null;
  type: string;
  organization: { id: string; name: string; logo_url: string | null; slug: string | null } | null;
  already_enrolled: boolean;
};

/**
 * List published `open_org` assessments visible to the current user via org membership.
 * Relies on RLS: org members can SELECT assessments in their org.
 */
export function useOpenOrgAssessments() {
  return useQuery({
    queryKey: ["student", "open-org-assessments"],
    queryFn: async (): Promise<OpenOrgAssessment[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return [];

      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("assessments")
        .select(
          "id, org_id, title, description, duration_min, starts_at, ends_at, type, participation_mode, status, organization:organizations(id, name, logo_url, slug)",
        )
        .eq("status", "published")
        .eq("participation_mode", "open_org")
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("starts_at", { ascending: true, nullsFirst: false });
      if (error) throw error;

      const rows = (data ?? []) as any[];
      const ids = rows.map((r) => r.id);
      let enrolledSet = new Set<string>();
      if (ids.length) {
        const { data: invites } = await supabase
          .from("assessment_invites")
          .select("assessment_id")
          .in("assessment_id", ids)
          .eq("email", user.email);
        enrolledSet = new Set((invites ?? []).map((i: any) => i.assessment_id));
      }

      return rows.map((r) => ({
        id: r.id,
        org_id: r.org_id,
        title: r.title,
        description: r.description,
        duration_min: r.duration_min,
        starts_at: r.starts_at,
        ends_at: r.ends_at,
        type: r.type,
        organization: r.organization
          ? {
              id: r.organization.id,
              name: r.organization.name,
              logo_url: r.organization.logo_url,
              slug: r.organization.slug,
            }
          : null,
        already_enrolled: enrolledSet.has(r.id),
      }));
    },
  });
}

/** Calls the SECURITY DEFINER RPC to self-enroll and returns the invite token. */
export function useEnrollOpenOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assessmentId: string): Promise<{ token: string; invite_id: string }> => {
      const { data, error } = await supabase.rpc("claim_open_org_assessment", {
        _assessment_id: assessmentId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.token) throw new Error("Enrollment failed");
      return { token: row.token, invite_id: row.invite_id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "open-org-assessments"] });
      qc.invalidateQueries({ queryKey: ["my-invites"] });
    },
  });
}
