-- Create custom outreach templates table
CREATE TABLE public.outreach_custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'networking',
  platform TEXT NOT NULL DEFAULT 'linkedin',
  subject TEXT,
  body TEXT NOT NULL,
  placeholders TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outreach_custom_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own custom templates" 
ON public.outreach_custom_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom templates" 
ON public.outreach_custom_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom templates" 
ON public.outreach_custom_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom templates" 
ON public.outreach_custom_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index
CREATE INDEX idx_outreach_custom_templates_user_id ON public.outreach_custom_templates(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_outreach_custom_templates_updated_at
BEFORE UPDATE ON public.outreach_custom_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();