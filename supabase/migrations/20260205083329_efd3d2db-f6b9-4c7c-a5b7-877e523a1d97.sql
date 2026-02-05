-- Add policy to allow anyone to view user achievements for public profiles
CREATE POLICY "Anyone can view user achievements for public profiles"
ON public.user_achievements
FOR SELECT
USING (true);