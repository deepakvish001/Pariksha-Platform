import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import type { BlogPost, BlogPostWithRelations, BlogCategory, BlogTag, BlogComment, BlogPostStatus } from "@/types/blog";

// ───────── Public reads ─────────
export const useBlogCategories = () =>
  useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BlogCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const useBlogTags = () =>
  useQuery({
    queryKey: ["blog-tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_tags").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as BlogTag[];
    },
    staleTime: 5 * 60 * 1000,
  });

interface UseBlogPostsOpts {
  status?: BlogPostStatus | "all";
  categorySlug?: string;
  tagSlug?: string;
  authorId?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
}

export const useBlogPosts = (opts: UseBlogPostsOpts = {}) =>
  useQuery({
    queryKey: ["blog-posts", opts],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("blog_posts")
        .select(
          "*, categories:blog_post_categories(category:blog_categories(*)), tags:blog_post_tags(tag:blog_tags(*))",
        )
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      const status = opts.status ?? "published";
      if (status !== "all") q = q.eq("status", status);
      if (opts.featured) q = q.eq("is_featured", true);
      if (opts.authorId) q = q.eq("author_id", opts.authorId);
      if (opts.search?.trim()) q = q.ilike("title", `%${opts.search.trim()}%`);
      if (opts.limit) q = q.limit(opts.limit);

      const { data, error } = await q;
      if (error) throw error;

      let rows = (data ?? []) as any[];
      if (opts.categorySlug) {
        rows = rows.filter((r) =>
          (r.categories ?? []).some((c: any) => c.category?.slug === opts.categorySlug),
        );
      }
      if (opts.tagSlug) {
        rows = rows.filter((r) => (r.tags ?? []).some((t: any) => t.tag?.slug === opts.tagSlug));
      }
      return rows.map((r) => ({
        ...r,
        categories: (r.categories ?? []).map((c: any) => c.category).filter(Boolean),
        tags: (r.tags ?? []).map((t: any) => t.tag).filter(Boolean),
      })) as BlogPostWithRelations[];
    },
  });

export const useBlogPost = (slug: string | undefined) =>
  useQuery({
    queryKey: ["blog-post", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "*, categories:blog_post_categories(category:blog_categories(*)), tags:blog_post_tags(tag:blog_tags(*))",
        )
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r: any = data;

      // Fetch author profile separately
      let author = null;
      if (r.author_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", r.author_id)
          .maybeSingle();
        author = prof;
      }
      return {
        ...r,
        categories: (r.categories ?? []).map((c: any) => c.category).filter(Boolean),
        tags: (r.tags ?? []).map((t: any) => t.tag).filter(Boolean),
        author,
      } as BlogPostWithRelations;
    },
  });

export const useBlogPostById = (id: string | undefined) =>
  useQuery({
    queryKey: ["blog-post-id", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "*, categories:blog_post_categories(category_id), tags:blog_post_tags(tag_id)",
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r: any = data;
      return {
        ...r,
        category_ids: (r.categories ?? []).map((c: any) => c.category_id),
        tag_ids: (r.tags ?? []).map((t: any) => t.tag_id),
      };
    },
  });

// ───────── Engagement ─────────
export const useTrackBlogView = () =>
  useMutation({
    mutationFn: async (postId: string) => {
      const sid = (() => {
        try {
          let s = sessionStorage.getItem("blog-sid");
          if (!s) {
            s = crypto.randomUUID();
            sessionStorage.setItem("blog-sid", s);
          }
          return s;
        } catch {
          return crypto.randomUUID();
        }
      })();
      await supabase.rpc("blog_increment_view", { _post_id: postId, _session_id: sid });
    },
  });

