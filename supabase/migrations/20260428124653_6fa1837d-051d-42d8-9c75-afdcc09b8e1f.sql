REVOKE EXECUTE ON FUNCTION public.get_daily_challenge_leaderboard(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_challenge_leaderboard(INTEGER) TO authenticated;