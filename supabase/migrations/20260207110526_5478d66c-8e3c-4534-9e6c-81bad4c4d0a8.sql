-- Create ai_content_likes table for tracking user likes
CREATE TABLE public.ai_content_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.ai_generated_content(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Enable RLS
ALTER TABLE public.ai_content_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes (for counting)
CREATE POLICY "Anyone can view likes count"
ON public.ai_content_likes
FOR SELECT
USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can like content"
ON public.ai_content_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can unlike content"
ON public.ai_content_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create ai_content_progress table for tracking learning progress
CREATE TABLE public.ai_content_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.ai_generated_content(id) ON DELETE CASCADE,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Enable RLS
ALTER TABLE public.ai_content_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own progress"
ON public.ai_content_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can create their own progress"
ON public.ai_content_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress"
ON public.ai_content_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own progress
CREATE POLICY "Users can delete their own progress"
ON public.ai_content_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_content_progress_updated_at
BEFORE UPDATE ON public.ai_content_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update likes_count on ai_generated_content
CREATE OR REPLACE FUNCTION public.update_content_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ai_generated_content
    SET likes_count = likes_count + 1
    WHERE id = NEW.content_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ai_generated_content
    SET likes_count = likes_count - 1
    WHERE id = OLD.content_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for likes count
CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON public.ai_content_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_content_likes_count();