// src/contexts/I18nContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/integrations/firebase/firebase';
import i18n, { type Lang, normalizeLang, SUPPORTED_LANGS } from '@/i18n';

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => Promise<void>;
  t: ReturnType<typeof useTranslation>['t'];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LS_KEY = 'biztrivo:lang';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [lang, setLangState] = useState<Lang>(
    normalizeLang(localStorage.getItem(LS_KEY) ?? navigator.language)
  );

  // Quando o usuário loga, buscar o idioma salvo no Firestore.
  // Se existir → usa. Se não existir → persiste o idioma atual lá.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return;

      try {
        const snap = await getDoc(doc(db, 'profiles', user.uid));
        if (snap.exists() && snap.data()?.language) {
          const firestoreLang = normalizeLang(snap.data().language);
          // Firestore sobrescreve localStorage
          applyLang(firestoreLang);
        } else {
          // Persiste o idioma atual no Firestore (primeiro login)
          await updateDoc(doc(db, 'profiles', user.uid), { language: lang }).catch(() => {
            // Profile pode ainda não existir (será criado pelo setupUser), tudo bem
          });
        }
      } catch {
        // Sem permissão ou offline — mantém o idioma atual
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Só roda uma vez ao montar — a dependência `lang` seria circular

  const applyLang = useCallback((l: Lang) => {
    if (!SUPPORTED_LANGS.includes(l)) return;
    i18n.changeLanguage(l);
    localStorage.setItem(LS_KEY, l);
    setLangState(l);
  }, []);

  /**
   * Troca o idioma manualmente: atualiza i18next, localStorage e Firestore (se logado).
   * Nunca sobrescreve depois disso pelo detector automático.
   */
  const setLang = useCallback(
    async (l: Lang) => {
      applyLang(l);

      const user = auth.currentUser;
      if (user) {
        try {
          await updateDoc(doc(db, 'profiles', user.uid), { language: l });
        } catch {
          // Falha silenciosa — localStorage já foi atualizado
        }
      }
    },
    [applyLang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
