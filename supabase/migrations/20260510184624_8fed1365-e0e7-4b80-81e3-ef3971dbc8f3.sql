
-- ============ ENUMS ============
CREATE TYPE public.blog_post_status AS ENUM ('draft','scheduled','published','archived');
CREATE TYPE public.blog_comment_status AS ENUM ('visible','hidden','reported','deleted');

-- ============ TABLES ============
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#f59e0b',
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content_md text NOT NULL DEFAULT '',
  cover_image_url text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.blog_post_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  scheduled_for timestamptz,
  reading_time_min int NOT NULL DEFAULT 1,
  view_count bigint NOT NULL DEFAULT 0,
  like_count bigint NOT NULL DEFAULT 0,
  comment_count bigint NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  is_featured boolean NOT NULL DEFAULT false,
  allow_comments boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_posts_status_pub_idx ON public.blog_posts (status, published_at DESC);
CREATE INDEX blog_posts_author_idx ON public.blog_posts (author_id);
CREATE INDEX blog_posts_featured_idx ON public.blog_posts (is_featured) WHERE is_featured = true;
CREATE INDEX blog_posts_scheduled_idx ON public.blog_posts (scheduled_for) WHERE status = 'scheduled';

CREATE TABLE public.blog_post_categories (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);
CREATE INDEX blog_post_categories_cat_idx ON public.blog_post_categories (category_id);

CREATE TABLE public.blog_post_tags (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX blog_post_tags_tag_idx ON public.blog_post_tags (tag_id);

CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  status public.blog_comment_status NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_comments_post_idx ON public.blog_comments (post_id, created_at DESC);
CREATE INDEX blog_comments_user_idx ON public.blog_comments (user_id);

CREATE TABLE public.blog_likes (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.blog_bookmarks (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.blog_views (
  id bigserial PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  viewed_on date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  dedup_key text GENERATED ALWAYS AS (COALESCE(user_id::text, session_id, '')) STORED
);
CREATE INDEX blog_views_post_idx ON public.blog_views (post_id, viewed_at DESC);
CREATE UNIQUE INDEX blog_views_dedup_idx ON public.blog_views (post_id, dedup_key, viewed_on);

CREATE TABLE public.blog_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_md text NOT NULL,
  saved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_revisions_post_idx ON public.blog_revisions (post_id, created_at DESC);

-- ============ TIMESTAMPS / TRIGGERS ============
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_blog_categories_updated BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_blog_comments_updated BEFORE UPDATE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.blog_posts_before_save()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE words int;
BEGIN
  words := array_length(regexp_split_to_array(coalesce(NEW.content_md,''), '\s+'), 1);
  NEW.reading_time_min := GREATEST(1, COALESCE(words,0) / 200);
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_blog_posts_before_save BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog_posts_before_save();

CREATE OR REPLACE FUNCTION public.blog_likes_count_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_blog_likes_count AFTER INSERT OR DELETE ON public.blog_likes
  FOR EACH ROW EXECUTE FUNCTION public.blog_likes_count_fn();

CREATE OR REPLACE FUNCTION public.blog_comments_count_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'visible' THEN
    UPDATE public.blog_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'visible' THEN
    UPDATE public.blog_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status = 'visible' AND OLD.status <> 'visible' THEN
      UPDATE public.blog_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF OLD.status = 'visible' AND NEW.status <> 'visible' THEN
      UPDATE public.blog_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_blog_comments_count AFTER INSERT OR UPDATE OR DELETE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.blog_comments_count_fn();

-- ============ RLS ============
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_revisions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_blog_editor(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role IN ('admin','owner','moderator')
  )
$$;

CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (status = 'published');
CREATE POLICY "blog_posts_author_read" ON public.blog_posts
  FOR SELECT TO authenticated USING (author_id = auth.uid() OR public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_posts_editor_insert" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_posts_editor_update" ON public.blog_posts
  FOR UPDATE TO authenticated USING (public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_posts_editor_delete" ON public.blog_posts
  FOR DELETE TO authenticated USING (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_cats_public_read" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "blog_cats_editor_write" ON public.blog_categories
  FOR ALL TO authenticated USING (public.is_blog_editor(auth.uid())) WITH CHECK (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_tags_public_read" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "blog_tags_editor_write" ON public.blog_tags
  FOR ALL TO authenticated USING (public.is_blog_editor(auth.uid())) WITH CHECK (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_pc_public_read" ON public.blog_post_categories FOR SELECT USING (true);
CREATE POLICY "blog_pc_editor_write" ON public.blog_post_categories
  FOR ALL TO authenticated USING (public.is_blog_editor(auth.uid())) WITH CHECK (public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_pt_public_read" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "blog_pt_editor_write" ON public.blog_post_tags
  FOR ALL TO authenticated USING (public.is_blog_editor(auth.uid())) WITH CHECK (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_comments_public_read" ON public.blog_comments
  FOR SELECT USING (status = 'visible');
CREATE POLICY "blog_comments_self_read" ON public.blog_comments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_comments_user_insert" ON public.blog_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "blog_comments_user_update" ON public.blog_comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_comments_user_delete" ON public.blog_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_likes_public_read" ON public.blog_likes FOR SELECT USING (true);
CREATE POLICY "blog_likes_self_write" ON public.blog_likes
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "blog_bookmarks_self" ON public.blog_bookmarks
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "blog_views_anyone_insert" ON public.blog_views
  FOR INSERT WITH CHECK (true);
CREATE POLICY "blog_views_editor_read" ON public.blog_views
  FOR SELECT TO authenticated USING (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_revisions_editor_all" ON public.blog_revisions
  FOR ALL TO authenticated USING (public.is_blog_editor(auth.uid())) WITH CHECK (public.is_blog_editor(auth.uid()));

-- ============ STORAGE ============
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-media','blog-media', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "blog_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-media');
CREATE POLICY "blog_media_editor_write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog-media' AND public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_media_editor_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'blog-media' AND public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_media_editor_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'blog-media' AND public.is_blog_editor(auth.uid()));

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.blog_increment_view(_post_id uuid, _session_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN
    INSERT INTO public.blog_views (post_id, user_id, session_id)
      VALUES (_post_id, auth.uid(), _session_id);
    UPDATE public.blog_posts SET view_count = view_count + 1 WHERE id = _post_id;
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END $$;

CREATE OR REPLACE FUNCTION public.blog_publish_scheduled()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  UPDATE public.blog_posts
    SET status = 'published', published_at = now()
    WHERE status = 'scheduled' AND scheduled_for <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname='blog-publish-scheduled';
    PERFORM cron.schedule('blog-publish-scheduled', '*/5 * * * *', 'SELECT public.blog_publish_scheduled();');
  END IF;
END $$;

INSERT INTO public.blog_categories (slug,name,color,icon,sort_order) VALUES
  ('career','Career','#f59e0b','briefcase',1),
  ('dsa','DSA & Coding','#10b981','code',2),
  ('interview','Interview Prep','#8b5cf6','message-circle',3),
  ('placement','Placement Stories','#ef4444','award',4),
  ('tutorials','Tutorials','#3b82f6','book-open',5),
  ('announcements','Announcements','#ec4899','megaphone',6)
ON CONFLICT (slug) DO NOTHING;
