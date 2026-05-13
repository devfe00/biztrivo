
-- 1. Lock down free_access_emails: deny-all policy (only SECURITY DEFINER funcs running as postgres bypass RLS)
CREATE POLICY "No direct access to free_access_emails"
ON public.free_access_emails
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 2. Revoke execute from anon/authenticated on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.ensure_user_setup(uuid, text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_pro_user(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_vitrine_active(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_subscription() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_transaction() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- is_vitrine_active is used by RLS policy on products (public can view active store products) -> needs anon
GRANT EXECUTE ON FUNCTION public.is_vitrine_active(uuid) TO anon, authenticated;

-- is_pro_user may be used by app for authenticated users
GRANT EXECUTE ON FUNCTION public.is_pro_user(uuid) TO authenticated;

-- ensure_user_setup is called via supabase.rpc from authenticated client on sign-in
GRANT EXECUTE ON FUNCTION public.ensure_user_setup(uuid, text, text) TO authenticated;

-- get_public_store_by_slug stays callable by anon (public storefront)
GRANT EXECUTE ON FUNCTION public.get_public_store_by_slug(text) TO anon, authenticated;
