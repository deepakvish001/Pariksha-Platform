-- Fix: Recreate public_user_profiles view with SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures the view respects the permissions of the querying user, not the view creator

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

-- Grant access to authenticated and anonymous users for public profile viewing
GRANT SELECT ON public.public_user_profiles TO anon, authenticated;