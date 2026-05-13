
-- 1) Whitelist table
CREATE TABLE IF NOT EXISTS public.free_access_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.free_access_emails ENABLE ROW LEVEL SECURITY;
-- No policies = no client access (only definer functions)

INSERT INTO public.free_access_emails (email) VALUES
  ('joao.vitor.queiroz987@gmail.com'),
  ('jennifersilvapg@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 2) Update password for existing João account
UPDATE auth.users
SET encrypted_password = crypt('Pegasus2003$', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE lower(email) = 'joao.vitor.queiroz987@gmail.com';

-- 3) Grant active Pro subscription to any existing whitelisted user
INSERT INTO public.subscriptions (user_id, status, plan, current_period_end)
SELECT u.id, 'active', 'pro', (now() + interval '100 years')
FROM auth.users u
JOIN public.free_access_emails f ON lower(u.email) = lower(f.email)
ON CONFLICT (user_id) DO UPDATE
  SET status = 'active',
      plan = 'pro',
      current_period_end = (now() + interval '100 years'),
      updated_at = now();

-- 4) Update ensure_user_setup to auto-grant Pro for whitelisted emails
CREATE OR REPLACE FUNCTION public.ensure_user_setup(_user_id uuid, _email text, _store_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _is_free boolean;
BEGIN
  INSERT INTO public.profiles (user_id, email, store_name)
  VALUES (_user_id, _email, COALESCE(NULLIF(trim(_store_name), ''), 'Minha Loja'))
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(NULLIF(EXCLUDED.email, ''), profiles.email),
    store_name = COALESCE(NULLIF(EXCLUDED.store_name, ''), profiles.store_name);

  SELECT EXISTS (
    SELECT 1 FROM public.free_access_emails WHERE lower(email) = lower(_email)
  ) INTO _is_free;

  IF _is_free THEN
    INSERT INTO public.subscriptions (user_id, status, plan, current_period_end)
    VALUES (_user_id, 'active', 'pro', (now() + interval '100 years'))
    ON CONFLICT (user_id) DO UPDATE
      SET status = 'active', plan = 'pro',
          current_period_end = (now() + interval '100 years'),
          updated_at = now();
  ELSE
    INSERT INTO public.subscriptions (user_id, status, plan)
    VALUES (_user_id, 'active', 'free')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'ensure_user_setup error for user %: %', _user_id, SQLERRM;
END;
$function$;

-- 5) Also patch handle_new_user_subscription trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _is_free boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.free_access_emails WHERE lower(email) = lower(NEW.email)
  ) INTO _is_free;

  IF _is_free THEN
    INSERT INTO public.subscriptions (user_id, status, plan, current_period_end)
    VALUES (NEW.id, 'active', 'pro', (now() + interval '100 years'))
    ON CONFLICT (user_id) DO UPDATE
      SET status = 'active', plan = 'pro',
          current_period_end = (now() + interval '100 years'),
          updated_at = now();
  ELSE
    INSERT INTO public.subscriptions (user_id, status, plan)
    VALUES (NEW.id, 'inactive', 'free')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user_subscription error for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- 6) Create Jennifer's auth user with the requested password (if not exists)
DO $$
DECLARE
  _uid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'jennifersilvapg@gmail.com') THEN
    _uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      _uid,
      'authenticated',
      'authenticated',
      'jennifersilvapg@gmail.com',
      crypt('Pegasus2003$', gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      jsonb_build_object('store_name','Minha Loja'),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), _uid,
      jsonb_build_object('sub', _uid::text, 'email', 'jennifersilvapg@gmail.com', 'email_verified', true),
      'email', _uid::text, now(), now(), now()
    );

    INSERT INTO public.profiles (user_id, email, store_name)
    VALUES (_uid, 'jennifersilvapg@gmail.com', 'Minha Loja')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.subscriptions (user_id, status, plan, current_period_end)
    VALUES (_uid, 'active', 'pro', (now() + interval '100 years'))
    ON CONFLICT (user_id) DO UPDATE
      SET status='active', plan='pro',
          current_period_end=(now() + interval '100 years'),
          updated_at=now();
  END IF;
END $$;
