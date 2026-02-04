-- Add new columns for enhanced onboarding
ALTER TABLE public.user_profiles_extended
ADD COLUMN IF NOT EXISTS current_experience text,
ADD COLUMN IF NOT EXISTS target_goal text,
ADD COLUMN IF NOT EXISTS referral_source text,
ADD COLUMN IF NOT EXISTS interested_features text[];

-- Update the updated_at trigger if not exists
DROP TRIGGER IF EXISTS update_user_profiles_extended_updated_at ON public.user_profiles_extended;
CREATE TRIGGER update_user_profiles_extended_updated_at
BEFORE UPDATE ON public.user_profiles_extended
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();