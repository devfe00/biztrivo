import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCurrentSubscription, hasActiveSubscription, redirectToCheckout } from '@/lib/billing';
import { useT } from '@/lib/i18n';
import { useLocation } from 'react-router-dom';
import UpgradeModal from '@/components/UpgradeModal';

const TRIAL_BLOCKED_ROUTES = ['/posts-ia'];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
      setCheckingSubscription(false);
      return;
    }

    if (!loading && user) {
      getCurrentSubscription(user.uid).then((sub) => {
        if (hasActiveSubscription(sub)) {
          setHasSubscription(true);
          if (sub?.plan === 'trial') {
            setIsTrial(true);
            if (TRIAL_BLOCKED_ROUTES.includes(location.pathname)) {
              setShowUpgradeModal(true);
            }
          }
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
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!hasSubscription) return null;

  if (isTrial && TRIAL_BLOCKED_ROUTES.includes(location.pathname)) {
    return (
      <>
        <UpgradeModal
          open={showUpgradeModal}
          onClose={() => { setShowUpgradeModal(false); navigate('/dashboard'); }}
          reason="Posts com IA está disponível apenas no plano PRO."
        />
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;