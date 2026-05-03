
-- Allow open invites (no specific recipient) and add share code
ALTER TABLE public.battle_invites
  ALTER COLUMN to_user DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS code text;

CREATE UNIQUE INDEX IF NOT EXISTS battle_invites_code_pending_idx
  ON public.battle_invites(code)
  WHERE status = 'pending';

-- Create room with a shareable code
CREATE OR REPLACE FUNCTION public.battle_create_code(
  _problem_slug text,
  _difficulty public.battle_difficulty,
  _duration int DEFAULT 900
) RETURNS TABLE(invite_id uuid, code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := auth.uid();
  c text;
  new_id uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  FOR i IN 1..6 LOOP
    c := upper(substr(md5(random()::text || clock_timestamp()::text || me::text), 1, 6));
    BEGIN
      INSERT INTO public.battle_invites(from_user, to_user, problem_slug, difficulty, duration_sec, code, expires_at)
      VALUES (me, NULL, _problem_slug, _difficulty, _duration, c, now() + interval '10 minutes')
      RETURNING id INTO new_id;
      invite_id := new_id;
      code := c;
      RETURN NEXT;
      RETURN;
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
  END LOOP;
  RAISE EXCEPTION 'could not allocate code';
END $$;

-- Join a room by code
CREATE OR REPLACE FUNCTION public.battle_join_code(_code text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  i record;
  new_battle uuid;
  ea int;
  eb int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO i FROM public.battle_invites
    WHERE code = upper(_code) AND status = 'pending'
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid code'; END IF;
  IF i.expires_at < now() THEN RAISE EXCEPTION 'code expired'; END IF;
  IF i.from_user = auth.uid() THEN RAISE EXCEPTION 'cannot join your own room'; END IF;

  PERFORM public.ensure_player_rating(i.from_user);
  PERFORM public.ensure_player_rating(auth.uid());
  SELECT elo INTO ea FROM public.player_ratings WHERE user_id = i.from_user;
  SELECT elo INTO eb FROM public.player_ratings WHERE user_id = auth.uid();

  INSERT INTO public.battles(player_a, player_b, problem_slug, difficulty, status, duration_sec,
    started_at, ends_at, is_private, elo_a_before, elo_b_before)
  VALUES (i.from_user, auth.uid(), i.problem_slug, i.difficulty, 'live', i.duration_sec,
    now(), now() + (i.duration_sec || ' seconds')::interval, true, ea, eb)
  RETURNING id INTO new_battle;

  UPDATE public.battle_invites
    SET status = 'accepted', battle_id = new_battle, to_user = auth.uid()
    WHERE id = i.id;

  RETURN new_battle;
END $$;

REVOKE EXECUTE ON FUNCTION public.battle_create_code(text, public.battle_difficulty, int) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.battle_join_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.battle_create_code(text, public.battle_difficulty, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.battle_join_code(text) TO authenticated;
