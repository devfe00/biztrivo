import { z } from 'zod';

export const variantSchema = z.object({
  id: z.string().min(1).max(80),
  size: z.string().trim().max(40),
  color: z.string().trim().max(40),
  stock: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
}).refine(v => Boolean(v.size || v.color), 'A variant needs a size or color');

export type ProductVariant = z.infer<typeof variantSchema>;

export function validateVariants(input: unknown): ProductVariant[] {
  const variants = z.array(variantSchema).max(100).parse(input ?? []);
  const ids = new Set<string>();
  const combinations = new Set<string>();
  for (const variant of variants) {
    const combination = JSON.stringify([variant.size.toLocaleLowerCase(), variant.color.toLocaleLowerCase()]);
    if (ids.has(variant.id) || combinations.has(combination)) throw new Error('Duplicate variant');
    ids.add(variant.id);
    combinations.add(combination);
  }
  return variants;
}

export interface InventoryProduct {
  stock: number;
  variants?: ProductVariant[];
  lowStockThreshold?: number;
}

export function productStock(product: InventoryProduct): number {
  return product.variants?.length
    ? product.variants.reduce((sum, variant) => sum + variant.stock, 0)
    : product.stock;
}

export function variantLabel(variant: ProductVariant): string {
  return [variant.size, variant.color].filter(Boolean).join(' / ');
}

export function lowStockItems(product: InventoryProduct): { label: string; stock: number }[] {
  const threshold = product.lowStockThreshold ?? 3;
  return (product.variants?.length
    ? product.variants.map(v => ({ label: variantLabel(v), stock: v.stock }))
    : [{ label: '', stock: product.stock }])
    .filter(item => item.stock <= threshold);
}

export function deductStock(product: InventoryProduct, quantity: number, variantId?: string): InventoryProduct {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('Invalid quantity');
  const variants = validateVariants(product.variants);
  if (variants.length) {
    const selected = variants.find(v => v.id === variantId);
    if (!selected || selected.stock < quantity) throw new Error('Unavailable variant');
    const updated = variants.map(v => v.id === variantId ? { ...v, stock: v.stock - quantity } : v);
    return { ...product, variants: updated, stock: productStock({ stock: 0, variants: updated }) };
  }
  if (variantId || !Number.isSafeInteger(product.stock) || product.stock < quantity) throw new Error('Insufficient stock');
  return { ...product, stock: product.stock - quantity };
}