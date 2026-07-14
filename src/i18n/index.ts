import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

export type Lang = 'pt' | 'en' | 'es' | 'fr';
export const SUPPORTED_LANGS: Lang[] = ['pt', 'en', 'es', 'fr'];

/**
 * Normalisa qualquer código de idioma do browser para um dos 4 suportados.
 * ex: 'pt-BR' → 'pt', 'en-US' → 'en', 'zh' → 'pt' (fallback)
 */
export function normalizeLang(raw: string | undefined | null): Lang {
  if (!raw) return 'pt';
  const code = raw.split('-')[0].toLowerCase() as Lang;
  return SUPPORTED_LANGS.includes(code) ? code : 'pt';
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    // A detecção de ordem é: localStorage → navigator → fallback
    // O I18nContext sobrescreve com o valor do Firestore após o login.
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'biztrivo:lang',
      caches: ['localStorage'],
    },
    fallbackLng: 'pt',
    supportedLngs: SUPPORTED_LANGS,
    interpolation: {
      escapeValue: false, // React já escapa
    },
    // Sem namespace separado para simplificar: t('dashboard.title')
    defaultNS: 'translation',
  });

export default i18n;
