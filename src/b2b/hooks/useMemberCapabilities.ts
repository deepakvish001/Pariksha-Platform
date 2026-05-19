import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMemberCapabilities(memberId?: string) {
  return useQuery({
    queryKey: ["b2b", "member-caps", memberId],
    enabled: !!memberId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("org_member_capabilities")
        .select("capability")
        .eq("member_id", memberId!);
      if (error) throw error;
      return ((data ?? []) as { capability: string }[]).map((r) => r.capability);
    },
  });
}

export function useSetMemberCapabilities(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, capabilities }: { memberId: string; capabilities: string[] }) => {
      const { error } = await supabase.rpc("set_member_capabilities", {
        _member_id: memberId,
        _capabilities: capabilities,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["b2b", "member-caps", vars.memberId] });
      qc.invalidateQueries({ queryKey: ["b2b", "my-capabilities", orgId] });
    },
  });
}
