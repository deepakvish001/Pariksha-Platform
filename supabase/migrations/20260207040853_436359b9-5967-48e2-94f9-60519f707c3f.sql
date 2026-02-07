-- Fix: Restrict user_profiles_extended to prevent mobile number exposure
-- Remove the overly permissive public policy and create a safer one

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view profiles with username set" ON public.user_profiles_extended;

-- Create a new policy that only exposes non-sensitive public profile data via a view
-- Users can still view their own full profile
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles_extended 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create a secure public profile view that excludes sensitive data
CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT 
  user_id,
  username,
  bio,
  location,
  occupation,
  website,
  linkedin_url,
  github_url,
  twitter_url,
  instagram_url,
  leetcode_url,
  hackerrank_url,
  codeforces_url,
  codechef_url,
  geeksforgeeks_url,
  total_xp,
  current_level,
  xp_this_week,
  skills,
  interests,
  goals,
  aspirations,
  profile_completion_percentage,
  created_at
FROM public.user_profiles_extended
WHERE username IS NOT NULL AND username <> '';

-- Grant public access to the safe view
GRANT SELECT ON public.public_user_profiles TO anon, authenticated;