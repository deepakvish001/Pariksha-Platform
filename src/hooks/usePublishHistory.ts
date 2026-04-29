import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PublishAction = "publish" | "unpublish";

export interface PublishHistoryFilters {
  action: PublishAction | "all";
  search: string;
  from: string | null; // ISO date (start of day)
  to: string | null; // ISO date (end of day)
  actorId: string | null;
}

export interface PublishHistoryRow {
  id: string;
  actor_id: string;
  action: PublishAction;
  entity_slug: string | null;
  created_at: string;
  actor_name: string | null;
  actor_avatar: string | null;
}

export interface PublishHistoryResult {
  rows: PublishHistoryRow[];
  total: number;
}

interface QueryArgs {
  filters: PublishHistoryFilters;
  page: number; // 1-indexed
  pageSize: number;
}

export const usePublishHistory = ({ filters, page, pageSize }: QueryArgs) => {
  return useQuery({
    queryKey: ["publish-history", filters, page, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<PublishHistoryResult> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let q = supabase
        .from("admin_audit_log")
        .select("id, actor_id, action, entity_slug, created_at", {
          count: "exact",
        })
        .eq("entity_type", "coding_problem")
        .order("created_at", { ascending: false });

      if (filters.action === "all") {
        q = q.in("action", ["publish", "unpublish"]);
      } else {
        q = q.eq("action", filters.action);
      }

      if (filters.search.trim()) {
        q = q.ilike("entity_slug", `%${filters.search.trim()}%`);
      }
      if (filters.from) q = q.gte("created_at", filters.from);
      if (filters.to) q = q.lte("created_at", filters.to);
      if (filters.actorId) q = q.eq("actor_id", filters.actorId);

      const { data, count, error } = await q.range(from, to);
      if (error) throw error;

      const baseRows = (data ?? []) as Array<{
        id: string;
        actor_id: string;
        action: PublishAction;
        entity_slug: string | null;
        created_at: string;
      }>;

      // Fetch profile info for actors in this page
      const actorIds = Array.from(new Set(baseRows.map((r) => r.actor_id)));
      let profilesById = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      if (actorIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", actorIds);
        profilesById = new Map(
          (profs ?? []).map((p) => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }]),
        );
      }

      const rows: PublishHistoryRow[] = baseRows.map((r) => {
        const prof = profilesById.get(r.actor_id);
        return {
          ...r,
          actor_name: prof?.full_name ?? null,
          actor_avatar: prof?.avatar_url ?? null,
        };
      });

      return { rows, total: count ?? 0 };
    },
  });
};

/**
 * Returns distinct admin actors that have ever published or unpublished
 * a coding problem. Used to populate the actor filter dropdown.
 */
export const usePublishHistoryActors = () => {
  return useQuery({
    queryKey: ["publish-history-actors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("actor_id")
        .eq("entity_type", "coding_problem")
        .in("action", ["publish", "unpublish"])
        .limit(1000);
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((r) => r.actor_id)));
      if (ids.length === 0) return [] as Array<{ user_id: string; full_name: string | null }>;
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      const profsById = new Map((profs ?? []).map((p) => [p.user_id, p.full_name]));
      return ids.map((id) => ({ user_id: id, full_name: profsById.get(id) ?? null }));
    },
  });
};
