-- Restrict leaderboard RPC: revoke from anon/public, grant only to authenticated
REVOKE ALL ON FUNCTION public.get_daily_challenge_leaderboard(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_daily_challenge_leaderboard(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_daily_challenge_leaderboard(integer) TO authenticated;

-- Tighten RLS on daily_challenge_completions: ensure only authenticated users
DROP POLICY IF EXISTS "Users view own completions" ON public.daily_challenge_completions;
DROP POLICY IF EXISTS "Users insert own completions" ON public.daily_challenge_completions;
DROP POLICY IF EXISTS "Users delete own completions" ON public.daily_challenge_completions;

CREATE POLICY "Users view own completions"
  ON public.daily_challenge_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own completions"
  ON public.daily_challenge_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own completions"
  ON public.daily_challenge_completions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tighten RLS on opt-in table to authenticated only
DROP POLICY IF EXISTS "Users view own optin" ON public.daily_challenge_leaderboard_optin;
DROP POLICY IF EXISTS "Users insert own optin" ON public.daily_challenge_leaderboard_optin;
DROP POLICY IF EXISTS "Users update own optin" ON public.daily_challenge_leaderboard_optin;

CREATE POLICY "Users view own optin"
  ON public.daily_challenge_leaderboard_optin FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own optin"
  ON public.daily_challenge_leaderboard_optin FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own optin"
  ON public.daily_challenge_leaderboard_optin FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);