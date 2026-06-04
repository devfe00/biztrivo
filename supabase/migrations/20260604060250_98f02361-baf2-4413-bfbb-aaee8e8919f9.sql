
-- Explicit GRANTs for Data API (PostgREST) compatibility with Oct 30, 2026 enforcement.
-- RLS policies are unchanged and still control row visibility.

GRANT SELECT ON public.ajudae_subscribers TO authenticated;
GRANT ALL ON public.ajudae_subscribers TO service_role;

GRANT ALL ON public.free_access_emails TO service_role;

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
