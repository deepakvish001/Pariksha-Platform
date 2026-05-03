
REVOKE ALL ON FUNCTION public.register_for_contest(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_for_contest(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.mirror_code_submission_to_contests() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_contest_leaderboard(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recompute_contest_leaderboard(uuid) TO authenticated;
