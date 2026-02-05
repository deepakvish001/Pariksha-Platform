-- Create table for quiz spaced repetition tracking
CREATE TABLE public.quiz_spaced_repetition (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id INTEGER NOT NULL,
  question_category TEXT NOT NULL, -- 'dsa', 'cs', 'sql', 'aptitude'
  question_title TEXT NOT NULL,
  last_answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_review_at TIMESTAMP WITH TIME ZONE NOT NULL,
  review_count INTEGER NOT NULL DEFAULT 0,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id, question_category)
);

-- Enable Row Level Security
ALTER TABLE public.quiz_spaced_repetition ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own quiz reviews"
ON public.quiz_spaced_repetition
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz reviews"
ON public.quiz_spaced_repetition
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz reviews"
ON public.quiz_spaced_repetition
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz reviews"
ON public.quiz_spaced_repetition
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_quiz_spaced_repetition_user_next_review 
ON public.quiz_spaced_repetition(user_id, next_review_at);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quiz_spaced_repetition_updated_at
BEFORE UPDATE ON public.quiz_spaced_repetition
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();