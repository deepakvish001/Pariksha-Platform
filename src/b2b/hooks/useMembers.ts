import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrgMemberRole = "owner" | "admin" | "recruiter" | "viewer";

export type OrgMember = {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgMemberRole;
  created_at: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

export function useOrgMembers(orgId?: string) {
  return useQuery({
    queryKey: ["b2b", "members", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<OrgMember[]> => {
      const { data: members, error } = await supabase
        .from("org_members")
        .select("id, org_id, user_id, role, created_at")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const ids = (members ?? []).map((m: any) => m.user_id);
      if (ids.length === 0) return [] as OrgMember[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids);
      const byId = new Map<string, any>();
      (profiles ?? []).forEach((p: any) => byId.set(p.user_id, p));
      return (members ?? []).map((m: any) => ({
        ...m,
        full_name: byId.get(m.user_id)?.full_name ?? null,
        avatar_url: byId.get(m.user_id)?.avatar_url ?? null,
      })) as OrgMember[];
    },
  });
}

export function useUpdateMemberRole(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: OrgMemberRole }) => {
      const { error } = await supabase.from("org_members").update({ role }).eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["b2b", "members", orgId] }),
  });
}

export function useRemoveMember(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("org_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["b2b", "members", orgId] }),
  });
}
