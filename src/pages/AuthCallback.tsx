import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/login');
        return;
      }

      // Check subscription status
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, plan, current_period_end')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // Allow active or cancelled-with-grace-period
      const isActive = sub?.plan === 'pro' && (
        sub?.status === 'active' ||
        (sub?.status === 'cancelled' && sub?.current_period_end && new Date(sub.current_period_end) > new Date())
      );

      if (isActive) {
        navigate('/');
      } else {
        const email = session.user.email || '';
       const isBrazil = navigator.language?.startsWith('pt-BR') ||
  Intl.DateTimeFormat().resolvedOptions().timeZone === 'America/Sao_Paulo';
const paymentLink = isBrazil
  ? 'https://buy.stripe.com/00w5kEbOLdj35OmfwpgEg00'
  : 'https://buy.stripe.com/5kQ8wQcSPa6Ra4CfwpgEg01';
window.location.href = `${paymentLink}?prefilled_email=${encodeURIComponent(email)}`;
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default AuthCallback;