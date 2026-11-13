import { validTaxId } from './fiscal';

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
export interface PixInput { keyType: PixKeyType; key: string; name: string; city: string; amount: string; description: string }
export function pixText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}
export function normalizePixKey(type: PixKeyType, value: string): string {
  const key = value.trim();
  if (type === 'cpf' || type === 'cnpj') {
    const id = key.replace(/[.\-/\s]/g, '');
    if (!new RegExp(`^\\d{${type === 'cpf' ? 11 : 14}}$`).test(id) || !validTaxId(id)) throw new Error('key');
    return id;
  }
  if (type === 'email' && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(key) && key.length <= 77) return key.toLowerCase();
  if (type === 'phone') {
    const phone = key.replace(/[()\s-]/g, '');
    if (/^\+[1-9]\d{7,14}$/.test(phone)) return phone;
  }
  if (type === 'random' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return key.toLowerCase();
  throw new Error('key');
}
export function inferPixKeyType(key: string): PixKeyType {
  if (key.includes('@')) return 'email';
  if (key.trim().startsWith('+')) return 'phone';
  if (/^[\d.\-/\s]+$/.test(key) && key.replace(/\D/g, '').length === 11) return 'cpf';
  if (/^[\d.\-/\s]+$/.test(key) && key.replace(/\D/g, '').length === 14) return 'cnpj';
  return 'random';
}
export function pixAmountCents(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(normalized)) throw new Error('amount');
  const [whole, decimal = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('amount');
  return cents;
}
function tlv(tag: string, value: string): string {
  const length = new TextEncoder().encode(value).length;
  if (length > 99) throw new Error('invalid');
  return tag + String(length).padStart(2, '0') + value;
}

function crc16(value: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePix(input: PixInput, txid: string) {
  const key = normalizePixKey(input.keyType, input.key);
  const name = pixText(input.name), city = pixText(input.city), description = pixText(input.description);
  if (!name || name.length > 25) throw new Error('name');
  if (!city || city.length > 15) throw new Error('city');
  // Merchant Account Information is a nested EMV field with a 99-byte ceiling.
  if (description.length > Math.max(0, 99 - 22 - key.length - 4)) throw new Error('description');
  if (!/^[A-Za-z0-9]{1,25}$/.test(txid)) throw new Error('reference');
  const cents = pixAmountCents(input.amount);
  const account = tlv('00', 'br.gov.bcb.pix') + tlv('01', key) + (description ? tlv('02', description) : '');
  const amount = `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
  const body = tlv('00', '01') + tlv('26', account) + tlv('52', '0000')
    + tlv('53', '986') + tlv('54', amount) + tlv('58', 'BR')
    + tlv('59', name) + tlv('60', city) + tlv('62', tlv('05', txid)) + '6304';
  return { payload: body + crc16(body), key, name, city, description, cents, txid };
}