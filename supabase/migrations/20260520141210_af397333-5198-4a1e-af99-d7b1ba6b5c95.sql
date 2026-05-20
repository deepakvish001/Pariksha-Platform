ALTER TABLE public.assessment_side_camera_pairings
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c
  FROM pg_constraint
  WHERE conrelid = 'public.assessment_side_camera_pairings'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.assessment_side_camera_pairings DROP CONSTRAINT %I', c);
  END IF;
END $$;

ALTER TABLE public.assessment_side_camera_pairings
  ADD CONSTRAINT assessment_side_camera_pairings_status_check
  CHECK (status IN ('pending','paired','disconnected','expired','closed'));