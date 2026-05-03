
-- 1) Visibility: registered contestants can read draft problems attached to a live contest

CREATE POLICY "Registered contestants read live contest problems"
ON public.coding_problems FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contest_problems cp
    JOIN public.contests c ON c.id = cp.contest_id
    JOIN public.contest_registrations r
      ON r.contest_id = c.id
     AND r.user_id = auth.uid()
     AND r.status = 'registered'
    WHERE cp.problem_slug = coding_problems.slug
      AND c.status = 'live'
      AND now() BETWEEN c.starts_at AND c.ends_at
  )
);

CREATE POLICY "Registered contestants read live contest starter code"
ON public.coding_problem_starter_code FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contest_problems cp
    JOIN public.contests c ON c.id = cp.contest_id
    JOIN public.contest_registrations r
      ON r.contest_id = c.id
     AND r.user_id = auth.uid()
     AND r.status = 'registered'
    WHERE cp.problem_slug = coding_problem_starter_code.problem_slug
      AND c.status = 'live'
      AND now() BETWEEN c.starts_at AND c.ends_at
  )
);

CREATE POLICY "Registered contestants read live contest sample tests"
ON public.coding_problem_tests FOR SELECT
TO authenticated
USING (
  kind = 'sample' AND EXISTS (
    SELECT 1
    FROM public.contest_problems cp
    JOIN public.contests c ON c.id = cp.contest_id
    JOIN public.contest_registrations r
      ON r.contest_id = c.id
     AND r.user_id = auth.uid()
     AND r.status = 'registered'
    WHERE cp.problem_slug = coding_problem_tests.problem_slug
      AND c.status = 'live'
      AND now() BETWEEN c.starts_at AND c.ends_at
  )
);

CREATE POLICY "Registered contestants read live contest sql specs"
ON public.coding_problem_sql_specs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contest_problems cp
    JOIN public.contests c ON c.id = cp.contest_id
    JOIN public.contest_registrations r
      ON r.contest_id = c.id
     AND r.user_id = auth.uid()
     AND r.status = 'registered'
    WHERE cp.problem_slug = coding_problem_sql_specs.problem_slug
      AND c.status = 'live'
      AND now() BETWEEN c.starts_at AND c.ends_at
  )
);

-- 2) Helper RPC: admin attaches a problem to a contest

CREATE OR REPLACE FUNCTION public.attach_problem_to_contest(
  _problem_slug text,
  _contest_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.contest_problems%ROWTYPE;
  v_next_order int;
  v_inserted public.contest_problems%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.coding_problems WHERE slug = _problem_slug) THEN
    RAISE EXCEPTION 'problem not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.contests WHERE id = _contest_id) THEN
    RAISE EXCEPTION 'contest not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_existing
  FROM public.contest_problems
  WHERE contest_id = _contest_id AND problem_slug = _problem_slug;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_attached', true,
      'contest_id', v_existing.contest_id,
      'problem_slug', v_existing.problem_slug,
      'order_index', v_existing.order_index
    );
  END IF;

  SELECT COALESCE(MAX(order_index) + 1, 0) INTO v_next_order
  FROM public.contest_problems
  WHERE contest_id = _contest_id;

  INSERT INTO public.contest_problems (contest_id, problem_slug, order_index, points)
  VALUES (_contest_id, _problem_slug, v_next_order, 100)
  RETURNING * INTO v_inserted;

  RETURN jsonb_build_object(
    'ok', true,
    'already_attached', false,
    'contest_id', v_inserted.contest_id,
    'problem_slug', v_inserted.problem_slug,
    'order_index', v_inserted.order_index
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_problem_to_contest(text, uuid) TO authenticated;
