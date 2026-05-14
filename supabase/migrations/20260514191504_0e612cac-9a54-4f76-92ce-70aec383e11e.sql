CREATE TABLE IF NOT EXISTS public.analytics_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON public.analytics_cache(expires_at);

ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read analytics cache"
ON public.analytics_cache FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can write analytics cache"
ON public.analytics_cache FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));