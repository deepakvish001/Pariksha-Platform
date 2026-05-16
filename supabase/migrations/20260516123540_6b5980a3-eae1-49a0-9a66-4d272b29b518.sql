CREATE OR REPLACE FUNCTION public._infer_invite_source(
  p_external_id text, p_name text, p_email text
) RETURNS public.invite_source
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN p_external_id IS NOT NULL
         AND (p_external_id ILIKE 'api\_%' ESCAPE '\' OR p_external_id ILIKE 'api:%')
      THEN 'api'::public.invite_source
    WHEN p_external_id IS NOT NULL
      THEN 'bulk_upload'::public.invite_source
    WHEN p_name IS NULL
      THEN 'link'::public.invite_source
    WHEN p_name IS NOT NULL AND p_email IS NOT NULL
      THEN 'email'::public.invite_source
    ELSE 'manual'::public.invite_source
  END;
$$;
REVOKE ALL ON FUNCTION public._infer_invite_source(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._infer_invite_source(text,text,text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.backfill_assessment_invite_sources()
RETURNS TABLE(updated_count bigint, by_source jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total bigint := 0; v_breakdown jsonb;
BEGIN
  WITH updated AS (
    UPDATE public.assessment_invites AS ai
       SET source = public._infer_invite_source(ai.external_id, ai.name, ai.email),
           updated_at = now()
     WHERE ai.source IS NULL
     RETURNING ai.source
  )
  SELECT COUNT(*)::bigint, COALESCE(jsonb_object_agg(src, cnt), '{}'::jsonb)
    INTO v_total, v_breakdown
  FROM (SELECT source::text src, COUNT(*)::bigint cnt FROM updated GROUP BY source) s;
  RETURN QUERY SELECT v_total, v_breakdown;
END;
$$;

CREATE OR REPLACE FUNCTION public.test_invite_source_heuristics()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_results     jsonb := '[]'::jsonb;
  v_integration jsonb := '[]'::jsonb;
  v_pass int := 0; v_fail int := 0;
  v_actual text; v_expected text; v_case jsonb;
  v_unit_cases jsonb := jsonb_build_array(
    jsonb_build_object('label','bulk_upload: csv:row42',          'ext','csv:row42','name','Alice','email','a@x.io','expected','bulk_upload'),
    jsonb_build_object('label','bulk_upload: import-7 (no name)', 'ext','import-7', 'name',null,   'email','b@x.io','expected','bulk_upload'),
    jsonb_build_object('label','bulk_upload: apix_99 (not api)',  'ext','apix_99',  'name','Bob',  'email','c@x.io','expected','bulk_upload'),
    jsonb_build_object('label','api: api_123',                    'ext','api_123',  'name','Eve',  'email','d@x.io','expected','api'),
    jsonb_build_object('label','api: api:tok',                    'ext','api:tok',  'name',null,   'email','e@x.io','expected','api'),
    jsonb_build_object('label','link: no name, no ext',           'ext',null,       'name',null,   'email','f@x.io','expected','link'),
    jsonb_build_object('label','email: name+email, no ext',       'ext',null,       'name','Dana', 'email','g@x.io','expected','email'),
    jsonb_build_object('label','manual: name only, email NULL',   'ext',null,       'name','Solo', 'email',null,    'expected','manual'),
    jsonb_build_object('label','bulk_upload precedence over name+email', 'ext','xls:5','name','Pri','email','p@x.io','expected','bulk_upload')
  );
BEGIN
  FOR v_case IN SELECT * FROM jsonb_array_elements(v_unit_cases) LOOP
    v_expected := v_case->>'expected';
    v_actual := public._infer_invite_source(v_case->>'ext', v_case->>'name', v_case->>'email')::text;
    IF v_actual = v_expected THEN v_pass := v_pass+1; ELSE v_fail := v_fail+1; END IF;
    v_results := v_results || jsonb_build_object(
      'kind','unit','label',v_case->>'label','expected',v_expected,'actual',v_actual,'pass',v_actual=v_expected
    );
  END LOOP;

  BEGIN
    DECLARE
      v_assessment_id uuid; v_creator uuid; v_check jsonb;
    BEGIN
      SELECT id, created_by INTO v_assessment_id, v_creator
        FROM public.assessments ORDER BY created_at DESC LIMIT 1;

      IF v_assessment_id IS NULL THEN
        v_integration := jsonb_build_array(jsonb_build_object(
          'kind','integration','label','skipped: no assessments available','pass',true
        ));
      ELSE
        ALTER TABLE public.assessment_invites ALTER COLUMN source DROP NOT NULL;
        ALTER TABLE public.assessment_invites ALTER COLUMN source DROP DEFAULT;
        ALTER TABLE public.assessment_invites DISABLE TRIGGER trg_validate_assessment_invite_source;

        -- Seed rows with NULL source. Note: assessment_invites.email is NOT NULL
        -- in this schema, so 'manual' (which requires email IS NULL) is
        -- structurally unreachable for real rows and is only exercised by the
        -- unit test above. Integration focuses on bulk_upload vs the other
        -- reachable categories.
        INSERT INTO public.assessment_invites
          (assessment_id, email, name, external_id, token, status, created_by, source)
        VALUES
          (v_assessment_id, 'bulk1@test.invalid',  'Bulk One',  'csv:row1', '__t_bulk_1',   'pending', v_creator, NULL),
          (v_assessment_id, 'bulk2@test.invalid',  NULL,        'sheet-99', '__t_bulk_2',   'pending', v_creator, NULL),
          (v_assessment_id, 'bulk3@test.invalid',  'Pri',       'xls:5',    '__t_bulk_3',   'pending', v_creator, NULL),
          (v_assessment_id, 'link@test.invalid',   NULL,         NULL,      '__t_link',     'pending', v_creator, NULL),
          (v_assessment_id, 'email@test.invalid',  'Dana',       NULL,      '__t_email',    'pending', v_creator, NULL),
          (v_assessment_id, 'api@test.invalid',    'Api One',   'api_abc',  '__t_api',      'pending', v_creator, NULL),
          (v_assessment_id, 'control@test.invalid','Ctrl',       NULL,      '__t_control',  'pending', v_creator, 'email');

        PERFORM public.backfill_assessment_invite_sources();

        FOR v_check IN
          SELECT jsonb_build_object(
                   'kind','integration','label',label,'expected',expected,
                   'actual',actual::text,'pass', actual::text = expected
                 )
          FROM (
            SELECT 'bulk_upload from csv:row1'                   AS label, 'bulk_upload' AS expected, source AS actual FROM public.assessment_invites WHERE token='__t_bulk_1'
            UNION ALL SELECT 'bulk_upload from sheet-99 (no name)',     'bulk_upload', source FROM public.assessment_invites WHERE token='__t_bulk_2'
            UNION ALL SELECT 'bulk_upload precedence over name+email',  'bulk_upload', source FROM public.assessment_invites WHERE token='__t_bulk_3'
            UNION ALL SELECT 'link when name+ext both null',            'link',        source FROM public.assessment_invites WHERE token='__t_link'
            UNION ALL SELECT 'email when name+email present',           'email',       source FROM public.assessment_invites WHERE token='__t_email'
            UNION ALL SELECT 'api when external_id starts with api_',   'api',         source FROM public.assessment_invites WHERE token='__t_api'
            UNION ALL SELECT 'control row (source=email) preserved',    'email',       source FROM public.assessment_invites WHERE token='__t_control'
          ) t
        LOOP
          IF (v_check->>'pass')::boolean THEN v_pass := v_pass+1; ELSE v_fail := v_fail+1; END IF;
          v_integration := v_integration || v_check;
        END LOOP;

        RAISE EXCEPTION '__rollback_test_fixtures__';
      END IF;
    END;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> '__rollback_test_fixtures__' THEN
      v_integration := v_integration || jsonb_build_object(
        'kind','integration','label','unexpected error: ' || SQLERRM,'pass',false
      );
      v_fail := v_fail + 1;
    END IF;
  END;

  RETURN jsonb_build_object('passed',v_pass,'failed',v_fail,'unit',v_results,'integration',v_integration);
END;
$$;

REVOKE ALL ON FUNCTION public.test_invite_source_heuristics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.test_invite_source_heuristics() TO authenticated, service_role;

DO $$
DECLARE r jsonb;
BEGIN
  r := public.test_invite_source_heuristics();
  IF (r->>'failed')::int > 0 THEN
    RAISE EXCEPTION 'invite source heuristic tests failed: %', r;
  END IF;
  RAISE NOTICE 'invite source heuristic tests passed: % cases', r->>'passed';
END $$;