import { z } from 'zod';
import { validateVariants, productStock, type InventoryProduct } from './inventory';

const money = z.number().finite().nonnegative().max(1e9);
const text = z.string().trim().min(1).max(160);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(`${v}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
});
export const operationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('receivable'), customer: text, phone: z.string().regex(/^\d{8,15}$/), description: text, amount: money.refine(v => v > 0), due: date, status: z.enum(['pending', 'paid', 'cancelled']), rentalId: z.string().max(80).optional() }),
  z.object({ kind: z.literal('return'), customer: text, description: text, reason: text, status: z.enum(['requested', 'approved', 'completed', 'cancelled']) }),
  z.object({ kind: z.literal('order'), customer: text, description: text, amount: money, status: z.enum(['new', 'preparing', 'ready', 'delivered', 'cancelled']) }),
  z.object({ kind: z.literal('recipe'), description: text, yield: z.number().int().positive().max(100000), price: money, ingredients: z.array(z.object({ name: text, quantity: z.number().finite().positive().max(1e6), unitCost: money })).min(1).max(100) }),
  z.object({ kind: z.literal('rental'), customer: text, phone: z.string().regex(/^\d{8,15}$/), description: text, amount: money.refine(v => v > 0), dueDay: z.number().int().min(1).max(28), commission: z.number().finite().min(0).max(100), start: date, end: date, adjustment: z.enum(['IPCA', 'IGPM', 'manual']), status: z.enum(['active', 'ended']) }),
]);
type DeepRequired<T> = T extends (infer U)[] ? DeepRequired<U>[] : T extends object ? { [K in keyof T]-?: DeepRequired<T[K]> } : T;
// Zod inference marks fields optional when the legacy project disables strictNullChecks.
export type Operation = DeepRequired<z.infer<typeof operationSchema>>;
export type BusinessRecord = Operation & { id: string };

export function validateOperation(input: unknown): Operation {
  const value = operationSchema.parse(input);
  if (value.kind === 'rental' && value.end < value.start) throw new Error('Invalid contract dates');
  return value as Operation;
}
export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function recipeCost(ingredients: { quantity: number; unitCost: number }[], yieldCount: number) {
  if (!Number.isInteger(yieldCount) || yieldCount < 1) throw new Error('Invalid yield');
  const total = roundMoney(ingredients.reduce((s, i) => {
    if (!Number.isFinite(i.quantity) || !Number.isFinite(i.unitCost) || i.quantity <= 0 || i.unitCost < 0) throw new Error('Invalid ingredient');
    return s + i.quantity * i.unitCost;
  }, 0));
  return { total, unit: roundMoney(total / yieldCount) };
}
export function rentalDistribution(amount: number, commission: number) {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(commission) || commission < 0 || commission > 100) throw new Error('Invalid rental');
  const fee = roundMoney(amount * commission / 100);
  return { fee, owner: roundMoney(amount - fee) };
}
export function restoreInventory(product: InventoryProduct, quantity: number, variantId?: string) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('Invalid quantity');
  const variants = validateVariants(product.variants);
  if (variants.length) {
    const selected = variants.find(v => v.id === variantId);
    if (!selected) throw new Error('Variant no longer exists');
    const updated = variants.map(v => v.id === variantId ? { ...v, stock: v.stock + quantity } : v);
    validateVariants(updated);
    return { stock: productStock({ stock: 0, variants: updated }), variants: updated };
  }
  if (variantId || !Number.isSafeInteger(product.stock) || product.stock < 0 || !Number.isSafeInteger(product.stock + quantity)) throw new Error('Invalid inventory');
  return { stock: product.stock + quantity, variants: [] };
}
export function returnAmount(saleAmount: number, sold: number, returned: number, quantity: number) {
  if (!Number.isFinite(saleAmount) || saleAmount <= 0 || !Number.isSafeInteger(sold) || sold < 1 || !Number.isSafeInteger(returned) || returned < 0 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity + returned > sold) throw new Error('Invalid return');
  // Cumulative rounding prevents cent differences on a final partial return.
  return roundMoney(roundMoney(saleAmount * (returned + quantity) / sold) - roundMoney(saleAmount * returned / sold));
}
export const MEI_ANNUAL_LIMIT = 81000;
export function meiSummary(transactions: { type: string; value: number; date: string; category: string; isPersonal: boolean }[], year: number, opened: string, serviceRevenue: number) {
  const opening = opened ? date.parse(opened) : '';
  const openingYear = opening ? Number(opening.slice(0, 4)) : year - 1;
  const months = openingYear > year ? 0 : openingYear === year ? 13 - Number(opening.slice(5, 7)) : 12;
  const sales = transactions.filter(t => t.type === 'entrada' && !t.isPersonal && t.category === 'Venda' && new Date(t.date).getFullYear() === year && (!opening || t.date.slice(0, 10) >= opening));
  const revenue = roundMoney(sales.reduce((s, t) => s + t.value, 0));
  if (!Number.isFinite(serviceRevenue) || serviceRevenue < 0 || serviceRevenue > revenue) throw new Error('Invalid service revenue');
  const limit = MEI_ANNUAL_LIMIT / 12 * months;
  return { revenue, services: serviceRevenue, commerce: roundMoney(revenue - serviceRevenue), limit, percentage: limit ? revenue / limit * 100 : 0, months };
}
export function profitEstimate(revenue: number, services: number, costs: number, withdrawals: number) {
  if ([revenue, services, costs, withdrawals].some(v => !Number.isFinite(v) || v < 0) || services > revenue) throw new Error('Invalid profit');
  const profit = Math.max(0, roundMoney(revenue - costs));
  const exemptEstimate = Math.min(profit, roundMoney((revenue - services) * 0.08 + services * 0.32));
  return { profit, exemptEstimate, potentiallyTaxable: Math.max(0, roundMoney(Math.min(withdrawals, profit) - exemptEstimate)) };
}