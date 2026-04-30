import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sidebar notification counts per route key. Keep cheap — single RPC + small queries.
 * Refreshes every 60s.
 */
export interface AdminBadges {
  "/admin/reports": number;
  "/admin/ai-content": number;
  "/admin/system-health": number;
}

export const useAdminSidebarBadges = () =>
  useQuery({
    queryKey: ["admin-sidebar-badges"],
    refetchInterval: 60_000,
    queryFn: async (): Promise<Partial<AdminBadges>> => {
      const [reportsRes, healthRes, aiRes] = await Promise.all([
        supabase
          .from("content_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        (supabase.rpc as any)("admin_system_health"),
        supabase
          .from("ai_generated_content")
          .select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const reports = reportsRes.count ?? 0;
      const aiNew = aiRes.count ?? 0;
      const health = (healthRes.data ?? {}) as Record<string, number>;
      // Surface a "1" indicator if anything looks off (open reports power health alert too)
      const healthAlert = reports > 0 ? 1 : 0;

      return {
        "/admin/reports": reports,
        "/admin/ai-content": aiNew,
        "/admin/system-health": healthAlert,
      };
    },
  });
