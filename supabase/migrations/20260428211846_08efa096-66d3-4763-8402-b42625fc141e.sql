
REVOKE EXECUTE ON FUNCTION public.snapshot_my_coding_leaderboard_rank() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_coding_leaderboard_rank_delta(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.snapshot_my_coding_leaderboard_rank() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_coding_leaderboard_rank_delta(uuid, text) TO authenticated;
