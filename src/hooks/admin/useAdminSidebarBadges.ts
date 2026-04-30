import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminBadgePrefs, useAdminBadgeSeen, BadgeKey } from "./useAdminBadgePrefs";

export interface BadgeDetail {
  total: number;     // overall count
  unseen: number;    // since last "seen" timestamp
  hint: string;      // tooltip-friendly description
}

export type AdminBadges = Record<BadgeKey, BadgeDetail>;

export const useAdminSidebarBadges = () => {
  const { prefs } = useAdminBadgePrefs();
  const { seen, markSeen, clearAll } = useAdminBadgeSeen();

  const query = useQuery({
    queryKey: ["admin-sidebar-badges", prefs.enabled, seen],
    refetchInterval: prefs.refreshSeconds * 1000,
    queryFn: async (): Promise<AdminBadges> => {
      const reportsEnabled = prefs.enabled["/admin/reports"];
      const aiEnabled = prefs.enabled["/admin/ai-content"];
      const healthEnabled = prefs.enabled["/admin/system-health"];
      const supportEnabled = prefs.enabled["/admin/support"];

      const sinceReports = seen["/admin/reports"];
      const sinceAI = seen["/admin/ai-content"];
      const sinceSupport = seen["/admin/support"];

      const [
        reportsTotal,
        reportsUnseen,
        aiTotal,
        aiUnseen,
        healthRes,
        supportTotal,
        supportUnseen,
      ] = await Promise.all([
        reportsEnabled
          ? supabase.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "open")
          : Promise.resolve({ count: 0 } as any),
        reportsEnabled && sinceReports
          ? supabase
              .from("content_reports")
              .select("id", { count: "exact", head: true })
              .eq("status", "open")
              .gt("created_at", sinceReports)
          : Promise.resolve({ count: null } as any),
        aiEnabled
          ? supabase
              .from("ai_generated_content")
              .select("id", { count: "exact", head: true })
              .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          : Promise.resolve({ count: 0 } as any),
        aiEnabled && sinceAI
          ? supabase
              .from("ai_generated_content")
              .select("id", { count: "exact", head: true })
              .gt("created_at", sinceAI)
          : Promise.resolve({ count: null } as any),
        healthEnabled ? (supabase.rpc as any)("admin_system_health") : Promise.resolve({ data: {} }),
        supportEnabled
          ? supabase
              .from("support_messages")
              .select("id", { count: "exact", head: true })
              .eq("status", "open")
          : Promise.resolve({ count: 0 } as any),
        supportEnabled && sinceSupport
          ? supabase
              .from("support_messages")
              .select("id", { count: "exact", head: true })
              .eq("status", "open")
              .gt("created_at", sinceSupport)
          : Promise.resolve({ count: null } as any),
      ]);

      const rTotal = reportsTotal.count ?? 0;
      const rUnseen = reportsUnseen.count ?? rTotal;
      const aTotal = aiTotal.count ?? 0;
      const aUnseen = aiUnseen.count ?? aTotal;
      const sTotal = supportTotal.count ?? 0;
      const sUnseen = supportUnseen.count ?? sTotal;
      const health = (healthRes.data ?? {}) as Record<string, number>;
      const hAlert = healthEnabled && (rTotal > 0 || (health.submissions_24h ?? 0) === 0) ? 1 : 0;

      return {
        "/admin/reports": {
          total: rTotal,
          unseen: rUnseen,
          hint: rTotal === 0 ? "No open reports" : `${rTotal} open report${rTotal === 1 ? "" : "s"}`,
        },
        "/admin/ai-content": {
          total: aTotal,
          unseen: aUnseen,
          hint: `${aTotal} new in last 24h`,
        },
        "/admin/system-health": {
          total: hAlert,
          unseen: hAlert,
          hint: hAlert ? "Needs attention" : "All systems normal",
        },
        "/admin/support": {
          total: sTotal,
          unseen: sUnseen,
          hint: sTotal === 0 ? "Inbox empty" : `${sTotal} open ticket${sTotal === 1 ? "" : "s"}`,
        },
      };
    },
  });

  return { ...query, markSeen, clearAll };
};
