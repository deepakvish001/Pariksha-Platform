-- Extend player_reports with resolution fields
ALTER TABLE public.player_reports
  ADD COLUMN IF NOT EXISTS resolved_by UUID,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Admin policies
DROP POLICY IF EXISTS "player_reports admin read" ON public.player_reports;
CREATE POLICY "player_reports admin read" ON public.player_reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "player_reports admin update" ON public.player_reports;
CREATE POLICY "player_reports admin update" ON public.player_reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "user_blocks admin read" ON public.user_blocks;
CREATE POLICY "user_blocks admin read" ON public.user_blocks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger: prevent friend requests across blocks, and remove friendships when a block is created
CREATE OR REPLACE FUNCTION public.enforce_block_on_friendship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = NEW.requester_id AND blocked_id = NEW.addressee_id)
       OR (blocker_id = NEW.addressee_id AND blocked_id = NEW.requester_id)
  ) THEN
    RAISE EXCEPTION 'Cannot create friendship: one user has blocked the other';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS friendships_block_guard ON public.friendships;
CREATE TRIGGER friendships_block_guard
  BEFORE INSERT OR UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.enforce_block_on_friendship();

CREATE OR REPLACE FUNCTION public.cleanup_friendships_on_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.friendships
  WHERE (requester_id = NEW.blocker_id AND addressee_id = NEW.blocked_id)
     OR (requester_id = NEW.blocked_id AND addressee_id = NEW.blocker_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_blocks_cleanup ON public.user_blocks;
CREATE TRIGGER user_blocks_cleanup
  AFTER INSERT ON public.user_blocks
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_friendships_on_block();