import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "make_visible" | "hide" | "report" | "delete" | "status_change";

export interface BlogCommentAuditRow {
  id: string;
  comment_id: string;
  post_id: string | null;
  actor_id: string | null;
  action: AuditAction;
  old_status: string | null;
  new_status: string | null;
  comment_snapshot: string | null;
  created_at: string;
  actor?: { full_name: string | null; avatar_url: string | null } | null;
  post?: { id: string; slug: string; title: string } | null;
}

export interface AuditFilters {
  action?: AuditAction | "all";
  search?: string;
  limit?: number;
}

export const useBlogCommentAudit = (filters: AuditFilters = {}) =>
  useQuery({
    queryKey: ["admin-blog-comment-audit", filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("blog_comment_audit")
        .select("*, post:blog_posts(id, slug, title)")
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 200);

      if (filters.action && filters.action !== "all") q = q.eq("action", filters.action);
      if (filters.search?.trim()) q = q.ilike("comment_snapshot", `%${filters.search.trim()}%`);

      const { data, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as any[];
      const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean)));
      if (actorIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", actorIds);
        const m = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        return rows.map((r) => ({ ...r, actor: r.actor_id ? m.get(r.actor_id) ?? null : null })) as BlogCommentAuditRow[];
      }
      return rows as BlogCommentAuditRow[];
    },
  });
