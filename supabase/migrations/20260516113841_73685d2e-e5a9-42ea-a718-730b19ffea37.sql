
CREATE OR REPLACE FUNCTION public.get_assessment_answer_key(_assessment uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid;
  _result jsonb := '{}'::jsonb;
  _r record;
  _ans jsonb;
BEGIN
  SELECT org_id INTO _org FROM assessments WHERE id = _assessment;
  IF _org IS NULL THEN RAISE EXCEPTION 'Assessment not found'; END IF;
  IF NOT is_org_member(_org) THEN RAISE EXCEPTION 'Not authorized'; END IF;

  FOR _r IN
    SELECT q.id, q.type, q.meta, q.starter_code, q.title
    FROM assessment_sections s
    JOIN section_questions sq ON sq.section_id = s.id
    JOIN questions q ON q.id = sq.question_id
    WHERE s.assessment_id = _assessment
  LOOP
    IF _r.type = 'mcq' THEN
      SELECT jsonb_build_object('selected', COALESCE(jsonb_agg(o.id::text), '[]'::jsonb))
        INTO _ans
        FROM mcq_options o
       WHERE o.question_id = _r.id AND o.is_correct = true;
    ELSIF _r.type = 'true_false' THEN
      SELECT jsonb_build_object('selected', jsonb_build_array(o.id::text))
        INTO _ans
        FROM mcq_options o
       WHERE o.question_id = _r.id
         AND lower(o.body) = lower(CASE WHEN COALESCE((_r.meta->>'correct')::boolean, true) THEN 'true' ELSE 'false' END)
       LIMIT 1;
    ELSIF _r.type = 'short_answer' THEN
      _ans := jsonb_build_object('text', COALESCE(_r.meta->'accepted'->>0, ''));
    ELSIF _r.type = 'matching' THEN
      _ans := jsonb_build_object(
        'pairs',
        COALESCE((
          SELECT jsonb_object_agg(p->>'left', p->>'right')
          FROM jsonb_array_elements(_r.meta->'pairs') p
        ), '{}'::jsonb)
      );
    ELSIF _r.type = 'subjective' THEN
      _ans := jsonb_build_object('text', COALESCE(_r.meta->>'solution',
        'Sample answer: ' || _r.title || '. This is a prefilled response covering the key points expected for end-to-end testing.'));
    ELSIF _r.type = 'sql' THEN
      _ans := jsonb_build_object(
        'query', COALESCE(_r.meta->>'solution', '-- write your query'),
        'output', COALESCE((SELECT expected_output FROM question_test_cases WHERE question_id = _r.id ORDER BY order_index LIMIT 1), '')
      );
    ELSIF _r.type = 'coding' THEN
      _ans := jsonb_build_object(
        'code', COALESCE(_r.meta->>'solution', _r.starter_code, ''),
        'language', (SELECT language FROM questions WHERE id = _r.id)
      );
    ELSE
      _ans := '{}'::jsonb;
    END IF;

    _result := _result || jsonb_build_object(_r.id::text, COALESCE(_ans, '{}'::jsonb));
  END LOOP;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_assessment_answer_key(uuid) TO authenticated;
