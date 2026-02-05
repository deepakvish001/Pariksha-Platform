-- Create a view for roadmap leaderboard based on user_topic_progress
-- This aggregates completed roadmap topics per user

CREATE OR REPLACE VIEW public.roadmap_leaderboard_view AS
SELECT 
  utp.user_id,
  COUNT(DISTINCT utp.topic_id) FILTER (WHERE utp.completed = true AND utp.sheet_id LIKE 'roadmap-tree-%') as completed_topics,
  COUNT(DISTINCT utp.sheet_id) FILTER (WHERE utp.completed = true AND utp.sheet_id LIKE 'roadmap-tree-%') as roadmaps_started,
  MAX(utp.completed_at) FILTER (WHERE utp.completed = true AND utp.sheet_id LIKE 'roadmap-tree-%') as last_completed_at
FROM public.user_topic_progress utp
WHERE utp.sheet_id LIKE 'roadmap-tree-%'
GROUP BY utp.user_id
HAVING COUNT(DISTINCT utp.topic_id) FILTER (WHERE utp.completed = true) > 0
ORDER BY completed_topics DESC;