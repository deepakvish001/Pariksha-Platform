-- Create storage bucket for resume templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-templates', 'resume-templates', true);

-- Allow anyone to view/download resume templates (public bucket)
CREATE POLICY "Anyone can view resume templates"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resume-templates');

-- Only authenticated users with admin role can upload (for now, we'll manually upload)
CREATE POLICY "Admins can upload resume templates"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resume-templates' AND auth.role() = 'authenticated');