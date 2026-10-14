import type { LoyaltyCustomer } from '@/contexts/StoreContext';

/** Registers one purchase: adds a stamp; when stamps reach the goal, they reset and a reward is earned. */
export function addStamp(c: LoyaltyCustomer, goal: number, now = new Date()): { customer: LoyaltyCustomer; earnedReward: boolean } {
  const stamps = c.stamps + 1;
  const earnedReward = stamps >= goal;
  return {
    customer: {
      ...c,
      stamps: earnedReward ? 0 : stamps,
      rewards: c.rewards + (earnedReward ? 1 : 0),
      purchases: [...c.purchases, now.toISOString()].slice(-50),
    },
    earnedReward,
  };
}

export function daysSinceLastPurchase(c: LoyaltyCustomer, now = new Date()): number | null {
  const last = c.purchases[c.purchases.length - 1];
  if (!last) return null;
  return Math.floor((now.getTime() - new Date(last).getTime()) / 86400000);
}

/** Customers who bought before but have not returned in `days` or more. */
export function dormantCustomers(list: LoyaltyCustomer[], days: number, now = new Date()) {
  return list
    .map(c => ({ c, d: daysSinceLastPurchase(c, now) }))
    .filter((x): x is { c: LoyaltyCustomer; d: number } => x.d !== null && x.d >= days)
    .sort((a, b) => b.d - a.d);
}
