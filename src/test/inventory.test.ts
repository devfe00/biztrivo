import { describe, it, expect } from 'vitest';
import { deductStock, restoreStock, lowStockItems, productStock, validateVariants, unitPrice, priceRange, normalizeSearch } from '@/lib/inventory';

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
    it('restores only the selected variant without mutating the input', () => {
    const result = restoreStock({ stock: 10, variants }, 2, 'p-red');
    expect(result.variants?.map(v => v.stock)).toEqual([4, 8]);
    expect(result.stock).toBe(12);
    expect(variants[0].stock).toBe(2);
  });
  it('restores simple product stock', () => {
    expect(restoreStock({ stock: 3 }, 2).stock).toBe(5);
  });
  it('rejects restore for a variant that no longer exists', () => {
    expect(() => restoreStock({ stock: 10, variants }, 1, 'gone')).toThrow();
    expect(() => restoreStock({ stock: 10, variants }, 1)).toThrow();
  });
  it('rejects nonpositive or fractional restore quantities', () => {
    for (const quantity of [0, -1, 1.5, NaN]) expect(() => restoreStock({ stock: 10 }, quantity)).toThrow();
  });
  it('deduct then restore returns to the original stock', () => {
    const sold = deductStock({ stock: 10, variants }, 2, 'p-red');
    expect(restoreStock(sold, 2, 'p-red').variants?.map(v => v.stock)).toEqual([2, 8]);
  });

});  it('uses the variant price when set and falls back to the product price', () => {
    const priced = {
      originalPrice: 150,
      discountPrice: 0,
      variants: [
        { id: 'a', size: 'P', color: '', stock: 1 },
        { id: 'b', size: 'M', color: '', stock: 1, price: 200 },
      ],
    };
    expect(unitPrice(priced, 'a')).toBe(150);
    expect(unitPrice(priced, 'b')).toBe(200);
    expect(unitPrice(priced)).toBe(150);
    expect(priceRange(priced)).toEqual({ min: 150, max: 200 });
  });
  it('keeps a valid variant price and rejects invalid ones', () => {
    expect(validateVariants([{ ...variants[0], price: 200 }])[0].price).toBe(200);
    expect(validateVariants(variants)[0]).not.toHaveProperty('price');
    expect(validateVariants([{ ...variants[0], price: undefined }])[0]).not.toHaveProperty('price');
    for (const price of [0, -1, NaN, Infinity]) {
      expect(() => validateVariants([{ ...variants[0], price }])).toThrow();
    }

      it('normalizes search text ignoring case and accents', () => {
    expect(normalizeSearch('  Boné Preto ')).toBe('bone preto');
    expect(normalizeSearch('Bermúda')).toBe('bermuda');
  });
  
  });