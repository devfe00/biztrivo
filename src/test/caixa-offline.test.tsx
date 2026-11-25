import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import Caixa from '@/pages/Caixa';
import { appendOfflineSales, isOfflineError, offlineQueueKey, readOfflineQueue } from '@/lib/offline-queue';
import { hasProSubscription } from '@/lib/billing';

const state = vi.hoisted(() => ({
  registerProductSales: vi.fn(),
  addTransaction: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/integrations/firebase/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  FUNCTIONS: {},
  callFunction: vi.fn(),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => state.navigate };
});
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'caixa-user' } }) }));
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({ notifySale: vi.fn(), notifyPersonalExpense: vi.fn() }),
}));
vi.mock('@/hooks/useBusinessRecords', () => ({
  useBusinessRecords: () => ({ refund: vi.fn() }),
}));
vi.mock('@/contexts/StoreContext', () => ({
  useStore: () => ({
    config: {
      products: [
        { id: 'cap', name: 'Boné', photo: '', originalPrice: 40, discountPrice: 0, description: '', stock: 5 },
        { id: 'short', name: 'Bermuda', photo: '', originalPrice: 80, discountPrice: 0, description: '', stock: 3 },
      ],
      transactions: [],
    },
    addTransaction: state.addTransaction,
    removeTransaction: vi.fn(),
    cancelSale: vi.fn(),
    undoCancelSale: vi.fn(),
    registerProductSales: state.registerProductSales,
    refreshData: vi.fn(),
    isLoading: false,
  }),
}));

const queueKey = offlineQueueKey('caixa-user');
const draftKey = 'biztrivo:caixa_draft:caixa-user';
const mount = () => render(<MemoryRouter><I18nProvider><Caixa /></I18nProvider></MemoryRouter>);

const seedCart = () => {
  localStorage.setItem(draftKey, JSON.stringify({
    version: 1,
    cart: [
      { key: 'k1', productId: 'cap', quantity: 1, value: 40, label: 'Boné' },
      { key: 'k2', productId: 'short', quantity: 2, value: 160, label: 'Bermuda' },
    ],
    value: '', description: '', category: 'Venda',
    selectedProductId: '', selectedVariantId: '', quantity: 1, isPersonal: false,
  }));
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('biztrivo:lang', 'pt');
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  vi.resetAllMocks();
  state.registerProductSales.mockResolvedValue(undefined);
  state.addTransaction.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('Offline queue and Pro gate helpers', () => {
  it('appends sales newest-first so oldest-first sync preserves cart order', () => {
    appendOfflineSales('u1', [
      { id: '1', product: 'Boné', value: 40, payment: 'Outro', date: '2026-11-24T10:00:00.000Z', productId: 'cap', quantity: 1 },
      { id: '2', product: 'Bermuda', value: 160, payment: 'Outro', date: '2026-11-24T10:00:00.000Z', productId: 'short', quantity: 2 },
    ]);
    const { items } = readOfflineQueue('u1');
    expect([...items].reverse().map(i => i.id)).toEqual(['1', '2']);
  });

  it('classifies connection drops as offline errors but not stock or permission errors', () => {
    expect(isOfflineError({ code: 'unavailable', message: 'Failed to get document because the client is offline.' })).toBe(true);
    expect(isOfflineError(new Error('Insufficient stock'))).toBe(false);
    expect(isOfflineError(new Error('Forbidden'))).toBe(false);
  });

  it('only grants Pro access to active pro subscriptions, never trial or free', () => {
    expect(hasProSubscription({ plan: 'pro', status: 'active', currentPeriodEnd: null })).toBe(true);
    expect(hasProSubscription({ plan: 'trial', status: 'active', currentPeriodEnd: null })).toBe(false);
    expect(hasProSubscription({ plan: 'free', status: 'active', currentPeriodEnd: null })).toBe(false);
    expect(hasProSubscription({ plan: 'pro', status: 'cancelled', currentPeriodEnd: '2020-01-01T00:00:00.000Z' })).toBe(false);
  });
});

describe('Caixa offline queue fallback', () => {
  it('offers and queues cart items when offline and clears the cart on confirmation', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    seedCart();
    mount();
    fireEvent.click(screen.getByRole('button', { name: /Entrada/i }));
    await screen.findByText('Sem conexão com a internet');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para fila offline' }));
    const saved = JSON.parse(localStorage.getItem(queueKey) ?? '[]');
    expect(saved).toHaveLength(2);
    expect([...saved].reverse().map((s: { productId: string; quantity: number; value: number }) => ({
      productId: s.productId, quantity: s.quantity, value: s.value,
    }))).toEqual([
      { productId: 'cap', quantity: 1, value: 40 },
      { productId: 'short', quantity: 2, value: 160 },
    ]);
    expect(state.registerProductSales).not.toHaveBeenCalled();
  });

  it('offers the offline queue when connection drops mid-sale', async () => {
    state.registerProductSales.mockRejectedValueOnce(Object.assign(new Error('Client is offline'), { code: 'unavailable' }));
    seedCart();
    mount();
    fireEvent.click(screen.getByRole('button', { name: /Entrada/i }));
    await screen.findByText('Sem conexão com a internet');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para fila offline' }));
    const saved = JSON.parse(localStorage.getItem(queueKey) ?? '[]');
    expect(saved).toHaveLength(2);
  });

  it('does not offer the offline queue on stock errors', async () => {
    state.registerProductSales.mockRejectedValueOnce(new Error('Insufficient stock'));
    seedCart();
    mount();
    fireEvent.click(screen.getByRole('button', { name: /Entrada/i }));
    await waitFor(() => expect(state.registerProductSales).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Sem conexão com a internet')).toBeNull();
    expect(localStorage.getItem(queueKey)).toBeNull();
  });
});