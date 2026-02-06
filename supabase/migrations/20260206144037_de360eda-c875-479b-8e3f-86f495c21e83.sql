-- Create resume_downloads table to track download history
CREATE TABLE public.resume_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id INTEGER NOT NULL,
  template_name TEXT NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resume_favorites table for bookmarks
CREATE TABLE public.resume_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- Enable RLS on both tables
ALTER TABLE public.resume_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for resume_downloads
CREATE POLICY "Users can view their own downloads"
ON public.resume_downloads
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own downloads"
ON public.resume_downloads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own downloads"
ON public.resume_downloads
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for resume_favorites
CREATE POLICY "Users can view their own favorites"
ON public.resume_favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
ON public.resume_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
ON public.resume_favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_resume_downloads_user_id ON public.resume_downloads(user_id);
CREATE INDEX idx_resume_downloads_template_id ON public.resume_downloads(template_id);
CREATE INDEX idx_resume_favorites_user_id ON public.resume_favorites(user_id);
CREATE INDEX idx_resume_favorites_template_id ON public.resume_favorites(template_id);