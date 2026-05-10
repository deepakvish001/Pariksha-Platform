-- 1. Audit table for revision actions
CREATE TABLE public.blog_revision_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  revision_id uuid REFERENCES public.blog_revisions(id) ON DELETE SET NULL,
  compare_revision_id uuid REFERENCES public.blog_revisions(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('viewed','compared','restored','created','edited')),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_revision_audit_post_idx ON public.blog_revision_audit(post_id, created_at DESC);
CREATE INDEX blog_revision_audit_actor_idx ON public.blog_revision_audit(actor_id, created_at DESC);

ALTER TABLE public.blog_revision_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_revision_audit_editor_read"
  ON public.blog_revision_audit FOR SELECT
  TO authenticated
  USING (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_revision_audit_editor_insert"
  ON public.blog_revision_audit FOR INSERT
  TO authenticated
  WITH CHECK (public.is_blog_editor(auth.uid()) AND actor_id = auth.uid());

-- 2. Comment approval workflow
ALTER TABLE public.blog_comments
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX blog_comments_pending_idx
  ON public.blog_comments(post_id, created_at DESC)
  WHERE approved_at IS NULL;

CREATE INDEX blog_comments_public_idx
  ON public.blog_comments(post_id, created_at DESC)
  WHERE approved_at IS NOT NULL AND status = 'visible';

-- Per-post auto-approval toggle
ALTER TABLE public.blog_posts
  ADD COLUMN auto_approve_comments boolean NOT NULL DEFAULT false;

-- Auto-approve trigger: editors are always trusted; otherwise honor the post setting.
CREATE OR REPLACE FUNCTION public.blog_comment_autoapprove_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auto boolean;
BEGIN
  IF NEW.approved_at IS NULL THEN
    IF public.is_blog_editor(NEW.user_id) THEN
      NEW.approved_at := now();
      NEW.approved_by := NEW.user_id;
    ELSE
      SELECT auto_approve_comments INTO v_auto FROM public.blog_posts WHERE id = NEW.post_id;
      IF coalesce(v_auto, false) THEN
        NEW.approved_at := now();
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_comment_autoapprove ON public.blog_comments;
CREATE TRIGGER trg_blog_comment_autoapprove
  BEFORE INSERT ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.blog_comment_autoapprove_fn();

-- Backfill: keep existing visible comments visible.
UPDATE public.blog_comments
SET approved_at = created_at
WHERE status = 'visible' AND approved_at IS NULL;

-- Replace public read policy to require approval.
DROP POLICY IF EXISTS "blog_comments_public_read" ON public.blog_comments;
CREATE POLICY "blog_comments_public_read"
  ON public.blog_comments FOR SELECT
  USING (status = 'visible' AND approved_at IS NOT NULL);

-- Update count function to only tally approved + visible.
CREATE OR REPLACE FUNCTION public.blog_comments_count_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  was_pub boolean;
  now_pub boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'visible' AND NEW.approved_at IS NOT NULL THEN
      UPDATE public.blog_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'visible' AND OLD.approved_at IS NOT NULL THEN
      UPDATE public.blog_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    was_pub := (OLD.status = 'visible' AND OLD.approved_at IS NOT NULL);
    now_pub := (NEW.status = 'visible' AND NEW.approved_at IS NOT NULL);
    IF was_pub AND NOT now_pub THEN
      UPDATE public.blog_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.post_id;
    ELSIF NOT was_pub AND now_pub THEN
      UPDATE public.blog_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recompute current counts so they reflect the new rule.
UPDATE public.blog_posts p
SET comment_count = sub.cnt
FROM (
  SELECT post_id, count(*)::bigint AS cnt
  FROM public.blog_comments
  WHERE status = 'visible' AND approved_at IS NOT NULL
  GROUP BY post_id
) sub
WHERE p.id = sub.post_id;

UPDATE public.blog_posts
SET comment_count = 0
WHERE id NOT IN (
  SELECT post_id FROM public.blog_comments
  WHERE status = 'visible' AND approved_at IS NOT NULL
);