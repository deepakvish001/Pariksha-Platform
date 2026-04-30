
CREATE OR REPLACE FUNCTION public.admin_set_gamification_rule(
  _key text, _value jsonb, _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _full_key text;
  _short    text;
  _old      jsonb;
  _num      numeric;
  _spec     record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF _key IS NULL OR length(btrim(_key)) = 0 THEN
    RAISE EXCEPTION 'Rule key is required';
  END IF;

  _short := regexp_replace(btrim(_key), '^gamification\.', '');
  _full_key := 'gamification.' || _short;

  -- Allow-list with per-key value constraints
  -- (short_key, json_type, min, max, integer_only)
  WITH allowed(k, t, lo, hi, intonly) AS (
    VALUES
      ('xp_per_quiz_correct',  'number', 0::numeric,    100::numeric, true),
      ('xp_per_problem_easy',  'number', 0,             500,          true),
      ('xp_per_problem_medium','number', 0,             500,          true),
      ('xp_per_problem_hard',  'number', 0,            1000,          true),
      ('xp_per_srs_review',    'number', 0,             100,          true),
      ('xp_per_streak_day',    'number', 0,             500,          true),
      ('xp_per_achievement',   'number', 0,            1000,          true),
      ('level_xp_multiplier',  'number', 0.1,            10,          false),
      ('daily_xp_cap',         'number', 0,          100000,          true),
      ('weekly_xp_cap',        'number', 0,          500000,          true)
  )
  SELECT k, t, lo, hi, intonly INTO _spec FROM allowed WHERE k = _short;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown rule key: %. Allowed keys: xp_per_quiz_correct, xp_per_problem_easy, xp_per_problem_medium, xp_per_problem_hard, xp_per_srs_review, xp_per_streak_day, xp_per_achievement, level_xp_multiplier, daily_xp_cap, weekly_xp_cap', _short;
  END IF;

  IF _value IS NULL OR jsonb_typeof(_value) <> _spec.t THEN
    RAISE EXCEPTION 'Value for % must be a JSON %', _short, _spec.t;
  END IF;

  _num := (_value)::text::numeric;

  IF _num < _spec.lo OR _num > _spec.hi THEN
    RAISE EXCEPTION 'Value for % must be between % and %', _short, _spec.lo, _spec.hi;
  END IF;

  IF _spec.intonly AND _num <> floor(_num) THEN
    RAISE EXCEPTION 'Value for % must be a whole number', _short;
  END IF;

  IF _note IS NOT NULL AND length(_note) > 500 THEN
    RAISE EXCEPTION 'Note must be 500 characters or fewer';
  END IF;

  -- Re-encode to canonical JSON number (drops accidental string-y casing)
  _value := to_jsonb(_num);

  SELECT value INTO _old FROM public.platform_settings WHERE key = _full_key;

  -- Skip no-op writes so history stays meaningful
  IF _old IS NOT DISTINCT FROM _value THEN
    RAISE EXCEPTION 'Value is unchanged';
  END IF;

  INSERT INTO public.platform_settings(key, value, updated_by, updated_at)
  VALUES (_full_key, _value, auth.uid(), now())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_by = auth.uid(),
      updated_at = now();

  INSERT INTO public.gamification_rule_history(rule_key, old_value, new_value, note, changed_by)
  VALUES (_full_key, _old, _value, NULLIF(btrim(_note), ''), auth.uid());

  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(), 'gamification.rule_set', 'platform_setting', _full_key,
          jsonb_build_object('old', _old, 'new', _value, 'note', _note));
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_set_gamification_rule(text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_gamification_rule(text, jsonb, text) TO authenticated;
