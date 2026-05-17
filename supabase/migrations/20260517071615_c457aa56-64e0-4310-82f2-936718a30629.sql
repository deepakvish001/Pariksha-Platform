-- Chat between candidate and org proctors during an assessment attempt
CREATE TABLE IF NOT EXISTS public.assessment_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('candidate', 'proctor', 'system')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  read_by_recipient boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acm_attempt_created
  ON public.assessment_chat_messages (attempt_id, created_at DESC);

ALTER TABLE public.assessment_chat_messages ENABLE ROW LEVEL SECURITY;

-- Candidate (attempt owner) can read their own thread
CREATE POLICY "candidate reads own chat"
  ON public.assessment_chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  );

-- Candidate can post as themselves to their own attempt
CREATE POLICY "candidate sends own chat"
  ON public.assessment_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND sender_role = 'candidate'
    AND EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  );

-- Org proctors / members can read the thread of any attempt in their org
CREATE POLICY "org reads attempt chat"
  ON public.assessment_chat_messages FOR SELECT TO authenticated
  USING (public.is_org_member(public.attempt_assessment_org(attempt_id)));

-- Org proctors can post as proctor
CREATE POLICY "org sends attempt chat"
  ON public.assessment_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND sender_role = 'proctor'
    AND public.is_org_member(public.attempt_assessment_org(attempt_id))
  );

-- Either side can mark messages as read on threads they have access to
CREATE POLICY "candidate marks own chat read"
  ON public.assessment_chat_messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "org marks attempt chat read"
  ON public.assessment_chat_messages FOR UPDATE TO authenticated
  USING (public.is_org_member(public.attempt_assessment_org(attempt_id)))
  WITH CHECK (public.is_org_member(public.attempt_assessment_org(attempt_id)));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_chat_messages;
ALTER TABLE public.assessment_chat_messages REPLICA IDENTITY FULL;