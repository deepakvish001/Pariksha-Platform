-- Add sort_order column to user_folder_items for drag-and-drop reordering
ALTER TABLE public.user_folder_items 
ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX idx_user_folder_items_sort_order ON public.user_folder_items(folder_id, sort_order);