-- 1) Extend validate_contest_submission with a side-camera check.
CREATE OR REPLACE FUNCTION public.validate_contest_submission(_contest_id uuid, _problem_slug text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.contests%ROWTYPE;
  reg_status text;
  has_session boolean;
  last_chunk timestamptz;
  latest_score integer;
  total_typed integer;
  burst_count integer;
  side_required boolean;
  side_status text;
  last_side_hb timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unauth', 'message', 'Sign in required');
  END IF;

  SELECT * INTO c FROM public.contests WHERE id = _contest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'no_contest', 'message', 'Contest not found');
  END IF;

  IF now() < c.starts_at THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_started', 'message', 'Contest has not started');
  END IF;
  IF now() >= c.ends_at THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ended', 'message', 'Contest has ended');
  END IF;

  SELECT status INTO reg_status
  FROM public.contest_registrations
  WHERE contest_id = _contest_id AND user_id = auth.uid();
  IF reg_status IS NULL OR reg_status <> 'registered' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_registered', 'message', 'You are not registered for this contest');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.contest_sessions
    WHERE contest_id = _contest_id
      AND user_id = auth.uid()
      AND is_active = true
      AND (last_heartbeat_at IS NULL OR last_heartbeat_at > now() - INTERVAL '45 seconds')
  ) INTO has_session;
  IF NOT has_session THEN
    RETURN jsonb_build_object('ok', false, 'code', 'no_session',
      'message', 'No active secure session — heartbeat missing');
  END IF;

  IF c.require_screen_share THEN
    SELECT MAX(started_at) INTO last_chunk
    FROM public.contest_screen_recordings
    WHERE contest_id = _contest_id AND user_id = auth.uid();
    IF last_chunk IS NULL OR last_chunk < now() - INTERVAL '90 seconds' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'no_screen_share',
        'message', 'Screen sharing is required and was not detected recently');
    END IF;
  END IF;

  -- Side camera requirement
  SELECT cs.side_camera_required, cs.side_camera_status
    INTO side_required, side_status
  FROM public.contest_sessions cs
  WHERE cs.contest_id = _contest_id
    AND cs.user_id = auth.uid()
    AND cs.is_active = true
  ORDER BY cs.created_at DESC
  LIMIT 1;

  IF side_required THEN
    IF side_status IS DISTINCT FROM 'active' THEN
      -- Allow a brief grace if a recent heartbeat exists on any pairing for this session
      SELECT MAX(last_heartbeat_at) INTO last_side_hb
      FROM public.contest_side_camera_pairings p
      JOIN public.contest_sessions s ON s.id = p.session_id
      WHERE s.contest_id = _contest_id AND s.user_id = auth.uid();

      IF last_side_hb IS NULL OR last_side_hb < now() - INTERVAL '60 seconds' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'no_side_camera',
          'message', 'Your phone (Second Eye) is not connected. Re-pair it and try again.');
      END IF;
    END IF;
  END IF;

  -- Paste-only check
  SELECT COALESCE(SUM(char_count), 0), COALESCE(SUM(CASE WHEN is_burst THEN 1 ELSE 0 END), 0)
    INTO total_typed, burst_count
    FROM public.contest_typing_events
   WHERE contest_id = _contest_id
     AND user_id = auth.uid()
     AND problem_slug = _problem_slug
     AND created_at > now() - interval '24 hours';

  IF total_typed = 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'paste_only',
      'message', 'No typing detected for this problem — pasted submissions are blocked');
  END IF;

  SELECT score INTO latest_score
  FROM public.contest_trust_scores
  WHERE contest_id = _contest_id AND user_id = auth.uid()
  ORDER BY computed_at DESC LIMIT 1;
  IF latest_score IS NOT NULL AND latest_score < c.min_trust_score THEN
    RETURN jsonb_build_object('ok', false, 'code', 'low_trust',
      'message', format('Trust score %s is below contest minimum %s', latest_score, c.min_trust_score));
  END IF;

  RETURN jsonb_build_object('ok', true, 'burst_count', burst_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_contest_submission(uuid, text) TO authenticated;

-- 2) Stale-heartbeat sweep
CREATE OR REPLACE FUNCTION public.sideeye_sweep_stale_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_pairings int := 0;
  changed_sessions int := 0;
  notified int := 0;
  rec record;
  admin_id uuid;
BEGIN
  -- Mark pairings as lost
  UPDATE public.contest_side_camera_pairings
  SET status = 'lost', updated_at = now()
  WHERE status = 'active'
    AND last_heartbeat_at IS NOT NULL
    AND last_heartbeat_at < now() - INTERVAL '30 seconds';
  GET DIAGNOSTICS changed_pairings = ROW_COUNT;

  -- Find sessions whose only/most recent pairing went stale and were 'active'
  FOR rec IN
    SELECT DISTINCT cs.id AS session_id, cs.contest_id, cs.user_id
    FROM public.contest_sessions cs
    WHERE cs.is_active = true
      AND cs.side_camera_required = true
      AND cs.side_camera_status = 'active'
      AND NOT EXISTS (
        SELECT 1
        FROM public.contest_side_camera_pairings p
        WHERE p.session_id = cs.id
          AND p.last_heartbeat_at IS NOT NULL
          AND p.last_heartbeat_at > now() - INTERVAL '30 seconds'
      )
  LOOP
    UPDATE public.contest_sessions
    SET side_camera_status = 'disconnected'
    WHERE id = rec.session_id;
    changed_sessions := changed_sessions + 1;

    INSERT INTO public.contest_side_camera_audit_logs
      (session_id, user_id, event_type, severity, detail)
    VALUES (rec.session_id, rec.user_id, 'stream_lost', 'warn',
      jsonb_build_object('reason', 'heartbeat_stale', 'window_seconds', 30));

    -- Notify admins (use existing notifications schema: title/message/data)
    FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        admin_id,
        'contest_sideeye_disconnected',
        'Side camera disconnected',
        'A candidate''s Second Eye stream went silent for 30s+ during a live contest.',
        jsonb_build_object(
          'session_id', rec.session_id,
          'contest_id', rec.contest_id,
          'user_id', rec.user_id
        )
      );
      notified := notified + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'changed_pairings', changed_pairings,
    'changed_sessions', changed_sessions,
    'admin_notifications', notified,
    'ran_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sideeye_sweep_stale_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sideeye_sweep_stale_status() TO service_role;