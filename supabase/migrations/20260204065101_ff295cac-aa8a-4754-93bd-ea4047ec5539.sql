-- Create enum for user type
CREATE TYPE public.user_type AS ENUM ('student', 'professional', 'other');

-- Create enum for year of study
CREATE TYPE public.study_year AS ENUM ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Other');

-- Create extended profiles table
CREATE TABLE public.user_profiles_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    mobile_number TEXT,
    user_type user_type NOT NULL,
    -- Student fields
    college_name TEXT,
    course_name TEXT,
    branch TEXT,
    study_year study_year,
    -- Professional fields
    company_name TEXT,
    role TEXT,
    experience TEXT,
    -- Other fields
    other_description TEXT,
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_profiles_extended ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own extended profile"
ON public.user_profiles_extended
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extended profile"
ON public.user_profiles_extended
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extended profile"
ON public.user_profiles_extended
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_extended_updated_at
BEFORE UPDATE ON public.user_profiles_extended
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();