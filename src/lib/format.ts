// src/lib/format.ts
import type { Lang } from '@/i18n';

/** Mapeamento idioma → locale BCP-47 + moeda padrão */
const LOCALE_MAP: Record<Lang, { locale: string; currency: string }> = {
  pt: { locale: 'pt-BR', currency: 'BRL' },
  en: { locale: 'en-US', currency: 'USD' },
  es: { locale: 'es-419', currency: 'USD' }, // América Latina; ajuste conforme necessário
  fr: { locale: 'fr-FR', currency: 'EUR' },
};

/**
 * Formata um valor numérico como moeda de acordo com o idioma ativo.
 *
 * @example
 * formatCurrency(1234.5, 'pt') // 'R$ 1.234,50'
 * formatCurrency(1234.5, 'en') // '$1,234.50'
 */
export function formatCurrency(value: number, lang: Lang): string {
  const { locale, currency } = LOCALE_MAP[lang] ?? LOCALE_MAP.pt;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata uma data de acordo com o idioma ativo.
 *
 * @param date  - string ISO, timestamp (number) ou objeto Date
 * @param lang  - idioma ativo
 * @param opts  - opções adicionais do Intl.DateTimeFormat (opcional)
 *
 * @example
 * formatDate('2025-01-15', 'pt') // '15/01/2025'
 * formatDate('2025-01-15', 'en') // '1/15/2025'
 */
export function formatDate(
  date: string | number | Date,
  lang: Lang,
  opts?: Intl.DateTimeFormatOptions
): string {
  const { locale } = LOCALE_MAP[lang] ?? LOCALE_MAP.pt;
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, opts).format(d);
}
