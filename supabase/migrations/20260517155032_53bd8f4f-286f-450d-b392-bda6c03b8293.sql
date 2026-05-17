-- 1. Protect reference_query on coding_problem_sql_specs
REVOKE SELECT (reference_query) ON public.coding_problem_sql_specs FROM anon;
REVOKE SELECT (reference_query) ON public.coding_problem_sql_specs FROM authenticated;

GRANT SELECT (
  problem_slug,
  schema_sql,
  seed_sql,
  order_matters,
  starter,
  updated_at
) ON public.coding_problem_sql_specs TO anon, authenticated;

-- 2. Prevent students from tampering with score / integrity_score / violations
CREATE OR REPLACE FUNCTION public.prevent_student_score_tamper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND OLD.user_id = auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin')
     AND NOT public.can_write_org(public.assessment_org(OLD.assessment_id))
  THEN
    IF NEW.score IS DISTINCT FROM OLD.score THEN
      RAISE EXCEPTION 'Students cannot modify score' USING ERRCODE = '42501';
    END IF;
    IF NEW.integrity_score IS DISTINCT FROM OLD.integrity_score THEN
      RAISE EXCEPTION 'Students cannot modify integrity_score' USING ERRCODE = '42501';
    END IF;
    IF NEW.violations IS DISTINCT FROM OLD.violations THEN
      RAISE EXCEPTION 'Students cannot modify violations' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_student_score_tamper ON public.assessment_attempts;
CREATE TRIGGER trg_prevent_student_score_tamper
BEFORE UPDATE ON public.assessment_attempts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_student_score_tamper();

-- 3. Tighten realtime channel authorization (token-bounded match)
DROP POLICY IF EXISTS "Authenticated users scoped channel access" ON realtime.messages;
CREATE POLICY "Authenticated users scoped channel access"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() ~ ('(^|[^0-9a-fA-F-])' || auth.uid()::text || '([^0-9a-fA-F-]|$)')
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.contest_registrations cr
    WHERE cr.user_id = auth.uid()
      AND realtime.topic() ~ ('(^|[^0-9a-fA-F-])' || cr.contest_id::text || '([^0-9a-fA-F-]|$)')
  )
);

DROP POLICY IF EXISTS "Authenticated users scoped channel publish" ON realtime.messages;
CREATE POLICY "Authenticated users scoped channel publish"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() ~ ('(^|[^0-9a-fA-F-])' || auth.uid()::text || '([^0-9a-fA-F-]|$)')
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.contest_registrations cr
    WHERE cr.user_id = auth.uid()
      AND realtime.topic() ~ ('(^|[^0-9a-fA-F-])' || cr.contest_id::text || '([^0-9a-fA-F-]|$)')
  )
);

-- 4. Require authentication to view user/battle achievements
DROP POLICY IF EXISTS "Anyone can view user achievements for public profiles" ON public.user_achievements;
CREATE POLICY "Authenticated users can view user achievements"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "battle achievements public read" ON public.battle_achievements;
CREATE POLICY "Authenticated users can view battle achievements"
ON public.battle_achievements
FOR SELECT
TO authenticated
USING (true);