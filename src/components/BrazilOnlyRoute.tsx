import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';

const BrazilOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { config, isLoading } = useStore();
  if (isLoading) return null;
  if (config.paisBase !== 'BR') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default BrazilOnlyRoute;