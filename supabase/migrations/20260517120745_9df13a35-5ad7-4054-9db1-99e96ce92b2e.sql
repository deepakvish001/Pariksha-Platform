
-- Add show_results_to_candidate flag to assessments
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS show_results_to_candidate boolean NOT NULL DEFAULT true;

-- Feedback collected from candidates after submission
CREATE TABLE IF NOT EXISTS public.assessment_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL UNIQUE REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  difficulty text NOT NULL CHECK (difficulty IN ('easy','ok','hard')),
  clarity int NOT NULL CHECK (clarity BETWEEN 1 AND 5),
  tech_issues text,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_feedback_assessment ON public.assessment_feedback(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_feedback_attempt ON public.assessment_feedback(attempt_id);

ALTER TABLE public.assessment_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidate inserts own feedback"
ON public.assessment_feedback FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.assessment_attempts a
    WHERE a.id = attempt_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "candidate reads own feedback"
ON public.assessment_feedback FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "org members read feedback"
ON public.assessment_feedback FOR SELECT
USING (public.is_org_member(public.assessment_org(assessment_id)));
