import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrgMemberRole = "owner" | "admin" | "recruiter" | "viewer";

export type OrgMember = {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgMemberRole;
  created_at: string;
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

export function useOrgMembers(orgId?: string) {
  return useQuery({
    queryKey: ["b2b", "members", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<OrgMember[]> => {
      const { data: members, error } = await supabase
        .from("org_members")
        .select("*")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const ids = (members ?? []).map((m: any) => m.user_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url")
        .in("id", ids);
      const byId = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));
      return (members ?? []).map((m: any) => ({
        ...m,
        email: byId.get(m.user_id)?.email ?? null,
        display_name: byId.get(m.user_id)?.display_name ?? null,
        avatar_url: byId.get(m.user_id)?.avatar_url ?? null,
      }));
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

export function useAddMemberByEmail(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: OrgMemberRole }) => {
      if (!orgId) throw new Error("No org");
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();
      if (pErr) throw pErr;
      if (!profile) throw new Error("No user with that email has signed up yet.");
      const { error } = await supabase
        .from("org_members")
        .insert({ org_id: orgId, user_id: profile.id, role });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["b2b", "members", orgId] }),
  });
}
