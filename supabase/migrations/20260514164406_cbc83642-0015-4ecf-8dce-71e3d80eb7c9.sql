CREATE TABLE IF NOT EXISTS public.analytics_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON public.analytics_cache(expires_at);

ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

-- No policies = no access for anon/authenticated; service_role bypasses RLS.