// Helper to optimistically bump a counter field across all cached blog-posts queries
const bumpCountInCaches = (
  qc: ReturnType<typeof useQueryClient>,
  postId: string,
  field: "like_count" | "bookmark_count",
  delta: number,
) => {
  const bump = (p: any) =>
    p && p.id === postId ? { ...p, [field]: Math.max(0, (p[field] ?? 0) + delta) } : p;
  qc.setQueriesData<any>({ queryKey: ["blog-posts"] }, (old: any) =>
    Array.isArray(old) ? old.map(bump) : old,
  );
  qc.setQueriesData<any>({ queryKey: ["blog-post"] }, (old: any) =>
    old && old.id === postId ? { ...old, [field]: Math.max(0, (old[field] ?? 0) + delta) } : old,
  );
  qc.setQueriesData<any>({ queryKey: ["blog-related"] }, (old: any) =>
    Array.isArray(old) ? old.map(bump) : old,
  );
};
const bumpLikeCountInCaches = (qc: ReturnType<typeof useQueryClient>, postId: string, delta: number) =>
  bumpCountInCaches(qc, postId, "like_count", delta);
const bumpBookmarkCountInCaches = (qc: ReturnType<typeof useQueryClient>, postId: string, delta: number) =>
  bumpCountInCaches(qc, postId, "bookmark_count", delta);

export const useBlogLike = (postId: string | undefined) => {
  const qc = useQueryClient();

  const liked = useQuery({
    queryKey: ["blog-like", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase
        .from("blog_likes")
        .select("post_id")
        .eq("post_id", postId!)
        .eq("user_id", u.user.id)
        .maybeSingle();
      return !!data;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in to like posts");
      const targetLiked = qc.getQueryData<boolean>(["blog-like", postId]);
      if (targetLiked) {
        const { error } = await supabase
          .from("blog_likes")
          .insert({ post_id: postId!, user_id: u.user.id });
        if (error && (error as any).code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("blog_likes")
          .delete()
          .eq("post_id", postId!)
          .eq("user_id", u.user.id);
        if (error) throw error;
      }
      return targetLiked;
    },
    onMutate: async () => {
      if (!postId) return;
      await qc.cancelQueries({ queryKey: ["blog-like", postId] });
      const prev = qc.getQueryData<boolean>(["blog-like", postId]);
      const next = !prev;
      qc.setQueryData(["blog-like", postId], next);
      bumpLikeCountInCaches(qc, postId, next ? 1 : -1);
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      if (postId && ctx) {
        qc.setQueryData(["blog-like", postId], ctx.prev);
        bumpLikeCountInCaches(qc, postId, ctx.prev ? 1 : -1);
      }
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
    onSuccess: (nowLiked) => {
      sonnerToast(nowLiked ? "Liked" : "Like removed", {
        action: {
          label: "Undo",
          onClick: () => toggle.mutate(),
        },
        duration: 4000,
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["blog-like", postId] });
    },
  });

  return { liked: !!liked.data, toggle: toggle.mutate, isPending: toggle.isPending };
};

export const useBlogBookmark = (postId: string | undefined) => {
  const qc = useQueryClient();
  const bookmarked = useQuery({
    queryKey: ["blog-bookmark", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase
        .from("blog_bookmarks")
        .select("post_id")
        .eq("post_id", postId!)
        .eq("user_id", u.user.id)
        .maybeSingle();
      return !!data;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in to bookmark posts");
      const targetBookmarked = qc.getQueryData<boolean>(["blog-bookmark", postId]);
      if (targetBookmarked) {
        const { error } = await supabase
          .from("blog_bookmarks")
          .insert({ post_id: postId!, user_id: u.user.id });
        if (error && (error as any).code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("blog_bookmarks")
          .delete()
          .eq("post_id", postId!)
          .eq("user_id", u.user.id);
        if (error) throw error;
      }
      return targetBookmarked;
    },
    onMutate: async () => {
      if (!postId) return;
      await qc.cancelQueries({ queryKey: ["blog-bookmark", postId] });
      const prev = qc.getQueryData<boolean>(["blog-bookmark", postId]);
      const next = !prev;
      qc.setQueryData(["blog-bookmark", postId], next);
      bumpBookmarkCountInCaches(qc, postId, next ? 1 : -1);
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      if (postId && ctx) {
        qc.setQueryData(["blog-bookmark", postId], ctx.prev);
        bumpBookmarkCountInCaches(qc, postId, ctx.prev ? 1 : -1);
      }
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
    onSuccess: (nowBookmarked) => {
      sonnerToast(nowBookmarked ? "Bookmarked" : "Bookmark removed", {
        action: {
          label: "Undo",
          onClick: () => toggle.mutate(),
        },
        duration: 4000,
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["blog-bookmark", postId] }),
  });

  return { bookmarked: !!bookmarked.data, toggle: toggle.mutate };
};

// ───────── Comments ─────────
export const useBlogComments = (postId: string | undefined) =>
  useQuery({
    queryKey: ["blog-comments", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_comments")
        .select("*")
        .eq("post_id", postId!)
        .eq("status", "visible")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as BlogComment[];
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

export const usePostComment = (postId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, parentId }: { body: string; parentId?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in to comment");
      const { error } = await supabase.from("blog_comments").insert({
        post_id: postId!,
        user_id: u.user.id,
        parent_id: parentId ?? null,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-comments", postId] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteComment = (postId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-comments", postId] }),
  });
};

export const useReportComment = (postId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_comments")
        .update({ status: "reported" })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["blog-comments", postId] });
      const prev = qc.getQueryData<any[]>(["blog-comments", postId]);
      qc.setQueryData<any[]>(["blog-comments", postId], (old) =>
        (old ?? []).filter((c) => c.id !== id),
      );
      return { prev };
    },
    onError: (e: any, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["blog-comments", postId], ctx.prev);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
    onSuccess: (id) => {
      sonnerToast("Reported", {
        description: "Thanks — our team will review this comment.",
        action: {
          label: "Undo",
          onClick: async () => {
            await supabase.from("blog_comments").update({ status: "visible" }).eq("id", id);
            qc.invalidateQueries({ queryKey: ["blog-comments", postId] });
          },
        },
        duration: 6000,
      });
    },
  });
};

