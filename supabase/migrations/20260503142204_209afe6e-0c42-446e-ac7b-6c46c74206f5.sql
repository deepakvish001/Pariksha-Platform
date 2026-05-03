-- Allow joiners to peek at a pending invite's expiry/problem before they commit to joining.
CREATE OR REPLACE FUNCTION public.battle_peek_code(_code text)
RETURNS TABLE(expires_at timestamptz, problem_slug text, difficulty public.battle_difficulty, duration_sec int, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  i record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT bi.expires_at, bi.problem_slug, bi.difficulty, bi.duration_sec, bi.status, bi.from_user
    INTO i
    FROM public.battle_invites bi
    WHERE bi.code = upper(_code)
    ORDER BY bi.created_at DESC NULLS LAST
    LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid code'; END IF;
  expires_at := i.expires_at;
  problem_slug := i.problem_slug;
  difficulty := i.difficulty;
  duration_sec := i.duration_sec;
  status := i.status;
  RETURN NEXT;
END $$;

REVOKE EXECUTE ON FUNCTION public.battle_peek_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.battle_peek_code(text) TO authenticated;