CREATE OR REPLACE FUNCTION public.is_pro_user(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
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