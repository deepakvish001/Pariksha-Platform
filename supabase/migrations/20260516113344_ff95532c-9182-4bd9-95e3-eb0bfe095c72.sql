
-- 1) Allow org writers to launch a self-preview attempt
CREATE OR REPLACE FUNCTION public.start_preview_attempt(_assessment uuid)
RETURNS public.assessment_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_org  uuid;
  v_attempt public.assessment_attempts%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT org_id INTO v_org FROM public.assessments WHERE id = _assessment;
  IF v_org IS NULL THEN RAISE EXCEPTION 'assessment_not_found'; END IF;
  IF NOT public.can_write_org(v_org) THEN RAISE EXCEPTION 'forbidden'; END IF;

  -- Reuse an existing in-progress preview attempt if any
  SELECT * INTO v_attempt
    FROM public.assessment_attempts
   WHERE assessment_id = _assessment
     AND user_id = v_user
     AND status = 'in_progress'
   ORDER BY started_at DESC LIMIT 1;
  IF FOUND THEN RETURN v_attempt; END IF;

  INSERT INTO public.assessment_attempts (assessment_id, user_id, invite_id, status)
  VALUES (_assessment, v_user, NULL, 'in_progress')
  RETURNING * INTO v_attempt;
  RETURN v_attempt;
END;
$$;

-- 2) Auto-score new question types
CREATE OR REPLACE FUNCTION public.submit_attempt(_attempt uuid)
RETURNS public.assessment_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  FOR r IN
    SELECT aa.id AS answer_id, aa.question_id, aa.answer, q.type, q.points, q.meta
      FROM public.attempt_answers aa
      JOIN public.questions q ON q.id = aa.question_id
     WHERE aa.attempt_id = _attempt
  LOOP
    IF r.type IN ('mcq', 'true_false') THEN
      DECLARE
        v_selected uuid[] := COALESCE(ARRAY(SELECT jsonb_array_elements_text(r.answer->'selected'))::uuid[], '{}');
        v_correct  uuid[];
        v_score numeric := 0;
      BEGIN
        SELECT ARRAY(SELECT id FROM public.mcq_options WHERE question_id = r.question_id AND is_correct)
          INTO v_correct;
        IF v_selected <@ v_correct AND v_correct <@ v_selected AND array_length(v_correct,1) IS NOT NULL THEN
          v_score := r.points;
        END IF;
        UPDATE public.attempt_answers SET auto_score = v_score WHERE id = r.answer_id;
        v_total := v_total + v_score;
      END;

    ELSIF r.type = 'sql' THEN
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

    ELSIF r.type = 'short_answer' THEN
      DECLARE
        v_given text := COALESCE(r.answer->>'text', '');
        v_case  boolean := COALESCE((r.meta->>'case_sensitive')::boolean, false);
        v_match boolean := false;
        v_norm  text;
        v_acc   text;
        v_score numeric := 0;
      BEGIN
        v_norm := btrim(v_given);
        IF NOT v_case THEN v_norm := lower(v_norm); END IF;
        FOR v_acc IN SELECT jsonb_array_elements_text(COALESCE(r.meta->'accepted', '[]'::jsonb)) LOOP
          IF (CASE WHEN v_case THEN btrim(v_acc) ELSE lower(btrim(v_acc)) END) = v_norm THEN
            v_match := true; EXIT;
          END IF;
        END LOOP;
        IF v_match THEN v_score := r.points; END IF;
        UPDATE public.attempt_answers SET auto_score = v_score WHERE id = r.answer_id;
        v_total := v_total + v_score;
      END;

    ELSIF r.type = 'matching' THEN
      DECLARE
        v_pairs jsonb := COALESCE(r.meta->'pairs', '[]'::jsonb);
        v_given jsonb := COALESCE(r.answer->'pairs', '{}'::jsonb); -- { left: right }
        v_total_pairs int := 0;
        v_correct int := 0;
        v_score numeric := 0;
        p jsonb;
      BEGIN
        FOR p IN SELECT * FROM jsonb_array_elements(v_pairs) LOOP
          v_total_pairs := v_total_pairs + 1;
          IF COALESCE(v_given->>(p->>'left'), '') = COALESCE(p->>'right', '') THEN
            v_correct := v_correct + 1;
          END IF;
        END LOOP;
        IF v_total_pairs > 0 AND v_correct = v_total_pairs THEN
          v_score := r.points;
        END IF;
        UPDATE public.attempt_answers SET auto_score = v_score WHERE id = r.answer_id;
        v_total := v_total + v_score;
      END;

    ELSE
      -- coding & subjective: manual grading
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

  UPDATE public.assessment_invites SET status = 'submitted', updated_at = now()
    WHERE id = v_attempt.invite_id;

  RETURN v_attempt;
END;
$$;

-- 3) Expose question.meta and options for true_false in the paper
CREATE OR REPLACE FUNCTION public.get_attempt_paper(_attempt uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
            'meta', q.meta,
            'options', CASE WHEN q.type IN ('mcq','true_false') THEN COALESCE((
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
