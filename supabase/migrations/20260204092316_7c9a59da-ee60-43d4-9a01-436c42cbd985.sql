-- Create table for user topic progress
CREATE TABLE public.user_topic_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sheet_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  is_revision BOOLEAN NOT NULL DEFAULT false,
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sheet_id, topic_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_topic_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own progress"
ON public.user_topic_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.user_topic_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_topic_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
ON public.user_topic_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_topic_progress_lookup ON public.user_topic_progress(user_id, sheet_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_topic_progress_updated_at
BEFORE UPDATE ON public.user_topic_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();