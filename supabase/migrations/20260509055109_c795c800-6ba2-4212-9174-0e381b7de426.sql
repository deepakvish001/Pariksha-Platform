
-- Returns the paper for a student's attempt without leaking is_correct
CREATE OR REPLACE FUNCTION public.get_attempt_paper(_attempt uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_attempt public.assessment_attempts%ROWTYPE;
  v_result jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_attempt FROM public.assessment_attempts WHERE id = _attempt;
  IF NOT FOUND THEN RAISE EXCEPTION 'attempt_not_found'; END IF;
  IF v_attempt.user_id <> v_user THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT jsonb_build_object(
    'attempt', to_jsonb(v_attempt),
    'assessment', (SELECT to_jsonb(a) FROM public.assessments a WHERE a.id = v_attempt.assessment_id),
    'sections', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'description', s.description,
        'order_index', s.order_index,
        'questions', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', q.id,
            'type', q.type,
            'title', q.title,
            'body_md', q.body_md,
            'language', q.language,
            'starter_code', q.starter_code,
            'points', q.points,
            'order_index', sq.order_index,
            'options', CASE WHEN q.type = 'mcq' THEN COALESCE((
              SELECT jsonb_agg(jsonb_build_object('id', o.id, 'body', o.body, 'order_index', o.order_index)
                ORDER BY o.order_index)
              FROM public.mcq_options o WHERE o.question_id = q.id
            ), '[]'::jsonb) ELSE NULL END,
            'sample_tests', CASE WHEN q.type IN ('coding','sql') THEN COALESCE((
              SELECT jsonb_agg(jsonb_build_object('input', t.input, 'expected_output', t.expected_output)
                ORDER BY t.order_index)
              FROM public.question_test_cases t
              WHERE t.question_id = q.id AND t.is_hidden = false
            ), '[]'::jsonb) ELSE NULL END
          ) ORDER BY sq.order_index)
          FROM public.section_questions sq
          JOIN public.questions q ON q.id = sq.question_id
          WHERE sq.section_id = s.id
        ), '[]'::jsonb)
      ) ORDER BY s.order_index)
      FROM public.assessment_sections s WHERE s.assessment_id = v_attempt.assessment_id
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_attempt_paper(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_attempt_paper(uuid) TO authenticated;

-- Submit attempt: auto-score MCQ + SQL (exact-match), mark coding/subjective for manual review
CREATE OR REPLACE FUNCTION public.submit_attempt(_attempt uuid)
RETURNS public.assessment_attempts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_attempt public.assessment_attempts%ROWTYPE;
  v_total numeric := 0;
  r record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_attempt FROM public.assessment_attempts WHERE id = _attempt FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'attempt_not_found'; END IF;
  IF v_attempt.user_id <> v_user THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_attempt.status <> 'in_progress' THEN RETURN v_attempt; END IF;

  -- Score each answered question
  FOR r IN
    SELECT aa.id AS answer_id, aa.question_id, aa.answer, q.type, q.points
    FROM public.attempt_answers aa
    JOIN public.questions q ON q.id = aa.question_id
    WHERE aa.attempt_id = _attempt
  LOOP
    IF r.type = 'mcq' THEN
      DECLARE
        v_selected uuid[] := COALESCE(ARRAY(SELECT jsonb_array_elements_text(r.answer->'selected'))::uuid[], '{}');
        v_correct uuid[];
        v_score numeric := 0;
      BEGIN
        SELECT ARRAY(SELECT id FROM public.mcq_options WHERE question_id = r.question_id AND is_correct) INTO v_correct;
        IF v_selected <@ v_correct AND v_correct <@ v_selected AND array_length(v_correct,1) IS NOT NULL THEN
          v_score := r.points;
        END IF;
        UPDATE public.attempt_answers SET auto_score = v_score WHERE id = r.answer_id;
        v_total := v_total + v_score;
      END;
    ELSIF r.type = 'sql' THEN
      -- Naive exact-match against the first non-hidden expected_output for MVP
      DECLARE
        v_expected text;
        v_given text := COALESCE(r.answer->>'output', '');
        v_score numeric := 0;
      BEGIN
        SELECT expected_output INTO v_expected
          FROM public.question_test_cases
          WHERE question_id = r.question_id
          ORDER BY order_index LIMIT 1;
        IF v_expected IS NOT NULL AND btrim(v_given) = btrim(v_expected) THEN
          v_score := r.points;
        END IF;
        UPDATE public.attempt_answers SET auto_score = v_score WHERE id = r.answer_id;
        v_total := v_total + v_score;
      END;
    ELSE
      -- coding & subjective: leave for manual grading
      UPDATE public.attempt_answers SET auto_score = NULL WHERE id = r.answer_id;
    END IF;
  END LOOP;

  UPDATE public.assessment_attempts
    SET status = 'submitted',
        submitted_at = now(),
        score = v_total,
        updated_at = now()
    WHERE id = _attempt
    RETURNING * INTO v_attempt;

  -- Mark invite submitted
  UPDATE public.assessment_invites SET status = 'submitted', updated_at = now()
    WHERE id = v_attempt.invite_id;

  RETURN v_attempt;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_attempt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_attempt(uuid) TO authenticated;
