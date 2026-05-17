ALTER TABLE public.assessment_chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.assessment_chat_messages REPLICA IDENTITY FULL;
CREATE INDEX IF NOT EXISTS idx_chat_msgs_attempt_unread ON public.assessment_chat_messages(attempt_id) WHERE read_by_recipient = false;