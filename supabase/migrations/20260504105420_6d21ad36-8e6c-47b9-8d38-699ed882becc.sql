-- Helper: fan out a notification to every admin
CREATE OR REPLACE FUNCTION public.notify_admins(
  _title text,
  _message text,
  _type text DEFAULT 'admin_alert',
  _data jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT ur.user_id, _type, _title, _message, coalesce(_data, '{}'::jsonb)
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
END $$;

-- Trigger fn: similarity pair flagged/DQ'd
CREATE OR REPLACE FUNCTION public.trg_notify_similarity_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ctitle text;
  _name_a text;
  _name_b text;
  _sev text;
BEGIN
  IF NEW.verdict NOT IN ('flag','dq') THEN RETURN NEW; END IF;

  SELECT title INTO _ctitle FROM public.contests WHERE id = NEW.contest_id;
  SELECT full_name INTO _name_a FROM public.profiles WHERE id = NEW.user_a;
  SELECT full_name INTO _name_b FROM public.profiles WHERE id = NEW.user_b;
  _sev := CASE WHEN NEW.verdict = 'dq' THEN 'Auto-DQ' ELSE 'Auto-flag' END;

  PERFORM public.notify_admins(
    format('Contest similarity %s: %s%%', _sev, round(NEW.similarity * 100)),
    format('%s · %s — %s ↔ %s on %s',
      coalesce(_ctitle,'Contest'),
      _sev,
      coalesce(_name_a, substr(NEW.user_a::text,1,8)),
      coalesce(_name_b, substr(NEW.user_b::text,1,8)),
      NEW.problem_slug
    ),
    'contest_similarity_alert',
    jsonb_build_object(
      'contest_id', NEW.contest_id,
      'pair_id', NEW.id,
      'problem_slug', NEW.problem_slug,
      'similarity', NEW.similarity,
      'verdict', NEW.verdict,
      'user_a', NEW.user_a,
      'user_b', NEW.user_b,
      'rationale', NEW.rationale
    )
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_admin_on_similarity ON public.contest_similarity_pairs;
CREATE TRIGGER notify_admin_on_similarity
  AFTER INSERT OR UPDATE OF verdict ON public.contest_similarity_pairs
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_similarity_admin();

-- Trigger fn: viva queue insert (auto source)
CREATE OR REPLACE FUNCTION public.trg_notify_viva_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ctitle text;
  _uname text;
BEGIN
  -- Only auto-enrollments (similarity flag, identity, etc.)
  IF NEW.source <> 'auto' THEN RETURN NEW; END IF;

  SELECT title INTO _ctitle FROM public.contests WHERE id = NEW.contest_id;
  SELECT full_name INTO _uname FROM public.profiles WHERE id = NEW.user_id;

  PERFORM public.notify_admins(
    format('Viva queue: %s flagged for review',
      coalesce(_uname, substr(NEW.user_id::text,1,8))),
    format('%s · Reason: %s%s',
      coalesce(_ctitle,'Contest'),
      NEW.reason,
      CASE WHEN NEW.problem_slug IS NOT NULL THEN ' (problem: '||NEW.problem_slug||')' ELSE '' END
    ),
    'contest_viva_alert',
    jsonb_build_object(
      'contest_id', NEW.contest_id,
      'viva_id', NEW.id,
      'user_id', NEW.user_id,
      'problem_slug', NEW.problem_slug,
      'reason', NEW.reason
    )
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_admin_on_viva ON public.contest_viva_queue;
CREATE TRIGGER notify_admin_on_viva
  AFTER INSERT ON public.contest_viva_queue
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_viva_admin();

-- Trigger fn: identity failure (>=95% confidence of mismatch i.e. failed verdict)
CREATE OR REPLACE FUNCTION public.trg_notify_identity_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ctitle text;
  _uname text;
BEGIN
  IF NEW.verdict <> 'failed' THEN RETURN NEW; END IF;

  SELECT title INTO _ctitle FROM public.contests WHERE id = NEW.contest_id;
  SELECT full_name INTO _uname FROM public.profiles WHERE id = NEW.user_id;

  PERFORM public.notify_admins(
    format('Identity check failed: %s',
      coalesce(_uname, substr(NEW.user_id::text,1,8))),
    format('%s · Match score: %s · %s',
      coalesce(_ctitle,'Contest'),
      coalesce(round(NEW.match_score * 100)::text || '%','n/a'),
      coalesce(NEW.reasoning,'no reasoning')
    ),
    'contest_identity_alert',
    jsonb_build_object(
      'contest_id', NEW.contest_id,
      'check_id', NEW.id,
      'user_id', NEW.user_id,
      'session_id', NEW.session_id,
      'kind', NEW.kind,
      'match_score', NEW.match_score
    )
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_admin_on_identity_fail ON public.contest_identity_checks;
CREATE TRIGGER notify_admin_on_identity_fail
  AFTER INSERT ON public.contest_identity_checks
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_identity_admin();