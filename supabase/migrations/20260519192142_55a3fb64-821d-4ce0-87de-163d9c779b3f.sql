ALTER TABLE public.student_share_links
  ADD COLUMN IF NOT EXISTS allow_resume boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_contact boolean NOT NULL DEFAULT false;