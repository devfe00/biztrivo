import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { hasActiveSubscription, redirectToCheckout } from '@/lib/billing';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
      setCheckingSubscription(false);
      return;
    }

    if (!loading && user) {
      supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (hasActiveSubscription(data)) {
            setHasSubscription(true);
          } else {
            redirectToCheckout(user.email);
          }
          setCheckingSubscription(false);
        });
    }
  }, [loading, user, navigate]);

  if (loading || checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!hasSubscription) return null;

  return <>{children}</>;
};

export default ProtectedRoute;