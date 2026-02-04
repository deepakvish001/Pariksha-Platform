-- Create user_goals table for daily/weekly targets
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  daily_target INTEGER NOT NULL DEFAULT 5,
  weekly_target INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_goals
CREATE POLICY "Users can view their own goals"
  ON public.user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON public.user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.user_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create a secure view for the leaderboard
-- This exposes only public profile info with completion counts
CREATE OR REPLACE VIEW public.leaderboard_view AS
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