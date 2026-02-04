-- Create table for tracking user progress on company resources
CREATE TABLE public.user_company_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id TEXT NOT NULL,
  tab_id TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  solved BOOLEAN NOT NULL DEFAULT false,
  revision BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Unique constraint to prevent duplicate entries
  UNIQUE (user_id, company_id, tab_id, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_company_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own company progress"
ON public.user_company_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company progress"
ON public.user_company_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company progress"
ON public.user_company_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company progress"
ON public.user_company_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_company_progress_user_company ON public.user_company_progress (user_id, company_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_company_progress_updated_at
BEFORE UPDATE ON public.user_company_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();