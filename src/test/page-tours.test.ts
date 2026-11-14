import { beforeEach, describe, expect, it } from 'vitest';
import { hasSeenTour, markTourSeen, resetTours } from '@/lib/page-tours';
beforeEach(() => localStorage.clear());
describe('first-visit tours', () => {
  it('shows each screen once per user', () => {
    markTourSeen('u1', '/caixa');
    expect(hasSeenTour('u1', '/caixa')).toBe(true);
    expect(hasSeenTour('u1', '/vitrine')).toBe(false);
    expect(hasSeenTour('u2', '/caixa')).toBe(false);
  });
  it('review tutorials resets the screens', () => {
    markTourSeen('u1', '/caixa');
    resetTours('u1');
    expect(hasSeenTour('u1', '/caixa')).toBe(false);
  });
});
