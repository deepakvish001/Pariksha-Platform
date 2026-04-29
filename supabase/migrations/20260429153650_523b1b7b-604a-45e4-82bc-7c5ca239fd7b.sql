-- =========================================================
-- 1. Roles infrastructure
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all roles" ON public.user_roles;
CREATE POLICY "Admins manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 2. Coding problems (parent table)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coding_problems (
  slug text PRIMARY KEY,
  title text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  topics text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  constraints text[] NOT NULL DEFAULT '{}',
  hints text[] NOT NULL DEFAULT '{}',
  cpu_time_limit_sec numeric(5,2) DEFAULT 2.0,
  memory_limit_kb integer DEFAULT 256000,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published problems" ON public.coding_problems;
CREATE POLICY "Public can view published problems"
  ON public.coding_problems FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage problems" ON public.coding_problems;
CREATE POLICY "Admins manage problems"
  ON public.coding_problems FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS coding_problems_set_updated_at ON public.coding_problems;
CREATE TRIGGER coding_problems_set_updated_at
  BEFORE UPDATE ON public.coding_problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_coding_problems_difficulty ON public.coding_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_coding_problems_published ON public.coding_problems(is_published);

-- =========================================================
-- 3. Per-language starter code
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coding_problem_starter_code (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_slug text NOT NULL REFERENCES public.coding_problems(slug) ON DELETE CASCADE,
  lang_id text NOT NULL,
  code text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (problem_slug, lang_id)
);

ALTER TABLE public.coding_problem_starter_code ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read starter code of published problems" ON public.coding_problem_starter_code;
CREATE POLICY "Public can read starter code of published problems"
  ON public.coding_problem_starter_code FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coding_problems p
      WHERE p.slug = problem_slug
        AND (p.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "Admins manage starter code" ON public.coding_problem_starter_code;
CREATE POLICY "Admins manage starter code"
  ON public.coding_problem_starter_code FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 4. Reference solutions (admin-only)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coding_problem_reference_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_slug text NOT NULL REFERENCES public.coding_problems(slug) ON DELETE CASCADE,
  lang_id text NOT NULL,
  code text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (problem_slug, lang_id)
);

ALTER TABLE public.coding_problem_reference_solutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins fully manage reference solutions" ON public.coding_problem_reference_solutions;
CREATE POLICY "Admins fully manage reference solutions"
  ON public.coding_problem_reference_solutions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 5. Test cases (sample = public; hidden = admin-only)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coding_problem_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_slug text NOT NULL REFERENCES public.coding_problems(slug) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('sample','hidden')),
  input text NOT NULL DEFAULT '',
  expected text NOT NULL DEFAULT '',
  ord integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coding_problem_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read sample tests of published problems" ON public.coding_problem_tests;
CREATE POLICY "Public can read sample tests of published problems"
  ON public.coding_problem_tests FOR SELECT
  USING (
    (kind = 'sample' AND EXISTS (
      SELECT 1 FROM public.coding_problems p
      WHERE p.slug = problem_slug AND p.is_published = true
    ))
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins manage tests" ON public.coding_problem_tests;
CREATE POLICY "Admins manage tests"
  ON public.coding_problem_tests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_problem_tests_slug_kind ON public.coding_problem_tests(problem_slug, kind, ord);

-- =========================================================
-- 6. SQL problem specs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coding_problem_sql_specs (
  problem_slug text PRIMARY KEY REFERENCES public.coding_problems(slug) ON DELETE CASCADE,
  schema_sql text NOT NULL DEFAULT '',
  seed_sql text NOT NULL DEFAULT '',
  reference_query text NOT NULL DEFAULT '',
  order_matters boolean NOT NULL DEFAULT false,
  starter text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coding_problem_sql_specs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read sql specs of published problems" ON public.coding_problem_sql_specs;
CREATE POLICY "Public read sql specs of published problems"
  ON public.coding_problem_sql_specs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coding_problems p
      WHERE p.slug = problem_slug AND p.is_published = true
    )
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins manage sql specs" ON public.coding_problem_sql_specs;
CREATE POLICY "Admins manage sql specs"
  ON public.coding_problem_sql_specs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 7. Admin audit log
-- =========================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_slug text,
  diff jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins write audit log" ON public.admin_audit_log;
CREATE POLICY "Admins write audit log"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND actor_id = auth.uid());

