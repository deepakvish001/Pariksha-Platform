-- Fix all views to use SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures all views respect the permissions of the querying user

-- 1. Recreate leaderboard_view with security_invoker
DROP VIEW IF EXISTS public.leaderboard_view;

CREATE VIEW public.leaderboard_view
WITH (security_invoker = true)
AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  COALESCE(progress.completed_count, 0::bigint) AS completed_count,
  COALESCE(progress.revision_count, 0::bigint) AS revision_count
FROM profiles p
LEFT JOIN (
  SELECT 
    user_topic_progress.user_id,
    count(*) FILTER (WHERE user_topic_progress.completed = true) AS completed_count,
    count(*) FILTER (WHERE user_topic_progress.is_revision = true) AS revision_count
  FROM user_topic_progress
  GROUP BY user_topic_progress.user_id
) progress ON p.user_id = progress.user_id
WHERE COALESCE(progress.completed_count, 0::bigint) > 0
ORDER BY COALESCE(progress.completed_count, 0::bigint) DESC
LIMIT 50;

-- 2. Recreate public_user_profiles with security_invoker (ensure it's set correctly)
DROP VIEW IF EXISTS public.public_user_profiles;

CREATE VIEW public.public_user_profiles 
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  username,
  bio,
  location,
  occupation,
  website,
  skills,
  interests,
  goals,
  aspirations,
  twitter_url,
  linkedin_url,
  github_url,
  instagram_url,
  leetcode_url,
  hackerrank_url,
  codeforces_url,
  codechef_url,
  geeksforgeeks_url,
  total_xp,
  xp_this_week,
  current_level,
  profile_completion_percentage,
  created_at
FROM public.user_profiles_extended;

-- 3. Recreate roadmap_leaderboard_view with security_invoker
DROP VIEW IF EXISTS public.roadmap_leaderboard_view;

CREATE VIEW public.roadmap_leaderboard_view
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  count(DISTINCT topic_id) FILTER (WHERE completed = true AND sheet_id LIKE 'roadmap-tree-%') AS completed_topics,
  count(DISTINCT sheet_id) FILTER (WHERE completed = true AND sheet_id LIKE 'roadmap-tree-%') AS roadmaps_started,
  max(completed_at) FILTER (WHERE completed = true AND sheet_id LIKE 'roadmap-tree-%') AS last_completed_at
FROM user_topic_progress
WHERE sheet_id LIKE 'roadmap-tree-%'
GROUP BY user_id
HAVING count(DISTINCT topic_id) FILTER (WHERE completed = true) > 0
ORDER BY count(DISTINCT topic_id) FILTER (WHERE completed = true AND sheet_id LIKE 'roadmap-tree-%') DESC;

-- 4. Recreate xp_leaderboard_view with security_invoker
DROP VIEW IF EXISTS public.xp_leaderboard_view;

CREATE VIEW public.xp_leaderboard_view
WITH (security_invoker = true)
AS
SELECT 
  upe.user_id,
  upe.username,
  upe.total_xp,
  upe.current_level,
  upe.xp_this_week,
  p.full_name,
  p.avatar_url
FROM user_profiles_extended upe
LEFT JOIN profiles p ON p.user_id = upe.user_id
WHERE upe.total_xp > 0 AND upe.username IS NOT NULL AND upe.username <> ''
ORDER BY upe.total_xp DESC;

-- Grant appropriate access
GRANT SELECT ON public.leaderboard_view TO anon, authenticated;
GRANT SELECT ON public.public_user_profiles TO anon, authenticated;
GRANT SELECT ON public.roadmap_leaderboard_view TO anon, authenticated;
GRANT SELECT ON public.xp_leaderboard_view TO anon, authenticated;