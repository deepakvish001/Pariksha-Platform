-- Add new profile fields to user_profiles_extended table
ALTER TABLE public.user_profiles_extended
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS aspirations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS other_links JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS leetcode_url TEXT,
ADD COLUMN IF NOT EXISTS hackerrank_url TEXT,
ADD COLUMN IF NOT EXISTS codeforces_url TEXT,
ADD COLUMN IF NOT EXISTS codechef_url TEXT,
ADD COLUMN IF NOT EXISTS geeksforgeeks_url TEXT,
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Create index for username lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_extended_username ON public.user_profiles_extended(username);

-- Add a function to calculate profile completion
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_row public.user_profiles_extended)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    total_fields INTEGER := 20;
    filled_fields INTEGER := 0;
BEGIN
    -- Basic fields
    IF profile_row.mobile_number IS NOT NULL AND profile_row.mobile_number != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.bio IS NOT NULL AND profile_row.bio != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.location IS NOT NULL AND profile_row.location != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.occupation IS NOT NULL AND profile_row.occupation != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.website IS NOT NULL AND profile_row.website != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.current_experience IS NOT NULL AND profile_row.current_experience != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.target_goal IS NOT NULL AND profile_row.target_goal != '' THEN filled_fields := filled_fields + 1; END IF;
    
    -- Array fields (count if not empty)
    IF array_length(profile_row.skills, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF array_length(profile_row.interests, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF array_length(profile_row.goals, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF array_length(profile_row.aspirations, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    
    -- Social links
    IF profile_row.twitter_url IS NOT NULL AND profile_row.twitter_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.linkedin_url IS NOT NULL AND profile_row.linkedin_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.github_url IS NOT NULL AND profile_row.github_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.instagram_url IS NOT NULL AND profile_row.instagram_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.resume_url IS NOT NULL AND profile_row.resume_url != '' THEN filled_fields := filled_fields + 1; END IF;
    
    -- Coding profiles
    IF profile_row.leetcode_url IS NOT NULL AND profile_row.leetcode_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.hackerrank_url IS NOT NULL AND profile_row.hackerrank_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.codeforces_url IS NOT NULL AND profile_row.codeforces_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.codechef_url IS NOT NULL AND profile_row.codechef_url != '' THEN filled_fields := filled_fields + 1; END IF;
    
    RETURN ROUND((filled_fields::NUMERIC / total_fields::NUMERIC) * 100);
END;
$$;