-- =========================================================
-- 8. RPC: transactional upsert of a full problem
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_save_problem(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slug text := payload->>'slug';
  _uid uuid := auth.uid();
  _lang text;
  _code text;
  _test jsonb;
  _i int := 0;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  IF _slug IS NULL OR length(_slug) = 0 THEN
    RAISE EXCEPTION 'slug is required';
  END IF;

  INSERT INTO public.coding_problems (
    slug, title, difficulty, topics, description, examples,
    constraints, hints, cpu_time_limit_sec, memory_limit_kb,
    is_published, created_by
  ) VALUES (
    _slug,
    payload->>'title',
    COALESCE(payload->>'difficulty', 'medium'),
    COALESCE((SELECT array_agg(value::text) FROM jsonb_array_elements_text(payload->'topics')), '{}'),
    COALESCE(payload->>'description', ''),
    COALESCE(payload->'examples', '[]'::jsonb),
    COALESCE((SELECT array_agg(value::text) FROM jsonb_array_elements_text(payload->'constraints')), '{}'),
    COALESCE((SELECT array_agg(value::text) FROM jsonb_array_elements_text(payload->'hints')), '{}'),
    COALESCE((payload->>'cpu_time_limit_sec')::numeric, 2.0),
    COALESCE((payload->>'memory_limit_kb')::int, 256000),
    COALESCE((payload->>'is_published')::boolean, false),
    _uid
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    difficulty = EXCLUDED.difficulty,
    topics = EXCLUDED.topics,
    description = EXCLUDED.description,
    examples = EXCLUDED.examples,
    constraints = EXCLUDED.constraints,
    hints = EXCLUDED.hints,
    cpu_time_limit_sec = EXCLUDED.cpu_time_limit_sec,
    memory_limit_kb = EXCLUDED.memory_limit_kb,
    is_published = EXCLUDED.is_published,
    updated_at = now();

  -- Replace starter code
  IF payload ? 'starter_code' THEN
    DELETE FROM public.coding_problem_starter_code WHERE problem_slug = _slug;
    FOR _lang, _code IN SELECT key, value FROM jsonb_each_text(payload->'starter_code') LOOP
      INSERT INTO public.coding_problem_starter_code (problem_slug, lang_id, code)
      VALUES (_slug, _lang, _code);
    END LOOP;
  END IF;

  -- Replace reference solutions
  IF payload ? 'reference_solution' THEN
    DELETE FROM public.coding_problem_reference_solutions WHERE problem_slug = _slug;
    FOR _lang, _code IN SELECT key, value FROM jsonb_each_text(payload->'reference_solution') LOOP
      INSERT INTO public.coding_problem_reference_solutions (problem_slug, lang_id, code)
      VALUES (_slug, _lang, _code);
    END LOOP;
  END IF;

  -- Replace tests
  IF payload ? 'sample_tests' THEN
    DELETE FROM public.coding_problem_tests WHERE problem_slug = _slug AND kind = 'sample';
    _i := 0;
    FOR _test IN SELECT value FROM jsonb_array_elements(payload->'sample_tests') LOOP
      INSERT INTO public.coding_problem_tests (problem_slug, kind, input, expected, ord)
      VALUES (_slug, 'sample', COALESCE(_test->>'input',''), COALESCE(_test->>'expected',''), _i);
      _i := _i + 1;
    END LOOP;
  END IF;

  IF payload ? 'hidden_tests' THEN
    DELETE FROM public.coding_problem_tests WHERE problem_slug = _slug AND kind = 'hidden';
    _i := 0;
    FOR _test IN SELECT value FROM jsonb_array_elements(payload->'hidden_tests') LOOP
      INSERT INTO public.coding_problem_tests (problem_slug, kind, input, expected, ord)
      VALUES (_slug, 'hidden', COALESCE(_test->>'input',''), COALESCE(_test->>'expected',''), _i);
      _i := _i + 1;
    END LOOP;
  END IF;

  -- SQL spec
  IF payload ? 'sql_spec' AND jsonb_typeof(payload->'sql_spec') = 'object' THEN
    INSERT INTO public.coding_problem_sql_specs (problem_slug, schema_sql, seed_sql, reference_query, order_matters, starter)
    VALUES (
      _slug,
      COALESCE(payload->'sql_spec'->>'schema_sql', ''),
      COALESCE(payload->'sql_spec'->>'seed_sql', ''),
      COALESCE(payload->'sql_spec'->>'reference_query', ''),
      COALESCE((payload->'sql_spec'->>'order_matters')::boolean, false),
      COALESCE(payload->'sql_spec'->>'starter', '')
    )
    ON CONFLICT (problem_slug) DO UPDATE SET
      schema_sql = EXCLUDED.schema_sql,
      seed_sql = EXCLUDED.seed_sql,
      reference_query = EXCLUDED.reference_query,
      order_matters = EXCLUDED.order_matters,
      starter = EXCLUDED.starter,
      updated_at = now();
  END IF;

  -- Audit log
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_slug, diff)
  VALUES (_uid, 'save_problem', 'coding_problem', _slug, payload);

  RETURN jsonb_build_object('ok', true, 'slug', _slug);
END;
$$;

-- =========================================================
-- 9. RPC: load full problem for the editor (admin only)
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_get_full_problem(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'problem', to_jsonb(p.*),
    'starter_code', COALESCE((SELECT jsonb_object_agg(lang_id, code) FROM public.coding_problem_starter_code WHERE problem_slug = _slug), '{}'::jsonb),
    'reference_solution', COALESCE((SELECT jsonb_object_agg(lang_id, code) FROM public.coding_problem_reference_solutions WHERE problem_slug = _slug), '{}'::jsonb),
    'sample_tests', COALESCE((SELECT jsonb_agg(jsonb_build_object('input', input, 'expected', expected) ORDER BY ord) FROM public.coding_problem_tests WHERE problem_slug = _slug AND kind = 'sample'), '[]'::jsonb),
    'hidden_tests', COALESCE((SELECT jsonb_agg(jsonb_build_object('input', input, 'expected', expected) ORDER BY ord) FROM public.coding_problem_tests WHERE problem_slug = _slug AND kind = 'hidden'), '[]'::jsonb),
    'sql_spec', (SELECT to_jsonb(s.*) FROM public.coding_problem_sql_specs s WHERE problem_slug = _slug)
  ) INTO result
  FROM public.coding_problems p
  WHERE p.slug = _slug;

  RETURN result;
END;
$$;