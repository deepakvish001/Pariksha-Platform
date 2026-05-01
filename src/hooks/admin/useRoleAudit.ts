import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoleAuditEntry {
  id: string;
  created_at: string;
  action: "grant_role" | "revoke_role";
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  target_user_id: string | null;
  target_name: string | null;
  target_email: string | null;
  role: string | null;
  diff: any;
}

export interface RoleAuditFilters {
  userId?: string | null;
  action?: "grant_role" | "revoke_role" | null;
  limit?: number;
}

export const useRoleAudit = (filters: RoleAuditFilters = {}) =>
  useQuery({
    queryKey: ["admin-role-audit", filters.userId ?? null, filters.action ?? null, filters.limit ?? 200],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<RoleAuditEntry[]> => {
      const { data, error } = await supabase.rpc("admin_role_audit", {
        _user_id: filters.userId ?? null,
        _action: filters.action ?? null,
        _limit: filters.limit ?? 200,
      });
      if (error) throw error;
      return (data ?? []) as RoleAuditEntry[];
    },
  });
