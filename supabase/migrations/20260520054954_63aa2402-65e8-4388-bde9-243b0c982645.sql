
DO $$ BEGIN
  CREATE TYPE public.experience_report_reason AS ENUM ('spam', 'misinformation', 'plagiarism', 'offensive', 'personal_info', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.experience_report_status AS ENUM ('open', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.experience_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.interview_experiences(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason public.experience_report_reason NOT NULL,
  details text,
  status public.experience_report_status NOT NULL DEFAULT 'open',
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (experience_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_experience_reports_status ON public.experience_reports(status);
CREATE INDEX IF NOT EXISTS idx_experience_reports_experience ON public.experience_reports(experience_id);

ALTER TABLE public.experience_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters can view own reports"
  ON public.experience_reports FOR SELECT
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can file reports"
  ON public.experience_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id AND status = 'open');

CREATE POLICY "Admins can update reports"
  ON public.experience_reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reports"
  ON public.experience_reports FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
