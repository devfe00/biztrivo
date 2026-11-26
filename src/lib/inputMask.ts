import type { KeyboardEvent } from 'react';

export type InputMask = 'digits' | 'money' | 'taxid';

export function digitsOnly(value: string, max?: number): string {
  const d = value.replace(/\D/g, '');
  return max ? d.slice(0, max) : d;
}

export const sanitizeInt = (value: string, max = 9) => digitsOnly(value, max);

export function sanitizeMoney(value: string): string {
  const cleaned = value.replace(/[^\d.,]/g, '');
  const i = cleaned.search(/[.,]/);
  if (i === -1) return cleaned.slice(0, 9);
  const int = cleaned.slice(0, i).slice(0, 9) || '0';
  const dec = cleaned.slice(i + 1).replace(/[.,]/g, '').slice(0, 2);
  return `${int}${cleaned[i]}${dec}`;
}

export const sanitizeTaxId = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9./-]/g, '').slice(0, 18);

export function applyMask(mask: InputMask, value: string): string {
  if (mask === 'digits') return digitsOnly(value);
  if (mask === 'money') return sanitizeMoney(value);
  return sanitizeTaxId(value);
}

export const MASK_INPUT_MODE = { digits: 'numeric', money: 'decimal', taxid: 'text' } as const;

export function blockInvalidNumberKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
}

export type PixKeyKind = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export function sanitizePixKey(kind: PixKeyKind, value: string): string {
  switch (kind) {
    case 'cpf': return digitsOnly(value, 11);
    case 'cnpj': return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
    case 'phone': return value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '').slice(0, 14);
    case 'random': return value.toLowerCase().replace(/[^0-9a-f-]/g, '').slice(0, 36);
    default: return value.replace(/\s/g, '').slice(0, 77);
  }
}

export const pixKeyInputMode = (kind: PixKeyKind) =>
  kind === 'cpf' ? 'numeric' : kind === 'phone' ? 'tel' : kind === 'email' ? 'email' : 'text';