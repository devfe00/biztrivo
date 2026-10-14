import { describe, it, expect } from 'vitest';
import { addStamp, dormantCustomers } from '@/lib/loyalty';

const base = { id: '1', name: 'Ana', phone: '11999999999', stamps: 0, rewards: 0, purchases: [] as string[] };

describe('loyalty', () => {
  it('10th purchase earns 1 reward and resets stamps', () => {
    let c = { ...base, stamps: 9 };
    const r = addStamp(c, 10);
    expect(r.earnedReward).toBe(true);
    expect(r.customer.stamps).toBe(0);
    expect(r.customer.rewards).toBe(1);
  });
  it('9th purchase does not earn a reward', () => {
    const r = addStamp({ ...base, stamps: 8 }, 10);
    expect(r.earnedReward).toBe(false);
    expect(r.customer.stamps).toBe(9);
  });
  it('flags customers without purchase in X days', () => {
    const now = new Date('2026-10-14T12:00:00Z');
    const old = { ...base, purchases: ['2026-09-01T12:00:00Z'] };
    const recent = { ...base, id: '2', purchases: ['2026-10-10T12:00:00Z'] };
    const res = dormantCustomers([old, recent], 30, now);
    expect(res.map(x => x.c.id)).toEqual(['1']);
  });
});
