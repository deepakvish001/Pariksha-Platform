-- 1) Update get_attempt_paper to mark premium questions as locked for non-premium users
CREATE OR REPLACE FUNCTION public.get_attempt_paper(_attempt uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_attempt public.assessment_attempts%ROWTYPE;
  v_is_premium boolean;
  v_result jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_attempt FROM public.assessment_attempts WHERE id = _attempt;
  IF NOT FOUND THEN RAISE EXCEPTION 'attempt_not_found'; END IF;
  IF v_attempt.user_id <> v_user THEN RAISE EXCEPTION 'forbidden'; END IF;

  v_is_premium := public.user_is_premium(v_user);

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
            'title', CASE WHEN q.tier = 'premium' AND NOT v_is_premium THEN '🔒 Premium question' ELSE q.title END,
            'body_md', CASE WHEN q.tier = 'premium' AND NOT v_is_premium
                THEN 'This question requires Premium access. Please upgrade to attempt it.'
                ELSE q.body_md END,
            'language', q.language,
            'starter_code', CASE WHEN q.tier = 'premium' AND NOT v_is_premium THEN NULL ELSE q.starter_code END,
            'points', q.points,
            'order_index', sq.order_index,
            'meta', CASE WHEN q.tier = 'premium' AND NOT v_is_premium
                THEN jsonb_build_object('locked', true, 'tier', 'premium')
                ELSE COALESCE(q.meta, '{}'::jsonb) || jsonb_build_object('tier', COALESCE(q.tier, 'free')) END,
            'options', CASE
              WHEN q.tier = 'premium' AND NOT v_is_premium THEN '[]'::jsonb
              WHEN q.type IN ('mcq','true_false') THEN COALESCE((
                SELECT jsonb_agg(jsonb_build_object('id', o.id, 'body', o.body, 'order_index', o.order_index)
                  ORDER BY o.order_index)
                FROM public.mcq_options o WHERE o.question_id = q.id
              ), '[]'::jsonb) ELSE NULL END,
            'sample_tests', CASE
              WHEN q.tier = 'premium' AND NOT v_is_premium THEN '[]'::jsonb
              WHEN q.type IN ('coding','sql') THEN COALESCE((
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

-- 2) Trigger to block non-premium candidates from answering premium questions
CREATE OR REPLACE FUNCTION public.enforce_premium_answer_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid;
  v_tier text;
BEGIN
  SELECT user_id INTO v_user FROM public.assessment_attempts WHERE id = NEW.attempt_id;
  IF v_user IS NULL THEN RETURN NEW; END IF;

  SELECT tier INTO v_tier FROM public.questions WHERE id = NEW.question_id;
  IF v_tier = 'premium' AND NOT public.user_is_premium(v_user) THEN
    RAISE EXCEPTION 'premium_required: this question requires Premium access'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS attempt_answers_premium_gate ON public.attempt_answers;
CREATE TRIGGER attempt_answers_premium_gate
BEFORE INSERT OR UPDATE ON public.attempt_answers
FOR EACH ROW EXECUTE FUNCTION public.enforce_premium_answer_access();