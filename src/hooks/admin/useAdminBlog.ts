import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { BlogPost, BlogPostStatus, BlogCategory, BlogTag } from "@/types/blog";

export const useAdminBlogPosts = (search = "", status: BlogPostStatus | "all" = "all") =>
  useQuery({
    queryKey: ["admin-blog-posts", search, status],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase.from("blog_posts").select("*").order("updated_at", { ascending: false }).limit(200);
      if (status !== "all") q = q.eq("status", status);
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BlogPost[];
    },
  });

export interface BlogPostInput {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content_md: string;
  cover_image_url?: string | null;
  status: BlogPostStatus;
  scheduled_for?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
  is_featured?: boolean;
  allow_comments?: boolean;
  category_ids?: string[];
  tag_ids?: string[];
}

export const useSaveBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BlogPostInput) => {
      const { data: u } = await supabase.auth.getUser();
      const { category_ids = [], tag_ids = [], id, ...fields } = input;
      const payload: any = { ...fields, author_id: u.user?.id ?? null };

      let postId = id;
      if (postId) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", postId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("blog_posts").insert(payload).select("id").single();
        if (error) throw error;
        postId = data.id;
      }

      // Save revision snapshot
      await supabase.from("blog_revisions").insert({
        post_id: postId,
        title: payload.title,
        content_md: payload.content_md,
        saved_by: u.user?.id ?? null,
      });

      // Resync joins
      await supabase.from("blog_post_categories").delete().eq("post_id", postId);
      if (category_ids.length) {
        await supabase
          .from("blog_post_categories")
          .insert(category_ids.map((cid) => ({ post_id: postId!, category_id: cid })));
      }
      await supabase.from("blog_post_tags").delete().eq("post_id", postId);
      if (tag_ids.length) {
        await supabase
          .from("blog_post_tags")
          .insert(tag_ids.map((tid) => ({ post_id: postId!, tag_id: tid })));
      }

      return postId!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
      qc.invalidateQueries({ queryKey: ["blog-post"] });
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({ title: "Deleted" });
    },
  });
};

export const useUpsertBlogCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Partial<BlogCategory> & { name: string; slug: string }) => {
      const { error } = await supabase.from("blog_categories").upsert(cat as any, { onConflict: "slug" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-categories"] }),
  });
};

export const useUpsertBlogTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tag: { name: string; slug: string }) => {
      const { error } = await supabase.from("blog_tags").upsert(tag as any, { onConflict: "slug" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-tags"] }),
  });
};

