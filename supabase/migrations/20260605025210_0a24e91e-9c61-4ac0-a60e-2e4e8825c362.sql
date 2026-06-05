REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_transaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_user_setup(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_setup(uuid, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_pro_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pro_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_store_by_slug(text) TO anon, authenticated;