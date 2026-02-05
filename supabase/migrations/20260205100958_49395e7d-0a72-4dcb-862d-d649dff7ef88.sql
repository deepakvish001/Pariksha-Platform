-- Add XP goal fields to user_goals table
ALTER TABLE public.user_goals
ADD COLUMN IF NOT EXISTS daily_xp_target INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS weekly_xp_target INTEGER DEFAULT 300;

-- Create index on user_profiles_extended for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON public.user_profiles_extended(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_xp_this_week ON public.user_profiles_extended(xp_this_week DESC);

-- Create a view for the XP leaderboard
CREATE OR REPLACE VIEW public.xp_leaderboard_view AS
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
WHERE upe.total_xp > 0
ORDER BY upe.total_xp DESC;