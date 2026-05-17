ALTER TABLE public.assessment_sos_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_sos_events;