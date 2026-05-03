
-- =========================================================
-- CONTESTS SCHEMA
-- =========================================================

-- 1. CONTESTS
CREATE TABLE public.contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  rules_md text DEFAULT '',
  banner_url text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','live','ended','archived')),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','unlisted','private')),
  invite_code text,
  max_participants integer,
  scoring_mode text NOT NULL DEFAULT 'icpc' CHECK (scoring_mode IN ('icpc','ioi','points')),
  penalty_minutes integer NOT NULL DEFAULT 10,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contests_status ON public.contests(status);
CREATE INDEX idx_contests_starts_at ON public.contests(starts_at);

ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contests public read"
ON public.contests FOR SELECT
USING (
  (visibility IN ('public','unlisted') AND status IN ('published','live','ended'))
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "contests admin all"
ON public.contests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. CONTEST PROBLEMS
CREATE TABLE public.contest_problems (
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  problem_slug text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_id, problem_slug)
);

CREATE INDEX idx_contest_problems_contest ON public.contest_problems(contest_id);

ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contest_problems public read after start"
ON public.contest_problems FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_problems.contest_id
      AND (
        (c.visibility IN ('public','unlisted') AND c.status IN ('live','ended') AND c.starts_at <= now())
        OR has_role(auth.uid(), 'admin'::app_role)
      )
  )
);

CREATE POLICY "contest_problems admin all"
ON public.contest_problems FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. CONTEST REGISTRATIONS
CREATE TABLE public.contest_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','disqualified','withdrawn')),
  display_name text,
  team_name text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, user_id)
);

CREATE INDEX idx_contest_registrations_contest ON public.contest_registrations(contest_id);
CREATE INDEX idx_contest_registrations_user ON public.contest_registrations(user_id);

ALTER TABLE public.contest_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registrations self read"
ON public.contest_registrations FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "registrations public read for visible contests"
ON public.contest_registrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_registrations.contest_id
      AND c.visibility = 'public'
      AND c.status IN ('published','live','ended')
  )
);

CREATE POLICY "registrations self insert"
ON public.contest_registrations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "registrations self delete"
ON public.contest_registrations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "registrations admin all"
ON public.contest_registrations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. CONTEST SUBMISSIONS
CREATE TABLE public.contest_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  problem_slug text NOT NULL,
  submission_id uuid,
  verdict text NOT NULL,
  points_awarded integer NOT NULL DEFAULT 0,
  penalty_seconds integer NOT NULL DEFAULT 0,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contest_submissions_contest_user ON public.contest_submissions(contest_id, user_id);
CREATE INDEX idx_contest_submissions_problem ON public.contest_submissions(contest_id, problem_slug);

ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contest_submissions self read"
ON public.contest_submissions FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "contest_submissions public read after end"
ON public.contest_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_submissions.contest_id
      AND c.status = 'ended'
      AND c.visibility IN ('public','unlisted')
  )
);

CREATE POLICY "contest_submissions admin all"
ON public.contest_submissions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. CONTEST LEADERBOARD CACHE
CREATE TABLE public.contest_leaderboard_cache (
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rank integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  total_penalty_seconds integer NOT NULL DEFAULT 0,
  problems_solved integer NOT NULL DEFAULT 0,
  last_solve_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_id, user_id)
);

CREATE INDEX idx_contest_lb_contest ON public.contest_leaderboard_cache(contest_id, rank);

ALTER TABLE public.contest_leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboard public read"
ON public.contest_leaderboard_cache FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_leaderboard_cache.contest_id
      AND c.visibility IN ('public','unlisted')
      AND c.status IN ('published','live','ended')
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "leaderboard admin all"
ON public.contest_leaderboard_cache FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- TRIGGERS / FUNCTIONS
-- =========================================================

