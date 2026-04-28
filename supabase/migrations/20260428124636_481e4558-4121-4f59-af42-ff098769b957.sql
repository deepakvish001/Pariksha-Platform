-- Per-user daily challenge completion history (private)
CREATE TABLE public.daily_challenge_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_date DATE NOT NULL,
  problem_slug TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_date)
);

CREATE INDEX idx_dcc_user_date ON public.daily_challenge_completions (user_id, challenge_date DESC);

ALTER TABLE public.daily_challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own completions"
  ON public.daily_challenge_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own completions"
  ON public.daily_challenge_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own completions"
  ON public.daily_challenge_completions FOR DELETE
  USING (auth.uid() = user_id);

-- Leaderboard opt-in (one row per user)
CREATE TABLE public.daily_challenge_leaderboard_optin (
  user_id UUID NOT NULL PRIMARY KEY,
  opted_in BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenge_leaderboard_optin ENABLE ROW LEVEL SECURITY;

-- A user can read their own opt-in record
CREATE POLICY "Users view own optin"
  ON public.daily_challenge_leaderboard_optin FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can read rows of users who have opted in (needed for leaderboard)
CREATE POLICY "Authenticated view opted-in users"
  ON public.daily_challenge_leaderboard_optin FOR SELECT
  TO authenticated
  USING (opted_in = true);

CREATE POLICY "Users insert own optin"
  ON public.daily_challenge_leaderboard_optin FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own optin"
  ON public.daily_challenge_leaderboard_optin FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_dclo_updated_at
  BEFORE UPDATE ON public.daily_challenge_leaderboard_optin
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security-definer function: computes leaderboard for authenticated callers
CREATE OR REPLACE FUNCTION public.get_daily_challenge_leaderboard(_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  current_streak INTEGER,
  weekly_completions INTEGER,
  total_completions INTEGER,
  last_completed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  WITH opted AS (
    SELECT o.user_id, o.display_name
    FROM public.daily_challenge_leaderboard_optin o
    WHERE o.opted_in = true
  ),
  agg AS (
    SELECT
      c.user_id,
      COUNT(*)::INTEGER AS total_completions,
      COUNT(*) FILTER (WHERE c.challenge_date >= (CURRENT_DATE - INTERVAL '6 days'))::INTEGER AS weekly_completions,
      MAX(c.completed_at) AS last_completed_at
    FROM public.daily_challenge_completions c
    WHERE c.user_id IN (SELECT user_id FROM opted)
    GROUP BY c.user_id
  ),
  -- Compute current streak per user (consecutive days ending today or yesterday)
  streaks AS (
    SELECT
      sub.user_id,
      COUNT(*)::INTEGER AS current_streak
    FROM (
      SELECT
        c.user_id,
        c.challenge_date,
        (CURRENT_DATE - c.challenge_date) AS days_ago,
        ROW_NUMBER() OVER (PARTITION BY c.user_id ORDER BY c.challenge_date DESC) - 1 AS rn
      FROM public.daily_challenge_completions c
      WHERE c.user_id IN (SELECT user_id FROM opted)
        AND c.challenge_date >= (CURRENT_DATE - INTERVAL '365 days')
    ) sub
    -- A row contributes to the streak only while consecutive from today (or yesterday if today missing)
    WHERE sub.days_ago = sub.rn
       OR (sub.rn = 0 AND sub.days_ago = 1)
       OR (sub.rn > 0 AND sub.days_ago = sub.rn + (
            CASE WHEN EXISTS (
              SELECT 1 FROM public.daily_challenge_completions c2
              WHERE c2.user_id = sub.user_id AND c2.challenge_date = CURRENT_DATE
            ) THEN 0 ELSE 1 END
          ))
    GROUP BY sub.user_id
  )
  SELECT
    o.user_id,
    COALESCE(o.display_name, p.full_name, 'Anonymous') AS display_name,
    p.avatar_url,
    COALESCE(s.current_streak, 0) AS current_streak,
    COALESCE(a.weekly_completions, 0) AS weekly_completions,
    COALESCE(a.total_completions, 0) AS total_completions,
    a.last_completed_at
  FROM opted o
  LEFT JOIN agg a ON a.user_id = o.user_id
  LEFT JOIN streaks s ON s.user_id = o.user_id
  LEFT JOIN public.profiles p ON p.user_id = o.user_id
  ORDER BY current_streak DESC NULLS LAST, weekly_completions DESC, total_completions DESC, last_completed_at DESC NULLS LAST
  LIMIT _limit;
END;
$$;