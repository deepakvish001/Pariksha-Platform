
-- Experience status enum
DO $$ BEGIN
  CREATE TYPE public.experience_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.experience_type AS ENUM ('on_campus', 'off_campus', 'internship', 'referral');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.offer_status AS ENUM ('selected', 'rejected', 'waitlisted', 'in_progress');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.interview_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  role text NOT NULL,
  year int NOT NULL,
  experience_type public.experience_type NOT NULL DEFAULT 'on_campus',
  difficulty text NOT NULL DEFAULT 'medium',
  offer_status public.offer_status NOT NULL DEFAULT 'in_progress',
  ctc_lpa numeric,
  location text,
  rounds jsonb NOT NULL DEFAULT '[]'::jsonb,
  tips text,
  overall_text text NOT NULL,
  status public.experience_status NOT NULL DEFAULT 'pending',
  moderation_notes text,
  moderated_by uuid,
  moderated_at timestamptz,
  upvotes int NOT NULL DEFAULT 0,
  views int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiences_status ON public.interview_experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_company ON public.interview_experiences(company_name);
CREATE INDEX IF NOT EXISTS idx_experiences_user ON public.interview_experiences(user_id);

ALTER TABLE public.interview_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved experiences"
  ON public.interview_experiences FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can submit experiences"
  ON public.interview_experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can update own pending experiences"
  ON public.interview_experiences FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update any experience"
  ON public.interview_experiences FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own pending experiences"
  ON public.interview_experiences FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can delete any experience"
  ON public.interview_experiences FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_experiences_updated_at
  BEFORE UPDATE ON public.interview_experiences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Votes table
CREATE TABLE IF NOT EXISTS public.experience_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.interview_experiences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (experience_id, user_id)
);

ALTER TABLE public.experience_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON public.experience_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.experience_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote"
  ON public.experience_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Maintain upvote counter
CREATE OR REPLACE FUNCTION public.handle_experience_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.interview_experiences SET upvotes = upvotes + 1 WHERE id = NEW.experience_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.interview_experiences SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.experience_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_experience_vote_insert
  AFTER INSERT ON public.experience_votes
  FOR EACH ROW EXECUTE FUNCTION public.handle_experience_vote();

CREATE TRIGGER trg_experience_vote_delete
  AFTER DELETE ON public.experience_votes
  FOR EACH ROW EXECUTE FUNCTION public.handle_experience_vote();
