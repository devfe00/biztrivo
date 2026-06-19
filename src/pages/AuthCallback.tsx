import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/integrations/firebase/firebase';
import { getCurrentSubscription } from '@/lib/billing';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      if (!firebaseUser) {
        navigate('/login');
        return;
      }

      const sub = await getCurrentSubscription(firebaseUser.uid);

      const isActive = sub?.plan === 'pro' && (
        sub?.status === 'active' ||
        (sub?.status === 'cancelled' && sub?.currentPeriodEnd && new Date(sub.currentPeriodEnd.toDate ? sub.currentPeriodEnd.toDate() : sub.currentPeriodEnd) > new Date())
      );

      if (isActive) {
        navigate('/');
      } else {
        const email = firebaseUser.email || '';
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