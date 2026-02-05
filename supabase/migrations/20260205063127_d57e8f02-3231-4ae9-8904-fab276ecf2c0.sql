-- Create quiz_results table for storing quiz scores and leaderboard
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_type TEXT NOT NULL, -- 'aptitude', 'dsa', 'sql'
  category TEXT DEFAULT 'all',
  difficulty TEXT DEFAULT 'all',
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  avg_time_seconds INTEGER NOT NULL,
  total_time_seconds INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Users can view all quiz results (for leaderboard)
CREATE POLICY "Anyone can view quiz results for leaderboard" 
ON public.quiz_results 
FOR SELECT 
USING (true);

-- Users can insert their own quiz results
CREATE POLICY "Users can insert their own quiz results" 
ON public.quiz_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own quiz results
CREATE POLICY "Users can delete their own quiz results" 
ON public.quiz_results 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for leaderboard queries
CREATE INDEX idx_quiz_results_leaderboard ON public.quiz_results (quiz_type, accuracy DESC, avg_time_seconds ASC);
CREATE INDEX idx_quiz_results_user ON public.quiz_results (user_id, completed_at DESC);