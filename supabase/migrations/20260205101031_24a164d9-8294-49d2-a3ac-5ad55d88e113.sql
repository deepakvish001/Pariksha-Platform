-- Drop the security definer view and recreate as regular view
DROP VIEW IF EXISTS public.xp_leaderboard_view;

-- Create a regular view for the XP leaderboard
CREATE VIEW public.xp_leaderboard_view AS
SELECT 
  upe.user_id,
  upe.username,
  upe.total_xp,
  upe.current_level,
  upe.xp_this_week,
  p.full_name,
  p.avatar_url
FROM public.user_profiles_extended upe
LEFT JOIN public.profiles p ON p.user_id = upe.user_id
WHERE upe.total_xp > 0 AND upe.username IS NOT NULL AND upe.username != ''
ORDER BY upe.total_xp DESC;