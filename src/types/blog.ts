export type BlogPostStatus = "draft" | "scheduled" | "published" | "archived";
export type BlogCommentStatus = "visible" | "hidden" | "reported" | "deleted";

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
}

export interface BlogTag {
  id: string;
  slug: string;
  name: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  cover_image_url: string | null;
  author_id: string | null;
  status: BlogPostStatus;
  published_at: string | null;
  scheduled_for: string | null;
  reading_time_min: number;
  view_count: number;
  like_count: number;
  bookmark_count: number;
  comment_count: number;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  is_featured: boolean;
  allow_comments: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostWithRelations extends BlogPost {
  categories?: BlogCategory[];
  tags?: BlogTag[];
  author?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  status: BlogCommentStatus;
  created_at: string;
  updated_at: string;
  author?: { full_name: string | null; avatar_url: string | null } | null;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
