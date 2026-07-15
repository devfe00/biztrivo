import { useCallback, useEffect, useState } from 'react';

export type Lang = 'pt' | 'en' | 'es' | 'fr';
export const LANG_STORAGE_KEY = 'biztrivo:lang';

export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
    if (stored && ['pt', 'en', 'es', 'fr'].includes(stored)) return stored;
  } catch {}
  const nav = (typeof navigator !== 'undefined' && navigator.language) || '';
  if (nav.startsWith('pt')) return 'pt';
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('fr')) return 'fr';
  return 'en';
}

/**
 * Idioma global persistido em localStorage e sincronizado entre abas/telas.
 * Usado pela Landing, Register, Login etc. antes do usuário estar logado.
 */
export function useLang(): { lang: Lang; setLang: (l: Lang) => void } {
  const [lang, setLangState] = useState<Lang>(() => detectLang());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LANG_STORAGE_KEY && e.newValue) {
        setLangState(e.newValue as Lang);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(LANG_STORAGE_KEY, l); } catch {}
    setLangState(l);
  }, []);

  return { lang, setLang };
}