export const useUploadBlogCover = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `covers/${u.user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("blog-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("blog-media").getPublicUrl(path);
      return data.publicUrl;
    },
  });

// ───────── Admin comments moderation ─────────
export type AdminCommentStatusFilter = "pending" | "reported" | "hidden" | "visible" | "all";

export const useAdminBlogComments = (status: AdminCommentStatusFilter = "pending", search = "") =>
  useQuery({
    queryKey: ["admin-blog-comments", status, search],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("blog_comments")
        .select("*, post:blog_posts(id, slug, title)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status === "pending") {
        q = q.eq("status", "visible").is("approved_at", null);
      } else if (status !== "all") {
        q = q.eq("status", status);
      }
      if (search.trim()) q = q.ilike("body", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        const m = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        return rows.map((r) => ({ ...r, author: m.get(r.user_id) ?? null }));
      }
      return rows;
    },
  });

export const useSetCommentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "visible" | "hidden" | "reported" }) => {
      const { error } = await supabase.from("blog_comments").update({ status }).eq("id", id);
      if (error) throw error;
      return { id, status };
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["admin-blog-comments"] });
      const snapshots = qc.getQueriesData<any[]>({ queryKey: ["admin-blog-comments"] });
      qc.setQueriesData<any[]>({ queryKey: ["admin-blog-comments"] }, (old) => {
        if (!Array.isArray(old)) return old;
        // Update the row's status; the active filtered view will hide non-matching rows on next refetch
        return old.map((c) => (c.id === id ? { ...c, status } : c));
      });
      return { snapshots };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.snapshots) {
        for (const [key, val] of ctx.snapshots) qc.setQueryData(key, val);
      }
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Updated" });
      qc.invalidateQueries({ queryKey: ["blog-comments"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin-blog-comments"] }),
  });
};

export const useDeleteCommentAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin-blog-comments"] });
      const snapshots = qc.getQueriesData<any[]>({ queryKey: ["admin-blog-comments"] });
      qc.setQueriesData<any[]>({ queryKey: ["admin-blog-comments"] }, (old) =>
        Array.isArray(old) ? old.filter((c) => c.id !== id) : old,
      );
      return { snapshots };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.snapshots) {
        for (const [key, val] of ctx.snapshots) qc.setQueryData(key, val);
      }
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Deleted" });
      qc.invalidateQueries({ queryKey: ["blog-comments"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin-blog-comments"] }),
  });
};


// ───────── Revisions ─────────
export interface BlogRevision {
  id: string;
  post_id: string;
  title: string;
  content_md: string;
  saved_by: string | null;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null } | null;
}

export const useBlogRevisions = (postId: string | undefined) =>
  useQuery({
    queryKey: ["admin-blog-revisions", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_revisions")
        .select("*")
        .eq("post_id", postId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = (data ?? []) as BlogRevision[];
      const userIds = Array.from(new Set(rows.map((r) => r.saved_by).filter(Boolean) as string[]));
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        const m = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        return rows.map((r) => ({ ...r, author: r.saved_by ? m.get(r.saved_by) ?? null : null }));
      }
      return rows;
    },
  });

export const useRestoreBlogRevision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, revisionId }: { postId: string; revisionId: string }) => {
      const { data: rev, error: rErr } = await supabase
        .from("blog_revisions")
        .select("title, content_md")
        .eq("id", revisionId)
        .maybeSingle();
      if (rErr) throw rErr;
      if (!rev) throw new Error("Revision not found");
      const { data: u } = await supabase.auth.getUser();
      // Save current as a snapshot first (so restore is reversible)
      const { data: cur } = await supabase
        .from("blog_posts")
        .select("title, content_md")
        .eq("id", postId)
        .maybeSingle();
      if (cur) {
        await supabase.from("blog_revisions").insert({
          post_id: postId,
          title: cur.title,
          content_md: cur.content_md,
          saved_by: u.user?.id ?? null,
        });
      }
      const { error } = await supabase
        .from("blog_posts")
        .update({ title: rev.title, content_md: rev.content_md })
        .eq("id", postId);
      if (error) throw error;
      // Audit log entry — best effort.
      await supabase.from("blog_revision_audit").insert({
        post_id: postId,
        revision_id: revisionId,
        actor_id: u.user?.id ?? null,
        action: "restored",
        meta: { restored_title: rev.title },
      });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-blog-revisions", vars.postId] });
      qc.invalidateQueries({ queryKey: ["admin-blog-revision-audit", vars.postId] });
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["blog-post-id", vars.postId] });
      qc.invalidateQueries({ queryKey: ["blog-post"] });
      toast({ title: "Restored", description: "The selected revision is now live." });
    },
    onError: (e: any) => toast({ title: "Restore failed", description: e.message, variant: "destructive" }),
  });
};

// ───────── Revision audit ─────────
export type RevisionAuditAction = "viewed" | "compared" | "restored" | "created" | "edited";

export interface BlogRevisionAudit {
  id: string;
  post_id: string;
  revision_id: string | null;
  compare_revision_id: string | null;
  actor_id: string | null;
  action: RevisionAuditAction;
  meta: Record<string, any>;
  created_at: string;
  actor?: { full_name: string | null; avatar_url: string | null } | null;
}

export const useBlogRevisionAudit = (postId: string | undefined, limit = 50) =>
  useQuery({
    queryKey: ["admin-blog-revision-audit", postId, limit],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_revision_audit")
        .select("*")
        .eq("post_id", postId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const rows = (data ?? []) as BlogRevisionAudit[];
      const userIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[]));
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        const m = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
        return rows.map((r) => ({ ...r, actor: r.actor_id ? m.get(r.actor_id) ?? null : null }));
      }
      return rows;
    },
  });

export async function logRevisionAudit(input: {
  postId: string;
  action: RevisionAuditAction;
  revisionId?: string | null;
  compareRevisionId?: string | null;
  meta?: Record<string, any>;
}) {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("blog_revision_audit").insert({
      post_id: input.postId,
      action: input.action,
      revision_id: input.revisionId ?? null,
      compare_revision_id: input.compareRevisionId ?? null,
      actor_id: u.user.id,
      meta: input.meta ?? {},
    });
  } catch {
    /* never block the user */
  }
}
