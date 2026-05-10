ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS bookmark_count bigint NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.blog_bookmarks_count_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts SET bookmark_count = GREATEST(0, bookmark_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_bookmarks_count ON public.blog_bookmarks;
CREATE TRIGGER trg_blog_bookmarks_count AFTER INSERT OR DELETE ON public.blog_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.blog_bookmarks_count_fn();

UPDATE public.blog_posts p
SET bookmark_count = COALESCE(c.cnt, 0)
FROM (SELECT post_id, COUNT(*) AS cnt FROM public.blog_bookmarks GROUP BY post_id) c
WHERE c.post_id = p.id;