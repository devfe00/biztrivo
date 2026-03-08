import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPro: boolean;
  signUp: (email: string, password: string, storeName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncProStatus = async (userId: string) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan, current_period_end')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;

      if (error || !data) {
        setIsPro(false);
        return;
      }

      const isActive =
        data.status === 'active' &&
        data.plan === 'pro' &&
        (!data.current_period_end || new Date(data.current_period_end) > new Date());

      setIsPro(isActive);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!isMounted) return;

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          await syncProStatus(nextSession.user.id);
        } else {
          setIsPro(false);
        }

        if (isMounted) setLoading(false);
      }
    );

    supabase.auth
      .getSession()
      .then(async ({ data: { session: existingSession } }) => {
        if (!isMounted) return;

        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        if (existingSession?.user) {
          await syncProStatus(existingSession.user.id);
        } else {
          setIsPro(false);
        }

        if (isMounted) setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsPro(false);
        setLoading(false);
      });

    const fallbackTimeout = window.setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 5000);

    return () => {
      isMounted = false;
      window.clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, storeName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { store_name: storeName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Email ou senha incorretos' };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsPro(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isPro, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
