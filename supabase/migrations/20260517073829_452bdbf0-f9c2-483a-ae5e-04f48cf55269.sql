ALTER TABLE public.attempt_answers ADD COLUMN IF NOT EXISTS grader_comment text;

CREATE OR REPLACE FUNCTION public.get_attempt_results(_attempt uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_attempt public.assessment_attempts%ROWTYPE;
  v_org uuid;
  v_results jsonb := '[]'::jsonb;
  r record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT * INTO v_attempt FROM public.assessment_attempts WHERE id = _attempt;
  IF NOT FOUND THEN RAISE EXCEPTION 'attempt_not_found'; END IF;

  -- Authorization: owner of the attempt OR org member of the assessment
  v_org := public.attempt_assessment_org(_attempt);
  IF v_attempt.user_id <> v_user AND NOT public.is_org_member(v_org) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR r IN
    SELECT
      q.id AS question_id,
      q.type::text AS type,
      q.title,
      q.body_md,
      q.points,
      q.meta,
      sq.order_index AS order_index,
      sec.id AS section_id,
      sec.title AS section_title,
      sec.order_index AS section_order,
      aa.id AS answer_id,
      aa.answer,
      aa.auto_score,
      aa.manual_score,
      aa.grader_comment,
      CASE
        WHEN q.type IN ('mcq','true_false') THEN (
          SELECT jsonb_agg(jsonb_build_object(
            'id', o.id,
            'body', o.body,
            'is_correct', o.is_correct,
            'order_index', o.order_index
          ) ORDER BY o.order_index)
          FROM public.mcq_options o WHERE o.question_id = q.id
        )
        ELSE NULL
      END AS options,
      CASE
        WHEN q.type = 'sql' THEN (
          SELECT t.expected_output FROM public.question_test_cases t
          WHERE t.question_id = q.id ORDER BY t.order_index LIMIT 1
        )
        ELSE NULL
      END AS expected_output
    FROM public.assessment_sections sec
    JOIN public.section_questions sq ON sq.section_id = sec.id
    JOIN public.questions q ON q.id = sq.question_id
    LEFT JOIN public.attempt_answers aa
           ON aa.question_id = q.id AND aa.attempt_id = _attempt
    WHERE sec.assessment_id = v_attempt.assessment_id
    ORDER BY sec.order_index, sq.order_index
  LOOP
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'question_id', r.question_id,
      'type', r.type,
      'title', r.title,
      'body_md', r.body_md,
      'points', r.points,
      'meta', r.meta,
      'order_index', r.order_index,
      'section_id', r.section_id,
      'section_title', r.section_title,
      'section_order', r.section_order,
      'answer', r.answer,
      'auto_score', r.auto_score,
      'manual_score', r.manual_score,
      'grader_comment', r.grader_comment,
      'options', r.options,
      'expected_output', r.expected_output
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt.id,
    'status', v_attempt.status,
    'score', v_attempt.score,
    'results', v_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_attempt_results(uuid) TO authenticated;