import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicTableInfo {
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
}

export interface TablePolicy {
  policy_name: string;
  command: string; // r=SELECT, a=INSERT, w=UPDATE, d=DELETE, *=ALL
  roles: string[];
  using_expr: string | null;
  check_expr: string | null;
  permissive: string;
}

export const usePublicTables = () =>
  useQuery({
    queryKey: ["admin-public-tables"],
    queryFn: async (): Promise<PublicTableInfo[]> => {
      const { data, error } = await supabase.rpc("admin_list_public_tables");
      if (error) throw error;
      return (data ?? []) as PublicTableInfo[];
    },
  });

export const useTablePolicies = (table: string | null) =>
  useQuery({
    queryKey: ["admin-table-policies", table],
    enabled: !!table,
    queryFn: async (): Promise<TablePolicy[]> => {
      const { data, error } = await supabase.rpc("admin_list_table_policies", { _table: table });
      if (error) throw error;
      return (data ?? []) as TablePolicy[];
    },
  });

export type AppRoleSelection = "owner" | "admin" | "moderator" | "user" | "anonymous";

/**
 * Heuristic: given a policy expression, decide whether the chosen role is
 * likely to satisfy it. This is a *static* analyzer of the SQL text, not a
 * live evaluator — Postgres alone can do that, and only for a real session.
 */
export const evaluatePolicyForRole = (
  expr: string | null,
  role: AppRoleSelection,
): "allow" | "deny" | "depends" => {
  if (!expr) return "allow"; // no restriction

  const lower = expr.toLowerCase();

  // owner is admin-equivalent in our has_role
  const isAdminLike = role === "owner" || role === "admin";

  if (lower.includes("has_role(auth.uid(), 'admin'") || lower.includes("has_role(auth.uid(),'admin'")) {
    return isAdminLike ? "allow" : "deny";
  }
  if (lower.includes("has_role(auth.uid(), 'moderator'") || lower.includes("has_role(auth.uid(),'moderator'")) {
    return isAdminLike || role === "moderator" ? "allow" : "deny";
  }
  if (lower.includes("auth.uid()")) {
    // owner-scoped policy — depends on the row's user_id
    return role === "anonymous" ? "deny" : "depends";
  }
  if (lower.trim() === "true") return "allow";
  if (lower.trim() === "false") return "deny";
  return "depends";
};
