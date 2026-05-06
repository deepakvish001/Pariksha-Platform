
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'proctor_viewer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'proctor_reviewer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'proctor_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'institution_admin';
