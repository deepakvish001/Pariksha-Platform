
-- Add XP and level tracking fields to user_profiles_extended
ALTER TABLE public.user_profiles_extended
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp_this_week INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_xp_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add customizable SRS intervals (stored as JSON array of days)
ALTER TABLE public.user_profiles_extended
ADD COLUMN IF NOT EXISTS srs_intervals INTEGER[] DEFAULT ARRAY[1, 2, 4, 7, 14, 30, 60],
ADD COLUMN IF NOT EXISTS srs_mastery_threshold INTEGER DEFAULT 3;

-- Create XP transaction log for tracking XP gains
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on xp_transactions
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for xp_transactions
CREATE POLICY "Users can view their own XP transactions"
ON public.xp_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP transactions"
ON public.xp_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON public.xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON public.xp_transactions(created_at DESC);
