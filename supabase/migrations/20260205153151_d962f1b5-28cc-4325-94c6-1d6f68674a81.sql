-- Create table for storing custom roadmap node ordering
CREATE TABLE public.user_roadmap_node_order (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  roadmap_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  node_order TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, roadmap_id, section_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_roadmap_node_order ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own node order" 
ON public.user_roadmap_node_order 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own node order" 
ON public.user_roadmap_node_order 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own node order" 
ON public.user_roadmap_node_order 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own node order" 
ON public.user_roadmap_node_order 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_roadmap_node_order_updated_at
BEFORE UPDATE ON public.user_roadmap_node_order
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();