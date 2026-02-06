-- Add theme preference column to user_profiles_extended
ALTER TABLE public.user_profiles_extended
ADD COLUMN theme_preference text DEFAULT 'system';

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles_extended.theme_preference IS 'User theme preference: light, dark, or system';