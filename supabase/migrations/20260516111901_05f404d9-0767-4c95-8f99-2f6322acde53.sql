
-- Create 2 test auth users (idempotent) and link as owners of demo orgs.
DO $$
DECLARE
  college_uid uuid := '11111111-1111-1111-1111-111111111111';
  company_uid uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- College owner
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = college_uid) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', college_uid, 'authenticated', 'authenticated',
      'college-demo@parikshaa.org', crypt('CollegeDemo@2026', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo College Admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), college_uid,
      jsonb_build_object('sub', college_uid::text, 'email', 'college-demo@parikshaa.org', 'email_verified', true),
      'email', college_uid::text, now(), now(), now());
  END IF;

  -- Company owner
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = company_uid) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', company_uid, 'authenticated', 'authenticated',
      'company-demo@parikshaa.org', crypt('CompanyDemo@2026', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo Company Admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), company_uid,
      jsonb_build_object('sub', company_uid::text, 'email', 'company-demo@parikshaa.org', 'email_verified', true),
      'email', company_uid::text, now(), now(), now());
  END IF;

  -- Orgs
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'demo-college') THEN
    INSERT INTO public.organizations (name, type, slug, owner_id, status)
    VALUES ('Demo Institute of Technology', 'college', 'demo-college', college_uid, 'approved');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'demo-company') THEN
    INSERT INTO public.organizations (name, type, slug, owner_id, status)
    VALUES ('Demo Tech Pvt Ltd', 'company', 'demo-company', company_uid, 'approved');
  END IF;
END $$;
