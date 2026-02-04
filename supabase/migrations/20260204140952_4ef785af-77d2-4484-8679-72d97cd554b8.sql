-- Add completed_at timestamp to track when questions were solved for spaced repetition
ALTER TABLE public.user_topic_progress 
ADD COLUMN completed_at timestamp with time zone;

-- Add review_count to track how many times a question has been reviewed
ALTER TABLE public.user_topic_progress 
ADD COLUMN review_count integer NOT NULL DEFAULT 0;

-- Update existing completed records to set completed_at to their updated_at time
UPDATE public.user_topic_progress 
SET completed_at = updated_at 
WHERE completed = true AND completed_at IS NULL;