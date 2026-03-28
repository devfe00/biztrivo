-- Drop the broad public policy
DROP POLICY IF EXISTS "Public can view active vitrine status" ON public.profiles;

-- Create a narrower products public select policy that doesn't depend on profiles
DROP POLICY IF EXISTS "Public can view active store products" ON public.products;

-- Use a security definer function to check if a user has active vitrine
CREATE OR REPLACE FUNCTION public.is_vitrine_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND vitrine_active = true
  );
$$;

-- Products public policy using the function (no profiles table scan needed)
CREATE POLICY "Public can view active store products"
  ON public.products
  FOR SELECT
  TO public
  USING (public.is_vitrine_active(user_id));

-- Explicit UPDATE deny on transactions (safe default, makes intent clear)
-- Actually we don't allow updates so no policy needed, but let's be explicit
-- No action needed since default-deny is correct

-- Enable leaked password protection (needs to be done via auth config, not SQL)