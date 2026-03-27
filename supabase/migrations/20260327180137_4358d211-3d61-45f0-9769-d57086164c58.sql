
-- Unique constraints (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_unique') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_unique') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- ensure_user_setup function
CREATE OR REPLACE FUNCTION public.ensure_user_setup(_user_id uuid, _email text, _store_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, store_name)
  VALUES (_user_id, _email, COALESCE(NULLIF(_store_name, ''), 'Minha Loja'))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, status, plan)
  VALUES (_user_id, 'active', 'pro')
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Validation trigger for transactions
CREATE OR REPLACE FUNCTION public.validate_transaction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.value <= 0 THEN
    RAISE EXCEPTION 'Transaction value must be greater than zero';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_transaction_before_insert ON public.transactions;
CREATE TRIGGER validate_transaction_before_insert
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_transaction();

-- Updated_at triggers (drop if exist first)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
