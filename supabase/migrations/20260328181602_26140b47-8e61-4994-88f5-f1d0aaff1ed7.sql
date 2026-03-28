-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS validate_transaction_trigger ON public.transactions;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- Attach triggers
CREATE TRIGGER validate_transaction_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Fix public profiles policy
DROP POLICY IF EXISTS "Public can view active store profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view active vitrine status" ON public.profiles;

-- Create security definer function to get public store data by slug
CREATE OR REPLACE FUNCTION public.get_public_store_by_slug(_slug text)
RETURNS TABLE(
  user_id uuid,
  store_name text,
  logo text,
  primary_color text,
  whatsapp text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.store_name, p.logo, p.primary_color, p.whatsapp
  FROM public.profiles p
  WHERE p.vitrine_active = true
    AND lower(regexp_replace(regexp_replace(p.store_name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) = _slug
  LIMIT 1;
$$;

-- Minimal public policy needed for products RLS subquery (only exposes vitrine_active and user_id)
CREATE POLICY "Public can view active vitrine status"
  ON public.profiles
  FOR SELECT
  TO public
  USING (vitrine_active = true);

-- Set whitelisted test users to 'pro'
UPDATE public.subscriptions 
SET status = 'active', plan = 'pro' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('fellipe.silva25@hotmail.com', 'paulo.sergioo3309@gmail.com')
);