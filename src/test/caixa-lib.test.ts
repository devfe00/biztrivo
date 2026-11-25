import { describe, it, expect } from 'vitest';
import { parseCaixaDraft } from '@/lib/caixa-draft';
import { groupBySale } from '@/lib/sale-group';

const base = {
  version: 1,
  cart: [] as unknown[],
  value: '',
  description: '',
  category: 'Venda',
  selectedProductId: '',
  selectedVariantId: '',
  quantity: 1,
  isPersonal: false,
};
const item = { key: 'k1', productId: 'p1', quantity: 2, value: 75, label: 'Bermuda' };

describe('Caixa draft', () => {
  it('accepts a valid draft with cart items', () => {
    const draft = parseCaixaDraft({ ...base, cart: [item, { ...item, key: 'k2', variantId: 'v1' }] });
    expect(draft?.cart).toHaveLength(2);
  });
  it('rejects invalid quantity, value and unknown version', () => {
    expect(parseCaixaDraft({ ...base, cart: [{ ...item, quantity: 0 }] })).toBeNull();
    expect(parseCaixaDraft({ ...base, cart: [{ ...item, quantity: 1.5 }] })).toBeNull();
    expect(parseCaixaDraft({ ...base, cart: [{ ...item, value: -1 }] })).toBeNull();
    expect(parseCaixaDraft({ ...base, version: 2 })).toBeNull();
  });
  it('rejects garbage', () => {
    for (const raw of [null, undefined, 'x', 42, [], {}]) expect(parseCaixaDraft(raw)).toBeNull();
  });
});

describe('Sale groups', () => {
  it('keeps ungrouped items alone', () => {
    const groups = groupBySale([{ id: 'a' }, { id: 'b' }]);
    expect(groups.map(g => g.items.length)).toEqual([1, 1]);
  });
  it('groups by saleGroupId at the first occurrence', () => {
    const groups = groupBySale([
      { id: 'a', saleGroupId: 'g1' },
      { id: 'b' },
      { id: 'c', saleGroupId: 'g1' },
    ]);
    expect(groups.map(g => g.key)).toEqual(['g1', 'b']);
    expect(groups[0].items.map(i => i.id)).toEqual(['a', 'c']);
  });
});