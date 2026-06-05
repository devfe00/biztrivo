DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_status_check'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_status_check;
  END IF;
END $$;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'inactive', 'past_due', 'canceled', 'cancelled'));

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_setup(_user_id uuid, _email text, _store_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_free boolean;
BEGIN
  INSERT INTO public.profiles (user_id, email, store_name)
  VALUES (_user_id, _email, COALESCE(NULLIF(trim(_store_name), ''), 'Minha Loja'))
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.profiles
     SET email = _email
   WHERE user_id = _user_id
     AND COALESCE(email, '') = ''
     AND COALESCE(_email, '') <> '';

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
    VALUES (_user_id, 'inactive', 'free')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'ensure_user_setup error for user %: %', _user_id, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_pro_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND plan = 'pro'
      AND (
        (status = 'active' AND (current_period_end IS NULL OR current_period_end > now()))
        OR
        (status = 'cancelled' AND current_period_end IS NOT NULL AND current_period_end > now())
      )
  )
$$;

UPDATE public.subscriptions s
   SET status = 'inactive', updated_at = now()
 WHERE s.status = 'active'
   AND s.plan = 'free'
   AND NOT EXISTS (
     SELECT 1
     FROM public.free_access_emails f
     JOIN auth.users u ON lower(u.email) = lower(f.email)
     WHERE u.id = s.user_id
   );