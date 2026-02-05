-- Create table for storing individual quiz question responses
CREATE TABLE public.quiz_question_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_result_id UUID NOT NULL REFERENCES public.quiz_results(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_category TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  selected_answer_index INTEGER,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds INTEGER DEFAULT 0,
  was_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_quiz_question_responses_result_id ON public.quiz_question_responses(quiz_result_id);

-- Enable Row Level Security
ALTER TABLE public.quiz_question_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own quiz responses
CREATE POLICY "Users can view their own quiz responses"
ON public.quiz_question_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_results
    WHERE quiz_results.id = quiz_question_responses.quiz_result_id
    AND quiz_results.user_id = auth.uid()
  )
);

-- RLS Policy: Users can insert their own quiz responses
CREATE POLICY "Users can insert their own quiz responses"
ON public.quiz_question_responses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_results
    WHERE quiz_results.id = quiz_question_responses.quiz_result_id
    AND quiz_results.user_id = auth.uid()
  )
);

-- RLS Policy: Users can delete their own quiz responses
CREATE POLICY "Users can delete their own quiz responses"
ON public.quiz_question_responses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_results
    WHERE quiz_results.id = quiz_question_responses.quiz_result_id
    AND quiz_results.user_id = auth.uid()
  )
);