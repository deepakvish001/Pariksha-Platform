-- Read-only preview of an assessment invite. Returns enough information for a
-- candidate to decide to start, but does NOT claim the invite or create an
-- attempt. The existing claim_assessment_invite RPC remains the only path
-- that has side-effects.
CREATE OR REPLACE FUNCTION public.preview_assessment_invite(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_invite public.assessment_invites%ROWTYPE;
  v_assessment public.assessments%ROWTYPE;
  v_org public.organizations%ROWTYPE;
  v_sections jsonb;
BEGIN
  IF _token IS NULL OR length(_token) = 0 THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT * INTO v_invite FROM public.assessment_invites WHERE token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object(
      'status', 'expired',
      'invited_email', v_invite.email
    );
  END IF;

  SELECT * INTO v_assessment FROM public.assessments WHERE id = v_invite.assessment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT * INTO v_org FROM public.organizations WHERE id = v_assessment.org_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'description', s.description,
        'order_index', s.order_index,
        'question_count', (
          SELECT count(*) FROM public.section_questions sq WHERE sq.section_id = s.id
        )
      )
      ORDER BY s.order_index
    ),
    '[]'::jsonb
  )
  INTO v_sections
  FROM public.assessment_sections s
  WHERE s.assessment_id = v_assessment.id;

  RETURN jsonb_build_object(
    'status', 'ok',
    'invited_email', v_invite.email,
    'invite_status', v_invite.status,
    'org', jsonb_build_object(
      'id', v_org.id,
      'name', v_org.name,
      'logo_url', v_org.logo_url,
      'brand_color', v_org.brand_color
    ),
    'assessment', jsonb_build_object(
      'id', v_assessment.id,
      'slug', v_assessment.slug,
      'title', v_assessment.title,
      'description', v_assessment.description,
      'duration_min', v_assessment.duration_min,
      'max_attempts', v_assessment.max_attempts,
      'proctoring_enabled', v_assessment.proctoring_enabled,
      'proctoring_config', v_assessment.proctoring_config,
      'show_results_to_candidate', v_assessment.show_results_to_candidate,
      'starts_at', v_assessment.starts_at,
      'ends_at', v_assessment.ends_at,
      'status', v_assessment.status,
      'brand_color', v_assessment.brand_color
    ),
    'sections', v_sections
  );
END;
$$;

REVOKE ALL ON FUNCTION public.preview_assessment_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_assessment_invite(text) TO anon, authenticated;