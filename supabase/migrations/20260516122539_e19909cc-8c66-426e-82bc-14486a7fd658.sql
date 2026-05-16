-- AI insight feedback (thumbs up/down) for B2B dashboard
CREATE TYPE public.ai_insight_rating AS ENUM ('up', 'down');

CREATE TABLE public.ai_insight_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  org_id uuid NOT NULL,
  insight_key text NOT NULL,
  insight_title text NOT NULL,
  rating public.ai_insight_rating NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id, insight_key)
);

CREATE INDEX idx_ai_insight_feedback_org ON public.ai_insight_feedback (org_id, insight_key);

ALTER TABLE public.ai_insight_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view their own ai insight feedback"
  ON public.ai_insight_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert their own ai insight feedback"
  ON public.ai_insight_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update their own ai insight feedback"
  ON public.ai_insight_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete their own ai insight feedback"
  ON public.ai_insight_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_ai_insight_feedback_updated_at
  BEFORE UPDATE ON public.ai_insight_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();