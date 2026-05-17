/**
 * Role-based permission hooks for the college (B2B) workspace.
 *
 * Proctoring evidence (webcam/screen snapshots, side-eye phone frames,
 * AI findings) and the "Run AI review" action are gated to the
 * `owner`, `admin`, and `proctor` org roles. Recruiters and viewers
 * can still see assessment results but never the proctoring evidence.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { OrgMemberRole } from "./useMembers";

const PROCTOR_ROLES: OrgMemberRole[] = ["owner", "admin", "proctor"];

export function useMyOrgRole(orgId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["b2b", "my-org-role", orgId, user?.id],
    enabled: !!orgId && !!user?.id,
    queryFn: async (): Promise<OrgMemberRole | null> => {
      const { data, error } = await supabase
        .from("org_members")
        .select("role")
        .eq("org_id", orgId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as OrgMemberRole | undefined) ?? null;
    },
    staleTime: 60_000,
  });
}

export function useCanProctor(orgId?: string | null) {
  const { data: role, isLoading } = useMyOrgRole(orgId);
  return {
    canProctor: !!role && PROCTOR_ROLES.includes(role),
    role,
    isLoading,
  };
}
