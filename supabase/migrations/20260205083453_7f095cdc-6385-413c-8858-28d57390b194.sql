-- Allow anyone to view public profiles that have a username set
CREATE POLICY "Anyone can view profiles with username set"
ON public.user_profiles_extended
FOR SELECT
USING (username IS NOT NULL AND username != '');