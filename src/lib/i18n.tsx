import { createContext, useContext, useMemo, ReactNode } from 'react';
import pt from '@/i18n/locales/pt.json';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import fr from '@/i18n/locales/fr.json';
import { useLang, Lang } from '@/lib/useLang';

const dicts: Record<Lang, any> = { pt, en, es, fr };

function get(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
}

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: TFn } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { lang, setLang } = useLang();
  const value = useMemo(() => {
    const t: TFn = (key, vars) => {
      const v = get(dicts[lang], key) ?? get(dicts.en, key) ?? get(dicts.pt, key) ?? key;
      return typeof v === 'string' ? interpolate(v, vars) : key;
    };
    return { lang, setLang, t };
  }, [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): TFn {
  const ctx = useContext(Ctx);
  if (ctx) return ctx.t;
  // fallback outside provider
  return (key: string, vars?: Record<string, string | number>) => {
    const v = get(dicts.pt, key) ?? key;
    return typeof v === 'string' ? interpolate(v, vars) : key;
  };
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];