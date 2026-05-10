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
