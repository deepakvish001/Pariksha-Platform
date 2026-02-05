-- Create table for named/saved learning paths
CREATE TABLE public.user_roadmap_saved_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  roadmap_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  custom_orders JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roadmap_saved_paths ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved paths"
ON public.user_roadmap_saved_paths
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved paths"
ON public.user_roadmap_saved_paths
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved paths"
ON public.user_roadmap_saved_paths
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved paths"
ON public.user_roadmap_saved_paths
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_saved_paths_user_roadmap ON public.user_roadmap_saved_paths(user_id, roadmap_id);

-- Add trigger for updated_at
CREATE TRIGGER update_saved_paths_updated_at
BEFORE UPDATE ON public.user_roadmap_saved_paths
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();