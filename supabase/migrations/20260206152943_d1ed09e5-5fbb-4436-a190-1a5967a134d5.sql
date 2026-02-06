-- Create outreach favorites table
CREATE TABLE public.outreach_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- Enable RLS
ALTER TABLE public.outreach_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own outreach favorites" 
ON public.outreach_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outreach favorites" 
ON public.outreach_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own outreach favorites" 
ON public.outreach_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create outreach usage tracking table
CREATE TABLE public.outreach_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  copied_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outreach_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own outreach usage" 
ON public.outreach_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outreach usage" 
ON public.outreach_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_outreach_favorites_user_id ON public.outreach_favorites(user_id);
CREATE INDEX idx_outreach_usage_user_id ON public.outreach_usage(user_id);
CREATE INDEX idx_outreach_usage_template_id ON public.outreach_usage(template_id);