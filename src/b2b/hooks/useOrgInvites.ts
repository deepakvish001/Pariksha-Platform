import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrgInvite = {
  id: string;
  org_id: string;
  inviter_id: string;
  email: string;
  token: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
  capabilities: string[];
  role_preset: string;
  accepted_at: string | null;
  accepted_by: string | null;
};

export function buildOrgJoinUrl(token: string) {
  return `${window.location.origin}/b2b/join/${token}`;
}

export function useOrgInvites(orgId?: string) {
  return useQuery({
    queryKey: ["b2b", "org-invites", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<OrgInvite[]> => {
      const { data, error } = await supabase
        .from("b2b_org_invites")
        .select("*")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrgInvite[];
    },
  });
}

export function useCreateOrgInvite(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      email: string;
      capabilities: string[];
      role_preset: string;
      send_email?: boolean;
    }): Promise<OrgInvite> => {
      const { data, error } = await supabase.rpc("create_b2b_org_invite", {
        _org_id: orgId!,
        _email: input.email,
        _capabilities: input.capabilities,
        _role_preset: input.role_preset,
      });
      if (error) throw error;
      const row = data as unknown as OrgInvite;
      if (input.send_email !== false) {
        // Fire-and-forget: a failed email shouldn't block the invite creation
        try {
          await supabase.functions.invoke("send-org-invite", { body: { invite_id: row.id } });
        } catch {
          // ignore — UI will surface a "Copy link" fallback
        }
      }
      return row;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["b2b", "org-invites", orgId] }),
  });
}

export function useRevokeOrgInvite(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("b2b_org_invites").update({ revoked: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["b2b", "org-invites", orgId] }),
  });
}

export function useResendOrgInvite() {
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { data, error } = await supabase.functions.invoke("send-org-invite", { body: { invite_id: inviteId } });
      if (error) throw new Error(error.message ?? "Failed to send");
      return data;
    },
  });
}

export async function acceptOrgInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc("accept_b2b_org_invite", { _token: token });
  if (error) throw error;
  return data as unknown as string; // org_id
}
