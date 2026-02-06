-- Create storage bucket for resume uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('resume-uploads', 'resume-uploads', false);

-- Storage policies for resume-uploads bucket
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resume-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resume-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE
USING (bucket_id = 'resume-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create resume_analyses table
CREATE TABLE public.resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  keyword_score INTEGER CHECK (keyword_score >= 0 AND keyword_score <= 100),
  format_score INTEGER CHECK (format_score >= 0 AND format_score <= 100),
  content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
  suggestions JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  keywords_found JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own analyses"
ON public.resume_analyses FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own analyses"
ON public.resume_analyses FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own analyses"
ON public.resume_analyses FOR DELETE
USING (user_id = auth.uid());