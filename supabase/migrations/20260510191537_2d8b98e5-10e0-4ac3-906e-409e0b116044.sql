CREATE TABLE IF NOT EXISTS public.blog_comment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  post_id uuid,
  actor_id uuid,
  action text NOT NULL,
  old_status text,
  new_status text,
  comment_snapshot text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_comment_audit_created_at ON public.blog_comment_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comment_audit_comment_id ON public.blog_comment_audit(comment_id);

ALTER TABLE public.blog_comment_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_comment_audit_admin_read" ON public.blog_comment_audit;
CREATE POLICY "blog_comment_audit_admin_read" ON public.blog_comment_audit
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.blog_comment_audit_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.blog_comment_audit
        (comment_id, post_id, actor_id, action, old_status, new_status, comment_snapshot)
      VALUES
        (NEW.id, NEW.post_id, auth.uid(),
         CASE NEW.status
           WHEN 'visible' THEN 'make_visible'
           WHEN 'hidden' THEN 'hide'
           WHEN 'reported' THEN 'report'
           ELSE 'status_change'
         END,
         OLD.status, NEW.status, LEFT(COALESCE(NEW.body, ''), 500));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.blog_comment_audit
      (comment_id, post_id, actor_id, action, old_status, new_status, comment_snapshot)
    VALUES
      (OLD.id, OLD.post_id, auth.uid(), 'delete', OLD.status, NULL, LEFT(COALESCE(OLD.body, ''), 500));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_comment_audit ON public.blog_comments;
CREATE TRIGGER trg_blog_comment_audit
  AFTER UPDATE OR DELETE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.blog_comment_audit_fn();