import { describe, it, expect } from 'vitest';
import { deductStock, lowStockItems, productStock, validateVariants } from '@/lib/inventory';

const variants = [
  { id: 'p-red', size: 'P', color: 'Vermelho', stock: 2 },
  { id: 'm-blue', size: 'M', color: 'Azul', stock: 8 },
];

describe('Variant inventory', () => {
  it('sums individual stocks instead of the legacy total', () => {
    expect(productStock({ stock: 99, variants })).toBe(10);
  });
  it('deducts only the purchased size/color', () => {
    const result = deductStock({ stock: 10, variants }, 2, 'p-red');
    expect(result.stock).toBe(8);
    expect(result.variants?.map(v => v.stock)).toEqual([0, 8]);
    expect(variants[0].stock).toBe(2);
  });
  it('rejects a sale above the stock of the selected variant', () => {
    expect(() => deductStock({ stock: 10, variants }, 3, 'p-red')).toThrow();
  });
  it('requires selection for products with variants', () => {
    expect(() => deductStock({ stock: 10, variants }, 1)).toThrow();
  });
  it('rejects nonpositive or fractional sale quantities', () => {
    for (const quantity of [0, -1, 1.5, NaN]) expect(() => deductStock({ stock: 10 }, quantity)).toThrow();
  });
  it('retains simple product stock behavior', () => {
    expect(deductStock({ stock: 3 }, 2).stock).toBe(1);
    expect(() => deductStock({ stock: 3 }, 4)).toThrow();
  });
  it('includes low and exhausted variants even when the aggregate stock is high', () => {
    expect(lowStockItems({ stock: 10, variants, lowStockThreshold: 2 })).toEqual([{ label: 'P / Vermelho', stock: 2 }]);
    expect(lowStockItems({ stock: 0, lowStockThreshold: 0 })).toEqual([{ label: '', stock: 0 }]);
  });
  it('rejects duplicate size/color combinations', () => {
    expect(() => validateVariants([...variants, { ...variants[0], id: 'other', size: ' p ' }])).toThrow();
  });
  it('rejects invalid stock and empty variants', () => {
    for (const stock of [-1, 1.5, NaN]) expect(() => validateVariants([{ ...variants[0], stock }])).toThrow();
    expect(() => validateVariants([{ id: 'x', size: '', color: '', stock: 0 }])).toThrow();
  });
});