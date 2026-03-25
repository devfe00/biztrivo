import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  canResetPasswordLocal,
  getLocalSession,
  requestPasswordResetLocal,
  signInLocal,
  signOutLocal,
  signUpLocal,
  type LocalSession,
  type LocalUser,
} from '@/lib/local-auth';

interface AuthContextType {
  user: LocalUser | null;
  session: LocalSession | null;
  loading: boolean;
  isPro: boolean;
  signUp: (email: string, password: string, storeName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  canResetPassword: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [canResetPassword, setCanResetPassword] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      const currentSession = getLocalSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setCanResetPassword(canResetPasswordLocal());
      setLoading(false);
    };

    syncSession();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith('biztrivo:auth')) {
        syncSession();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const signUp = async (email: string, password: string, storeName: string) => {
    const { error } = await signUpLocal(email, password, storeName);
    setCanResetPassword(canResetPasswordLocal());
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error, user: nextUser } = await signInLocal(email, password);

    if (error) {
      if (error.includes('Invalid login credentials')) {
        return { error: 'Email ou senha incorretos' };
      }
      return { error };
    }

    const nextSession = nextUser ? { user: nextUser } : null;
    setSession(nextSession);
    setUser(nextUser ?? null);
    setCanResetPassword(canResetPasswordLocal());
    return { error: null };
  };

  const signOut = async () => {
    await signOutLocal();
    setUser(null);
    setSession(null);
    setCanResetPassword(canResetPasswordLocal());
  };

  const resetPassword = async (email: string) => {
    const { error } = await requestPasswordResetLocal(email);
    setCanResetPassword(canResetPasswordLocal());
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isPro: user?.isPro ?? true,
        signUp,
        signIn,
        signOut,
        resetPassword,
        canResetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
