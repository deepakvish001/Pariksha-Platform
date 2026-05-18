/**
 * Role-based permission system for the college / company workspace.
 *
 * Single source of truth for "can this member do X?". UI uses `useCan(orgId, cap)`
 * to hide buttons, filter navigation, and gate routes. The database RLS policies
 * still enforce the same matrix server-side — this is purely UX.
 *
 * Roles: owner > admin > proctor / recruiter / viewer.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { OrgMemberRole } from "./useMembers";

const PROCTOR_ROLES: OrgMemberRole[] = ["owner", "admin", "proctor"];

/** Every gated capability in the org workspace. */
export type Capability =
  | "assessments.write"
  | "assessments.publish"
  | "questionBank.write"
  | "members.invite"
  | "members.removeOrEdit"
  | "members.promoteToOwner"
  | "proctor.view"
  | "proctor.runAi"
  | "results.exportPii"
  | "org.editSettings"
  | "org.manageBilling"
  | "org.delete"
  | "audit.view";

/** Which roles are allowed each capability. */
export const CAPABILITY_MATRIX: Record<Capability, OrgMemberRole[]> = {
  "assessments.write":        ["owner", "admin"],
  "assessments.publish":      ["owner", "admin"],
  "questionBank.write":       ["owner", "admin"],
  "members.invite":           ["owner", "admin"],
  "members.removeOrEdit":     ["owner", "admin"],
  "members.promoteToOwner":   ["owner"],
  "proctor.view":             ["owner", "admin", "proctor"],
  "proctor.runAi":            ["owner", "admin", "proctor"],
  "results.exportPii":        ["owner", "admin", "recruiter"],
  "org.editSettings":         ["owner", "admin"],
  "org.manageBilling":        ["owner"],
  "org.delete":               ["owner"],
  "audit.view":               ["owner", "admin"],
};

export function roleHasCapability(role: OrgMemberRole | null | undefined, cap: Capability): boolean {
  if (!role) return false;
  return CAPABILITY_MATRIX[cap].includes(role);
}

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
    // Resolve the member's role once per session — it cannot change without
    // an admin action that already invalidates this query. This prevents the
    // workspace from re-checking permissions on every navigation or click.
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

/** Generic capability check. */
export function useCan(orgId?: string | null, cap?: Capability) {
  const { data: role, isLoading } = useMyOrgRole(orgId);
  const allowed = !!cap && roleHasCapability(role ?? null, cap);
  return { allowed, role: (role ?? null) as OrgMemberRole | null, isLoading };
}

/** Legacy convenience: proctoring evidence + Run AI review. */
export function useCanProctor(orgId?: string | null) {
  const { data: role, isLoading } = useMyOrgRole(orgId);
  return {
    canProctor: !!role && PROCTOR_ROLES.includes(role),
    role,
    isLoading,
  };
}
