-- Fix 1: Replace public profiles policy with authenticated-only policy
-- The leaderboard views already use security_invoker=true and will respect RLS
DROP POLICY IF EXISTS "Anyone can view profiles for leaderboard" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles for leaderboard"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: Update notifications INSERT policy to restrict to system triggers only
-- The trigger uses SECURITY DEFINER which runs as the function owner
-- We need to allow inserts where user_id matches the authenticated user OR from triggers
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users and system can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix 3: Update user_activity_log INSERT policy similarly  
DROP POLICY IF EXISTS "System can insert activities" ON public.user_activity_log;

CREATE POLICY "Users and system can insert activities"
  ON public.user_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);