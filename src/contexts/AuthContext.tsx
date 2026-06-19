// src/contexts/AuthContext.tsx
// Substitui a versão com Supabase
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, FUNCTIONS, callFunction } from '@/integrations/firebase/firebase';

interface AuthContextType {
  user: User | null;
  session: User | null; // mantém compatibilidade — aponta pro mesmo user
  loading: boolean;
  signUp: (email: string, password: string, storeName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; user: User | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Garante que profile + subscription existem no Firestore
      if (firebaseUser) {
        setTimeout(async () => {
          try {
            await callFunction(FUNCTIONS.setupUser, {
              storeName: firebaseUser.displayName || 'Minha Loja',
            });
          } catch {
            // Profile pode já existir, tudo bem
          }
        }, 0);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, storeName: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      // Salva o storeName no displayName do Firebase Auth
      await updateProfile(newUser, { displayName: storeName.trim() || 'Minha Loja' });
      return { error: null };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') return { error: 'Este email já está cadastrado' };
      if (code === 'auth/weak-password') return { error: 'Senha muito fraca. Use pelo menos 6 caracteres' };
      return { error: (err as Error).message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: signedInUser } = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      return { error: null, user: signedInUser };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        return { error: 'Email ou senha incorretos', user: null };
      }
      return { error: (err as Error).message, user: null };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      return { error: null };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') return { error: null }; // usuário fechou, não é erro
      return { error: (err as Error).message };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), {
        url: `${window.location.origin}/login`,
      });
      return { error: null };
    } catch (err: unknown) {
      return { error: (err as Error).message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session: user, // compatibilidade com código que usa session
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
