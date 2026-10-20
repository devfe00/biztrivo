import { z } from 'zod';

export const BRAZIL_STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'] as const;
export const OFFICIAL_PORTALS = {
  nfse: 'https://www.nfse.gov.br/EmissorNacional/',
  das: 'https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao',
  goods: 'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
  mobile: 'https://www.gov.br/nfse/pt-br',
  mercadoPago: 'https://www.mercadopago.com.br/',
} as const;

// Includes the alphanumeric CNPJ format introduced in 2026; existing numeric CNPJs remain valid.
export function normalizeTaxId(value: string) { return value.replace(/[.\/\-\s]/g, '').toUpperCase(); }
export function validTaxId(value: string): boolean {
  const id = normalizeTaxId(value);
  if (/^\d{11}$/.test(id)) {
    if (/^(\d)\1+$/.test(id)) return false;
    const digit = (length: number) => {
      const sum = [...id.slice(0, length)].reduce((s, d, i) => s + Number(d) * (length + 1 - i), 0);
      const result = (sum * 10) % 11;
      return result === 10 ? 0 : result;
    };
    return digit(9) === Number(id[9]) && digit(10) === Number(id[10]);
  }
  if (!/^[A-Z0-9]{12}\d{2}$/.test(id) || /^(\d)\1+$/.test(id)) return false;
  const digit = (base: string, weights: number[]) => {
    const remainder = [...base].reduce((s, c, i) => s + (c.charCodeAt(0) - 48) * weights[i], 0) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = digit(id.slice(0,12), [5,4,3,2,9,8,7,6,5,4,3,2]);
  return id.slice(12) === `${first}${digit(id.slice(0,12) + first, [6,5,4,3,2,9,8,7,6,5,4,3,2])}`;
}
const text = z.string().trim().min(1).max(160).refine(v => !/[\x00-\x1F\x7F]/.test(v));
const taxId = z.string().transform(normalizeTaxId).refine(validTaxId);
const cnpj = taxId.refine(v => v.length === 14);
const money = z.number().finite().positive().max(1e9).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(`${v}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === v;
});
const customer = { customer: text, taxId };
export const serviceDraftSchema = z.object({
  ...customer, issuerCnpj: cnpj, description: text, amount: money, serviceCode: z.string().regex(/^\d{6}$/),
  date: day, city: text, state: z.enum(BRAZIL_STATES),
});
const goodsItem = z.object({ description: text, quantity: z.number().int().positive().max(1000000), unitPrice: money, ncm: z.string().regex(/^\d{8}$/).or(z.literal('')) });
export const goodsDraftSchema = z.object({
  ...customer, issuerCnpj: cnpj, state: z.enum(BRAZIL_STATES), address: text, city: text,
  postalCode: z.string().regex(/^\d{8}$/), items: z.array(goodsItem).min(1).max(100),
});
export const paymentDraftSchema = z.object({
  ...customer, email: z.string().trim().email().max(255), description: text, amount: money,
  method: z.enum(['pix', 'boleto']), due: day,
}).strict();
export function goodsTotal(items: { quantity: number; unitPrice: number; description: string; ncm: string }[]) {
  const parsed = z.array(goodsItem).min(1).max(100).parse(items);
  const cents = parsed.reduce((sum, item) => sum + item.quantity * Math.round(item.unitPrice * 100), 0);
  if (!Number.isSafeInteger(cents) || cents > 1e11) throw new Error('Invalid total');
  return cents / 100;
}
export function validateDas(cnpjValue: string, competence: string) {
  return z.object({ cnpj, competence: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) }).parse({ cnpj: cnpjValue, competence });
}
export function brl(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }