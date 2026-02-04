-- Create user folders table for organizing questions
CREATE TABLE public.user_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create folder items table for questions in folders
CREATE TABLE public.user_folder_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES public.user_folders(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_source TEXT NOT NULL DEFAULT 'interview', -- 'interview', 'dsa', 'mass-recruitment', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(folder_id, question_id, question_source)
);

-- Enable RLS on user_folders
ALTER TABLE public.user_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_folders
CREATE POLICY "Users can view their own folders"
ON public.user_folders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
ON public.user_folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON public.user_folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON public.user_folders FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on user_folder_items
ALTER TABLE public.user_folder_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_folder_items (through folder ownership)
CREATE POLICY "Users can view items in their folders"
ON public.user_folder_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_folders
  WHERE user_folders.id = user_folder_items.folder_id
  AND user_folders.user_id = auth.uid()
));

CREATE POLICY "Users can add items to their folders"
ON public.user_folder_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_folders
  WHERE user_folders.id = user_folder_items.folder_id
  AND user_folders.user_id = auth.uid()
));

CREATE POLICY "Users can remove items from their folders"
ON public.user_folder_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.user_folders
  WHERE user_folders.id = user_folder_items.folder_id
  AND user_folders.user_id = auth.uid()
));

-- Add trigger for updated_at on user_folders
CREATE TRIGGER update_user_folders_updated_at
BEFORE UPDATE ON public.user_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();