CREATE TABLE public.proctoring_purge_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  snapshots_deleted integer NOT NULL DEFAULT 0,
  events_deleted integer NOT NULL DEFAULT 0,
  snapshot_days integer,
  events_days integer,
  snapshot_cutoff timestamptz,
  event_cutoff timestamptz,
  source text NOT NULL DEFAULT 'manual',
  triggered_by uuid,
  error text
);

CREATE INDEX idx_proctoring_purge_runs_ran_at ON public.proctoring_purge_runs (ran_at DESC);

ALTER TABLE public.proctoring_purge_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view purge runs"
ON public.proctoring_purge_runs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));