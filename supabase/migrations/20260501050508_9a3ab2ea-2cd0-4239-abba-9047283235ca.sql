-- Owner is a superset of admin: any has_role check for 'admin' also passes if user is 'owner'.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (role = 'owner'::public.app_role AND _role = 'admin'::public.app_role)
      )
  );
$function$;

-- Grant owner role to Deepak (user 51584bc0-…)
INSERT INTO public.user_roles(user_id, role)
VALUES ('51584bc0-9abd-49fe-b2ee-78366156267f', 'owner'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Audit it
INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
VALUES (
  '51584bc0-9abd-49fe-b2ee-78366156267f',
  'grant_role', 'user',
  '51584bc0-9abd-49fe-b2ee-78366156267f',
  jsonb_build_object('role', 'owner', 'note', 'initial owner grant')
);