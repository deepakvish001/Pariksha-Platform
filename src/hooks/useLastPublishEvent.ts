import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LastPublishEvent {
  action: "publish" | "unpublish";
  created_at: string;
}

/**
 * Returns the most recent publish/unpublish audit-log entry for a given
 * coding problem slug, or null if none exists yet.
 */
export const useLastPublishEvent = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["admin-problem-last-publish", slug],
    enabled: !!slug,
    queryFn: async (): Promise<LastPublishEvent | null> => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("action, created_at")
        .eq("entity_type", "coding_problem")
        .eq("entity_slug", slug!)
        .in("action", ["publish", "unpublish"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as LastPublishEvent | null) ?? null;
    },
  });
};
