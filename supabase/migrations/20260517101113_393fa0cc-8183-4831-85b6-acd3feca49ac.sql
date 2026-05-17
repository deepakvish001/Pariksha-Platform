
CREATE TABLE public.assessment_answer_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  ordinal integer NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id, ordinal)
);

CREATE INDEX idx_answer_uploads_attempt ON public.assessment_answer_uploads(attempt_id);
CREATE INDEX idx_answer_uploads_attempt_question ON public.assessment_answer_uploads(attempt_id, question_id);

ALTER TABLE public.assessment_answer_uploads ENABLE ROW LEVEL SECURITY;

-- Candidate: read own uploads
CREATE POLICY "candidate reads own answer uploads"
  ON public.assessment_answer_uploads
  FOR SELECT
  USING (public.attempt_owner(attempt_id) = auth.uid());

-- Candidate: insert own uploads only while attempt is in progress
CREATE POLICY "candidate inserts own answer uploads while in progress"
  ON public.assessment_answer_uploads
  FOR INSERT
  WITH CHECK (
    public.attempt_owner(attempt_id) = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = attempt_id AND a.status = 'in_progress'
    )
  );

-- Candidate: delete own uploads only while in progress (re-take a page)
CREATE POLICY "candidate deletes own answer uploads while in progress"
  ON public.assessment_answer_uploads
  FOR DELETE
  USING (
    public.attempt_owner(attempt_id) = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = attempt_id AND a.status = 'in_progress'
    )
  );

-- Org members (proctors/graders) can read all uploads for their org's attempts
CREATE POLICY "org members read answer uploads"
  ON public.assessment_answer_uploads
  FOR SELECT
  USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_answer_uploads;
ALTER TABLE public.assessment_answer_uploads REPLICA IDENTITY FULL;
