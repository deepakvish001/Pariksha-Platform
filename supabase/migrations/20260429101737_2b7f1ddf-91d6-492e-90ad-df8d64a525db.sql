-- 1. Extend user_study_plan_tasks
ALTER TABLE public.user_study_plan_tasks
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS actual_minutes integer,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_url text;

-- Drop any existing CHECK on status, then enforce via trigger (allows widening later without immutability issues)
DO $$
DECLARE
  c text;
BEGIN
  SELECT conname INTO c
  FROM pg_constraint
  WHERE conrelid = 'public.user_study_plan_tasks'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.user_study_plan_tasks DROP CONSTRAINT %I', c);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.validate_plan_task_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','in_progress','partial','done','skipped') THEN
    RAISE EXCEPTION 'Invalid task status: %', NEW.status;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_validate_plan_task_status ON public.user_study_plan_tasks;
CREATE TRIGGER trg_validate_plan_task_status
  BEFORE INSERT OR UPDATE OF status ON public.user_study_plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_plan_task_status();

-- 2. Focus sessions table
CREATE TABLE IF NOT EXISTS public.user_study_focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid REFERENCES public.user_study_plan_tasks(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  actual_minutes integer,
  completed_cycles integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started
  ON public.user_study_focus_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task
  ON public.user_study_focus_sessions(task_id);

ALTER TABLE public.user_study_focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own focus sessions"
  ON public.user_study_focus_sessions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own focus sessions"
  ON public.user_study_focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own focus sessions"
  ON public.user_study_focus_sessions FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own focus sessions"
  ON public.user_study_focus_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Platform sync schedule table
CREATE TABLE IF NOT EXISTS public.user_platform_sync_jobs (
  user_id uuid NOT NULL,
  platform text NOT NULL,
  handle text NOT NULL,
  interval_hours integer NOT NULL DEFAULT 24,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  last_status text,
  last_error text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_next_run
  ON public.user_platform_sync_jobs(next_run_at)
  WHERE enabled = true;

ALTER TABLE public.user_platform_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sync jobs"
  ON public.user_platform_sync_jobs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sync jobs"
  ON public.user_platform_sync_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sync jobs"
  ON public.user_platform_sync_jobs FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sync jobs"
  ON public.user_platform_sync_jobs FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_sync_jobs_updated ON public.user_platform_sync_jobs;
CREATE TRIGGER trg_sync_jobs_updated
  BEFORE UPDATE ON public.user_platform_sync_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();