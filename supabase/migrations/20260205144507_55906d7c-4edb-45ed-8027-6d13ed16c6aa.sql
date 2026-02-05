-- Fix security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.roadmap_leaderboard_view;

CREATE VIEW public.roadmap_leaderboard_view 
WITH (security_invoker = true) AS
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