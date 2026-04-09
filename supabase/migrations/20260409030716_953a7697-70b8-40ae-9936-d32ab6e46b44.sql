
-- Fix 1: Restrict quiz_results SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view quiz results for leaderboard" ON public.quiz_results;
CREATE POLICY "Authenticated users can view quiz results for leaderboard"
  ON public.quiz_results
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: Remove client INSERT policy on xp_transactions
DROP POLICY IF EXISTS "Users can insert their own XP transactions" ON public.xp_transactions;

-- Create a secure server-side function to award XP
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid,
  _amount integer,
  _source text,
  _description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_per_event integer := 100;
  new_total integer;
  new_level integer;
  result jsonb;
BEGIN
  -- Validate caller is the user
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only award XP to yourself';
  END IF;

  -- Validate amount bounds
  IF _amount <= 0 OR _amount > max_per_event THEN
    RAISE EXCEPTION 'Invalid XP amount: must be between 1 and %', max_per_event;
  END IF;

  -- Validate source
  IF _source NOT IN ('quiz', 'srs_review', 'srs_mastered', 'streak', 'achievement', 'topic_complete') THEN
    RAISE EXCEPTION 'Invalid XP source: %', _source;
  END IF;

  -- Insert the transaction
  INSERT INTO public.xp_transactions (user_id, amount, source, description)
  VALUES (_user_id, _amount, _source, _description);

  -- Calculate new totals
  SELECT COALESCE(SUM(amount), 0) INTO new_total
  FROM public.xp_transactions
  WHERE user_id = _user_id;

  -- Calculate level (mirrors client-side logic)
  new_level := CASE
    WHEN new_total >= 23350 THEN 20
    WHEN new_total >= 20800 THEN 19
    WHEN new_total >= 18400 THEN 18
    WHEN new_total >= 16150 THEN 17
    WHEN new_total >= 14050 THEN 16
    WHEN new_total >= 12100 THEN 15
    WHEN new_total >= 10300 THEN 14
    WHEN new_total >= 8650 THEN 13
    WHEN new_total >= 7150 THEN 12
    WHEN new_total >= 5800 THEN 11
    WHEN new_total >= 4600 THEN 10
    WHEN new_total >= 3550 THEN 9
    WHEN new_total >= 2650 THEN 8
    WHEN new_total >= 1900 THEN 7
    WHEN new_total >= 1300 THEN 6
    WHEN new_total >= 850 THEN 5
    WHEN new_total >= 500 THEN 4
    WHEN new_total >= 250 THEN 3
    WHEN new_total >= 100 THEN 2
    ELSE 1
  END;

  -- Update profile
  UPDATE public.user_profiles_extended
  SET total_xp = new_total,
      current_level = new_level,
      xp_this_week = COALESCE(xp_this_week, 0) + _amount
  WHERE user_id = _user_id;

  result := jsonb_build_object(
    'total_xp', new_total,
    'current_level', new_level,
    'amount', _amount
  );

  RETURN result;
END;
$$;

-- Fix 3: Fix resume-templates storage upload policy
DROP POLICY IF EXISTS "Admins can upload resume templates" ON storage.objects;
