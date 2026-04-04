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
        .select('status, plan')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const isActive = sub?.status === 'active' && sub?.plan === 'pro';

      if (isActive) {
        navigate('/');
      } else {
        const email = session.user.email || '';
        window.location.href = `https://buy.stripe.com/test_aFadRa19XalV7n6fPab3q00?prefilled_email=${encodeURIComponent(email)}`;
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