CREATE TRIGGER trg_contests_updated_at
BEFORE UPDATE ON public.contests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recompute leaderboard for a single contest
CREATE OR REPLACE FUNCTION public.recompute_contest_leaderboard(_contest_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_starts timestamptz;
  c_penalty integer;
BEGIN
  SELECT starts_at, penalty_minutes INTO c_starts, c_penalty
  FROM public.contests WHERE id = _contest_id;

  IF c_starts IS NULL THEN RETURN; END IF;

  DELETE FROM public.contest_leaderboard_cache WHERE contest_id = _contest_id;

  WITH solved AS (
    SELECT
      cs.user_id,
      cs.problem_slug,
      MIN(cs.submitted_at) FILTER (WHERE cs.verdict = 'accepted') AS solved_at,
      COUNT(*) FILTER (WHERE cs.verdict <> 'accepted'
                       AND cs.submitted_at < (
                         SELECT MIN(cs2.submitted_at)
                         FROM public.contest_submissions cs2
                         WHERE cs2.contest_id = cs.contest_id
                           AND cs2.user_id = cs.user_id
                           AND cs2.problem_slug = cs.problem_slug
                           AND cs2.verdict = 'accepted'
                       )) AS wrong_before
    FROM public.contest_submissions cs
    WHERE cs.contest_id = _contest_id
    GROUP BY cs.user_id, cs.problem_slug
  ),
  per_user AS (
    SELECT
      s.user_id,
      COUNT(*) FILTER (WHERE s.solved_at IS NOT NULL) AS problems_solved,
      COALESCE(SUM(cp.points) FILTER (WHERE s.solved_at IS NOT NULL), 0) AS total_points,
      COALESCE(SUM(
        EXTRACT(EPOCH FROM (s.solved_at - c_starts))::int
        + COALESCE(s.wrong_before, 0) * c_penalty * 60
      ) FILTER (WHERE s.solved_at IS NOT NULL), 0)::int AS total_penalty_seconds,
      MAX(s.solved_at) AS last_solve_at
    FROM solved s
    LEFT JOIN public.contest_problems cp
      ON cp.contest_id = _contest_id AND cp.problem_slug = s.problem_slug
    GROUP BY s.user_id
  ),
  ranked AS (
    SELECT
      pu.*,
      RANK() OVER (
        ORDER BY pu.total_points DESC,
                 pu.total_penalty_seconds ASC,
                 pu.last_solve_at ASC NULLS LAST
      ) AS rnk
    FROM per_user pu
  )
  INSERT INTO public.contest_leaderboard_cache
    (contest_id, user_id, rank, total_points, total_penalty_seconds, problems_solved, last_solve_at, updated_at)
  SELECT _contest_id, user_id, rnk, total_points, total_penalty_seconds, problems_solved, last_solve_at, now()
  FROM ranked;
END;
$$;

-- Trigger on code_submissions to mirror into contest_submissions
CREATE OR REPLACE FUNCTION public.mirror_code_submission_to_contests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.id AS contest_id
    FROM public.contests c
    JOIN public.contest_problems cp
      ON cp.contest_id = c.id AND cp.problem_slug = NEW.problem_slug
    JOIN public.contest_registrations cr
      ON cr.contest_id = c.id
     AND cr.user_id = NEW.user_id
     AND cr.status = 'registered'
    WHERE NEW.created_at >= c.starts_at
      AND NEW.created_at <= c.ends_at
  LOOP
    INSERT INTO public.contest_submissions
      (contest_id, user_id, problem_slug, submission_id, verdict, points_awarded, penalty_seconds, submitted_at)
    VALUES (
      r.contest_id,
      NEW.user_id,
      NEW.problem_slug,
      NEW.id,
      CASE WHEN NEW.verdict = 'accepted' THEN 'accepted' ELSE NEW.verdict END,
      0,
      0,
      NEW.created_at
    );
    PERFORM public.recompute_contest_leaderboard(r.contest_id);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mirror_code_submission_to_contests
AFTER INSERT ON public.code_submissions
FOR EACH ROW EXECUTE FUNCTION public.mirror_code_submission_to_contests();

-- Register for contest with validation
CREATE OR REPLACE FUNCTION public.register_for_contest(_contest_id uuid, _invite_code text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.contests%ROWTYPE;
  uid uuid := auth.uid();
  cur_count integer;
  reg_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  SELECT * INTO c FROM public.contests WHERE id = _contest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contest not found'; END IF;

  IF c.status NOT IN ('published','live') THEN
    RAISE EXCEPTION 'Registration not open';
  END IF;

  IF c.registration_opens_at IS NOT NULL AND now() < c.registration_opens_at THEN
    RAISE EXCEPTION 'Registration not open yet';
  END IF;
  IF c.registration_closes_at IS NOT NULL AND now() > c.registration_closes_at THEN
    RAISE EXCEPTION 'Registration closed';
  END IF;
  IF c.ends_at < now() THEN
    RAISE EXCEPTION 'Contest already ended';
  END IF;

  IF c.visibility = 'private' AND (_invite_code IS NULL OR _invite_code <> c.invite_code) THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF c.max_participants IS NOT NULL THEN
    SELECT COUNT(*) INTO cur_count
    FROM public.contest_registrations
    WHERE contest_id = _contest_id AND status = 'registered';
    IF cur_count >= c.max_participants THEN
      RAISE EXCEPTION 'Contest is full';
    END IF;
  END IF;

  INSERT INTO public.contest_registrations (contest_id, user_id, status)
  VALUES (_contest_id, uid, 'registered')
  ON CONFLICT (contest_id, user_id) DO UPDATE SET status = 'registered'
  RETURNING id INTO reg_id;

  RETURN reg_id;
END;
$$;

-- =========================================================
-- REALTIME
-- =========================================================
ALTER TABLE public.contests REPLICA IDENTITY FULL;
ALTER TABLE public.contest_problems REPLICA IDENTITY FULL;
ALTER TABLE public.contest_registrations REPLICA IDENTITY FULL;
ALTER TABLE public.contest_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.contest_leaderboard_cache REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.contests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_problems;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_leaderboard_cache;
