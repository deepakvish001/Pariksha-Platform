-- Add notification type preference columns to user_profiles_extended
ALTER TABLE public.user_profiles_extended
ADD COLUMN IF NOT EXISTS notify_velocity_reminder BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_achievement_unlock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_follower BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_goal_milestone BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_streak_reminder BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_rare_achievement BOOLEAN DEFAULT true;