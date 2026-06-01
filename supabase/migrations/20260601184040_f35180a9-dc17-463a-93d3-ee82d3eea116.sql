-- Fix: ensure_user_setup was overwriting customized store_name with default "Minha Loja"
-- on every sign-in because COALESCE(NULLIF('Minha Loja',''), ...) preferred the non-empty default.
-- Make it strictly insert-only for profile fields. Existing profiles are left untouched.
CREATE OR REPLACE FUNCTION public.ensure_user_setup(_user_id uuid, _email text, _store_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _is_free boolean;
BEGIN
  -- Only create the profile if it does not exist. Never overwrite user-edited fields.
  INSERT INTO public.profiles (user_id, email, store_name)
  VALUES (_user_id, _email, COALESCE(NULLIF(trim(_store_name), ''), 'Minha Loja'))
  ON CONFLICT (user_id) DO NOTHING;

  -- Backfill email only if it's currently empty (don't clobber a stored email)
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
    VALUES (_user_id, 'active', 'free')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'ensure_user_setup error for user %: %', _user_id, SQLERRM;
END;
$function$;