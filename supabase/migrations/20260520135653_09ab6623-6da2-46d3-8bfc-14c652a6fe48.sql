CREATE OR REPLACE FUNCTION public.prevent_student_score_tamper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow trusted server-side flows (e.g. submit_attempt) to bypass.
  IF current_setting('app.allow_score_update', true) = 'on' THEN
    RETURN NEW;
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.submit_attempt(_attempt uuid)
RETURNS assessment_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Allow this transaction to update score/integrity_score/violations.
  PERFORM set_config('app.allow_score_update', 'on', true);

  FOR r IN
    SELECT aa.id AS answer_id, aa.question_id, aa.answer, q.type, q.points, q.meta
      FROM public.attempt_answers aa
      JOIN public.questions q ON q.id = aa.question_id
     WHERE aa.attempt_id = _attempt
  LOOP
    IF r.type = 'mcq' THEN
      DECLARE
        v_selected uuid[] := COALESCE(ARRAY(SELECT jsonb_array_elements_text(r.answer->'selected'))::uuid[], '{}');
        v_correct  uuid[];
        v_score numeric := 0;
      BEGIN
        SELECT ARRAY(SELECT id FROM public.mcq_options WHERE question_id = r.question_id AND is_correct) INTO v_correct;
        IF v_selected <@ v_correct AND v_correct <@ v_selected AND array_length(v_correct,1) IS NOT NULL THEN
          v_score := r.points;
        END IF;
        UPDATE public.attempt_answers SET auto_score = v_score WHERE id = r.answer_id;
        v_total := v_total + v_score;
      END;

    ELSIF r.type = 'true_false' THEN
      DECLARE
        v_selected uuid[] := COALESCE(ARRAY(SELECT jsonb_array_elements_text(r.answer->'selected'))::uuid[], '{}');
        v_correct  uuid[];
        v_correct_bool boolean;
        v_correct_label text;
        v_score numeric := 0;
      BEGIN
        SELECT ARRAY(SELECT id FROM public.mcq_options WHERE question_id = r.question_id AND is_correct) INTO v_correct;
        IF v_correct IS NULL OR array_length(v_correct,1) IS NULL THEN
          v_correct_bool := COALESCE((r.meta->>'correct')::boolean, NULL);
          IF v_correct_bool IS NOT NULL THEN
            v_correct_label := CASE WHEN v_correct_bool THEN 'true' ELSE 'false' END;
            SELECT ARRAY(SELECT id FROM public.mcq_options
                         WHERE question_id = r.question_id AND lower(btrim(body)) = v_correct_label) INTO v_correct;
          END IF;
        END IF;
        IF v_correct IS NOT NULL AND array_length(v_correct,1) = 1
           AND array_length(v_selected,1) = 1 AND v_selected[1] = v_correct[1] THEN
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
        SELECT expected_output INTO v_expected FROM public.question_test_cases
         WHERE question_id = r.question_id ORDER BY order_index LIMIT 1;
        IF v_expected IS NOT NULL AND btrim(v_given) = btrim(v_expected) THEN
          v_score := r.points;
        END IF;
        UPDATE public.attempt_answers SET auto_score = v_score WHERE id = r.answer_id;
        v_total := v_total + v_score;
      END;

    ELSIF r.type = 'fill_blanks' THEN
      DECLARE
        v_blanks jsonb := COALESCE(r.meta->'blanks', '[]'::jsonb);
        v_given  jsonb := COALESCE(r.answer->'blanks', '{}'::jsonb);
        v_total_b int := 0;
        v_correct int := 0;
        v_score numeric := 0;
        b jsonb;
        b_id text;
        b_answer text;
        b_case boolean;
        b_given text;
      BEGIN
        FOR b IN SELECT * FROM jsonb_array_elements(v_blanks) LOOP
          v_total_b := v_total_b + 1;
          b_id := COALESCE(b->>'id', v_total_b::text);
          b_answer := COALESCE(b->>'answer', '');
          b_case := COALESCE((b->>'case_sensitive')::boolean, false);
          b_given := COALESCE(v_given->>b_id, '');
          IF b_case THEN
            IF btrim(b_given) = btrim(b_answer) AND btrim(b_answer) <> '' THEN
              v_correct := v_correct + 1;
            END IF;
          ELSE
            IF lower(btrim(b_given)) = lower(btrim(b_answer)) AND btrim(b_answer) <> '' THEN
              v_correct := v_correct + 1;
            END IF;
          END IF;
        END LOOP;
        IF v_total_b > 0 THEN
          v_score := round((r.points::numeric * v_correct) / v_total_b, 2);
        END IF;
        UPDATE public.attempt_answers SET auto_score = v_score WHERE id = r.answer_id;
        v_total := v_total + v_score;
      END;

    ELSE
      UPDATE public.attempt_answers SET auto_score = NULL WHERE id = r.answer_id;
    END IF;
  END LOOP;

  UPDATE public.assessment_attempts
     SET status = 'submitted', submitted_at = now(),
         score = v_total, updated_at = now()
   WHERE id = _attempt
   RETURNING * INTO v_attempt;

  UPDATE public.assessment_invites SET status = 'submitted', updated_at = now()
    WHERE id = v_attempt.invite_id;

  RETURN v_attempt;
END;
$function$;