// ───────── Batch user reactions for index/grid views ─────────
export const useUserBlogReactions = (postIds: string[]) =>
  useQuery({
    queryKey: ["blog-user-reactions", [...postIds].sort().join(",")],
    enabled: postIds.length > 0,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { likes: new Set<string>(), bookmarks: new Set<string>() };
      const [likesRes, bmRes] = await Promise.all([
        supabase.from("blog_likes").select("post_id").eq("user_id", u.user.id).in("post_id", postIds),
        supabase.from("blog_bookmarks").select("post_id").eq("user_id", u.user.id).in("post_id", postIds),
      ]);
      return {
        likes: new Set((likesRes.data ?? []).map((r: any) => r.post_id)),
        bookmarks: new Set((bmRes.data ?? []).map((r: any) => r.post_id)),
      };
    },
  });


// ───────── Related posts (same category, exclude current) ─────────
export const useRelatedPosts = (
  postId: string | undefined,
  categorySlugs: string[] | undefined,
  limit = 3,
) =>
  useQuery({
    queryKey: ["blog-related", postId, categorySlugs],
    enabled: !!postId,
    queryFn: async () => {
      let q = supabase
        .from("blog_posts")
        .select(
          "id, slug, title, excerpt, cover_image_url, reading_time_min, view_count, like_count, bookmark_count, published_at, categories:blog_post_categories(category:blog_categories(*))",
        )
        .eq("status", "published")
        .neq("id", postId!)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(20);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as any[];
      if (categorySlugs && categorySlugs.length) {
        rows = rows.filter((r) =>
          (r.categories ?? []).some((c: any) => categorySlugs.includes(c.category?.slug)),
        );
      }
      return rows
        .slice(0, limit)
        .map((r) => ({
          ...r,
          categories: (r.categories ?? []).map((c: any) => c.category).filter(Boolean),
        }));
    },
  });

