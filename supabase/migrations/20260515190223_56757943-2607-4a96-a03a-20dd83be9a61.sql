
-- Hide ip_address from end users on contest_sessions (admins still see it via has_role policy)
REVOKE SELECT (ip_address) ON public.contest_sessions FROM authenticated, anon;

-- Hide ip from end users on contest_sideeye_consents
REVOKE SELECT (ip) ON public.contest_sideeye_consents FROM authenticated, anon;

-- Restrict runtime flags to admins only
DROP POLICY IF EXISTS "Anyone authenticated can read runtime flags" ON public.sideeye_runtime_flags;
