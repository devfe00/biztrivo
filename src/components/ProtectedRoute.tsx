import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isPro } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const shouldGoLogin = !loading && !user;
  const shouldGoPlanos = !loading && !!user && !isPro && location.pathname !== '/planos';

  useEffect(() => {
    if (shouldGoLogin) {
      navigate('/login', { replace: true });
      return;
    }

    if (shouldGoPlanos) {
      navigate('/planos', { replace: true });
    }
  }, [shouldGoLogin, shouldGoPlanos, navigate]);

  if (loading || shouldGoLogin || shouldGoPlanos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
