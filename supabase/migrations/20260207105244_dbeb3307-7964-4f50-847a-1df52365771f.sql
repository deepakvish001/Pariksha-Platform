-- Create table for AI-generated content
CREATE TABLE public.ai_generated_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('plan', 'course', 'guide', 'roadmap', 'quiz')),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own content"
ON public.ai_generated_content
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public content"
ON public.ai_generated_content
FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can insert their own content"
ON public.ai_generated_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content"
ON public.ai_generated_content
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content"
ON public.ai_generated_content
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_generated_content_user_id ON public.ai_generated_content(user_id);
CREATE INDEX idx_ai_generated_content_type ON public.ai_generated_content(content_type);
CREATE INDEX idx_ai_generated_content_public ON public.ai_generated_content(is_public) WHERE is_public = true;

-- Trigger for updated_at
CREATE TRIGGER update_ai_generated_content_updated_at
BEFORE UPDATE ON public.ai_generated_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();