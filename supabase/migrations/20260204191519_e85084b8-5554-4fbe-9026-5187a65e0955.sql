-- Create shared folders table for folder sharing functionality
CREATE TABLE public.shared_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid NOT NULL REFERENCES public.user_folders(id) ON DELETE CASCADE,
  share_code text NOT NULL UNIQUE,
  is_public boolean NOT NULL DEFAULT true,
  allow_copy boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT NULL
);

-- Create index for quick lookup by share code
CREATE UNIQUE INDEX idx_shared_folders_share_code ON public.shared_folders(share_code);
CREATE INDEX idx_shared_folders_folder_id ON public.shared_folders(folder_id);

-- Enable RLS
ALTER TABLE public.shared_folders ENABLE ROW LEVEL SECURITY;

-- Owners can manage their shared folders
CREATE POLICY "Users can create shares for their own folders"
ON public.shared_folders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_folders
    WHERE user_folders.id = shared_folders.folder_id
    AND user_folders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view shares for their own folders"
ON public.shared_folders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_folders
    WHERE user_folders.id = shared_folders.folder_id
    AND user_folders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete shares for their own folders"
ON public.shared_folders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_folders
    WHERE user_folders.id = shared_folders.folder_id
    AND user_folders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update shares for their own folders"
ON public.shared_folders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_folders
    WHERE user_folders.id = shared_folders.folder_id
    AND user_folders.user_id = auth.uid()
  )
);

-- Anyone can view public shared folders by share code (for the public view)
CREATE POLICY "Anyone can view public shared folders"
ON public.shared_folders
FOR SELECT
USING (is_public = true);