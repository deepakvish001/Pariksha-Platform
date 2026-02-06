-- Create user_activity_log table for centralized activity tracking
CREATE TABLE public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own activities"
ON public.user_activity_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
ON public.user_activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System insert policy for triggers (security definer functions)
CREATE POLICY "System can insert activities"
ON public.user_activity_log
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_activity_log_user_created ON public.user_activity_log(user_id, created_at DESC);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_log;

-- Trigger function for quiz_results
CREATE OR REPLACE FUNCTION public.log_quiz_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
  VALUES (
    NEW.user_id,
    'quiz_complete',
    'Completed ' || UPPER(NEW.quiz_type) || ' Quiz',
    'Scored ' || NEW.score || '/' || NEW.total_questions || ' (' || ROUND(NEW.accuracy::numeric, 1) || '%)',
    jsonb_build_object(
      'quiz_type', NEW.quiz_type,
      'category', NEW.category,
      'difficulty', NEW.difficulty,
      'score', NEW.score,
      'total_questions', NEW.total_questions,
      'accuracy', NEW.accuracy,
      'quiz_result_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger for quiz_results
CREATE TRIGGER on_quiz_complete
AFTER INSERT ON public.quiz_results
FOR EACH ROW
EXECUTE FUNCTION public.log_quiz_activity();

-- Trigger function for user_achievements
CREATE OR REPLACE FUNCTION public.log_achievement_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
  VALUES (
    NEW.user_id,
    'achievement',
    'Unlocked Achievement',
    NEW.achievement_id,
    jsonb_build_object(
      'achievement_id', NEW.achievement_id,
      'earned_at', NEW.earned_at
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger for user_achievements
CREATE TRIGGER on_achievement_unlock
AFTER INSERT ON public.user_achievements
FOR EACH ROW
EXECUTE FUNCTION public.log_achievement_activity();

-- Trigger function for xp_transactions
CREATE OR REPLACE FUNCTION public.log_xp_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
  VALUES (
    NEW.user_id,
    'xp_earned',
    'Earned ' || NEW.amount || ' XP',
    COALESCE(NEW.description, 'From ' || NEW.source),
    jsonb_build_object(
      'amount', NEW.amount,
      'source', NEW.source,
      'description', NEW.description
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger for xp_transactions
CREATE TRIGGER on_xp_earned
AFTER INSERT ON public.xp_transactions
FOR EACH ROW
EXECUTE FUNCTION public.log_xp_activity();

-- Trigger function for topic completion
CREATE OR REPLACE FUNCTION public.log_topic_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log when topic is newly completed
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
    VALUES (
      NEW.user_id,
      'topic_complete',
      'Completed Topic',
      NEW.topic_id,
      jsonb_build_object(
        'topic_id', NEW.topic_id,
        'sheet_id', NEW.sheet_id,
        'completed_at', NEW.completed_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for user_topic_progress
CREATE TRIGGER on_topic_complete
AFTER UPDATE ON public.user_topic_progress
FOR EACH ROW
EXECUTE FUNCTION public.log_topic_activity();

-- Trigger function for resume downloads
CREATE OR REPLACE FUNCTION public.log_resume_download_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
  VALUES (
    NEW.user_id,
    'resume_download',
    'Downloaded Resume Template',
    NEW.template_name,
    jsonb_build_object(
      'template_id', NEW.template_id,
      'template_name', NEW.template_name
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger for resume_downloads
CREATE TRIGGER on_resume_download
AFTER INSERT ON public.resume_downloads
FOR EACH ROW
EXECUTE FUNCTION public.log_resume_download_activity();

-- Trigger function for outreach usage
CREATE OR REPLACE FUNCTION public.log_outreach_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
  VALUES (
    NEW.user_id,
    'outreach_copy',
    'Copied Outreach Template',
    NEW.template_id,
    jsonb_build_object(
      'template_id', NEW.template_id
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger for outreach_usage
CREATE TRIGGER on_outreach_copy
AFTER INSERT ON public.outreach_usage
FOR EACH ROW
EXECUTE FUNCTION public.log_outreach_activity();