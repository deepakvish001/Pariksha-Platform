-- 1. Lock down contest_registrations public exposure
DROP POLICY IF EXISTS "registrations public read for visible contests" ON public.contest_registrations;

-- 2. Safe public count RPC
CREATE OR REPLACE FUNCTION public.get_contest_registered_count(_contest_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.contest_registrations cr
  JOIN public.contests c ON c.id = cr.contest_id
  WHERE cr.contest_id = _contest_id
    AND cr.status = 'registered'
    AND c.visibility = 'public'
    AND c.status IN ('published','live','ended');
$$;
GRANT EXECUTE ON FUNCTION public.get_contest_registered_count(uuid) TO anon, authenticated;

-- 3. Realtime channel authorization — restrict realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users scoped channel access" ON realtime.messages;
CREATE POLICY "Authenticated users scoped channel access"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- User-owned topics: any topic that contains the user's id
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
  -- Contest topics: user must be registered for the contest referenced in topic, or admin
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.contest_registrations cr
    WHERE cr.user_id = auth.uid()
      AND realtime.topic() LIKE '%' || cr.contest_id::text || '%'
  )
);

DROP POLICY IF EXISTS "Authenticated users scoped channel publish" ON realtime.messages;
CREATE POLICY "Authenticated users scoped channel publish"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.contest_registrations cr
    WHERE cr.user_id = auth.uid()
      AND realtime.topic() LIKE '%' || cr.contest_id::text || '%'
  )
);