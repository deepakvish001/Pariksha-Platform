-- Drop and recreate the view with security_invoker to fix security warning
DROP VIEW IF EXISTS public.leaderboard_view;

CREATE VIEW public.leaderboard_view
WITH (security_invoker = on) AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  COALESCE(progress.completed_count, 0) as completed_count,
  COALESCE(progress.revision_count, 0) as revision_count
FROM public.profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) FILTER (WHERE completed = true) as completed_count,
    COUNT(*) FILTER (WHERE is_revision = true) as revision_count
  FROM public.user_topic_progress
  GROUP BY user_id
) progress ON p.user_id = progress.user_id
WHERE COALESCE(progress.completed_count, 0) > 0
ORDER BY completed_count DESC
LIMIT 50;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.leaderboard_view TO authenticated;

-- Add a policy to profiles table to allow reading public profile info for leaderboard
CREATE POLICY "Anyone can view profiles for leaderboard"
  ON public.profiles FOR SELECT
  USING (true);