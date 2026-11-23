import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import Offline from '@/pages/Offline';

const state = vi.hoisted(() => ({
  addTransaction: vi.fn(), registerProductSale: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'offline-test' } }) }));
vi.mock('@/contexts/StoreContext', () => ({ useStore: () => ({
  config: { products: [{ id: 'shoe', name: 'Tênis', originalPrice: 100, discountPrice: 0, stock: 5,
    variants: [{ id: 'red-m', size: 'M', color: 'Vermelho', stock: 2, price: 120 }, { id: 'blue-p', size: 'P', color: 'Azul', stock: 3 }] }] },
  addTransaction: state.addTransaction, registerProductSale: state.registerProductSale,
}) }));
// The flow tests exercise selection values, not Radix portal/browser geometry.
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children, disabled }: { value: string; onValueChange: (v: string) => void; children: ReactNode; disabled?: boolean }) =>
    <select aria-label="selection" value={value} disabled={disabled} onChange={e => onValueChange(e.target.value)}>{children}</select>,
  SelectTrigger: () => null, SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => <option value={value}>{children}</option>,
}));

const key = 'biztrivo:offline_queue:offline-test';
const savedQueue = () => JSON.parse(localStorage.getItem(key) ?? '[]');
const mount = () => render(<I18nProvider><Offline /></I18nProvider>);
const selectProduct = () => fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'shoe' } });
const selectVariant = () => fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'red-m' } });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Salvar venda' }));
const sync = () => fireEvent.click(screen.getByRole('button', { name: 'Sincronizar' }));

beforeEach(() => {
  localStorage.clear(); localStorage.setItem('biztrivo:lang', 'pt');
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  vi.resetAllMocks();
  state.addTransaction.mockResolvedValue(undefined);
  state.registerProductSale.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('Offline sales queue', () => {
  it('suggests variant price times quantity and syncs the edited total and original date through the atomic sale path', async () => {
    mount(); selectProduct(); selectVariant();
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '2' } });
    expect(screen.getByLabelText('Valor total (R$)')).toHaveValue('240.00');
    fireEvent.change(screen.getByLabelText('Valor total (R$)'), { target: { value: '210,50' } });
    save();
    const sale = savedQueue()[0];
    expect(sale).toMatchObject({ productId: 'shoe', variantId: 'red-m', quantity: 2, value: 210.5 });
    sync();
    await waitFor(() => expect(savedQueue()).toEqual([]));
    expect(state.registerProductSale).toHaveBeenCalledExactlyOnceWith('shoe', 2, 'red-m', 210.5, sale.date);
    expect(state.addTransaction).not.toHaveBeenCalled();
  });

  it('requires a variant before queueing a catalog sale', () => {
    mount(); selectProduct();
    fireEvent.change(screen.getByLabelText('Valor total (R$)'), { target: { value: '100' } });
    save();
    expect(savedQueue()).toEqual([]);
    expect(state.registerProductSale).not.toHaveBeenCalled();
  });

  it('counts pending quantities against the cached stock of the selected variant', () => {
    mount(); selectProduct(); selectVariant();
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '2' } });
    save(); selectProduct(); selectVariant(); save();
    expect(savedQueue()).toHaveLength(1);
    expect(savedQueue()[0].quantity).toBe(2);
  });

  it('keeps a stock-conflicted catalog sale with an error, and retries without turning it into a free sale', async () => {
    state.registerProductSale.mockRejectedValueOnce(new Error('Unavailable variant'));
    mount(); selectProduct(); selectVariant(); save(); sync();
    await screen.findByRole('alert');
    expect(savedQueue()).toHaveLength(1);
    expect(savedQueue()[0].error).toBe('stock_error');
    expect(state.addTransaction).not.toHaveBeenCalled();
    sync();
    await waitFor(() => expect(savedQueue()).toEqual([]));
    expect(state.registerProductSale).toHaveBeenCalledTimes(2);
  });

  it('syncs a legacy text-only entry under Venda, not its payment method, preserving its sale date', async () => {
    localStorage.setItem(key, JSON.stringify([{ id: 'old', product: 'Livro', value: 25, payment: 'PIX', date: '2026-11-22T12:00:00.000Z' }]));
    mount(); sync();
    await waitFor(() => expect(savedQueue()).toEqual([]));
    expect(state.addTransaction).toHaveBeenCalledExactlyOnceWith({
      type: 'entrada', value: 25, description: 'Livro (offline) • PIX', category: 'Venda',
      isPersonal: false, date: '2026-11-22T12:00:00.000Z',
    });
    expect(state.registerProductSale).not.toHaveBeenCalled();
  });

  it('allows removing a queued sale without internet or a financial write', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    mount();
    fireEvent.change(screen.getByLabelText('Produto vendido'), { target: { value: 'Livro' } });
    fireEvent.change(screen.getByLabelText('Valor total (R$)'), { target: { value: '25' } });
    save(); expect(savedQueue()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Remover venda da fila' }));
    expect(savedQueue()).toEqual([]);
    expect(state.addTransaction).not.toHaveBeenCalled();
    expect(state.registerProductSale).not.toHaveBeenCalled();
  });

  it('automatically syncs once on reconnection even if online events are repeated', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    mount(); selectProduct(); selectVariant(); save();
    fireEvent(window, new Event('online')); fireEvent(window, new Event('online'));
    await waitFor(() => expect(savedQueue()).toEqual([]));
    expect(state.registerProductSale).toHaveBeenCalledTimes(1);
  });

  it('retains failed writes while removing only successfully synced entries from a mixed queue', async () => {
    localStorage.setItem(key, JSON.stringify([
      { id: 'new', product: 'Livro', value: 25, payment: 'PIX', date: '2026-11-22T13:00:00.000Z' },
      { id: 'old', product: 'Tênis', productId: 'shoe', variantId: 'red-m', quantity: 1, value: 120, payment: 'Dinheiro', date: '2026-11-22T12:00:00.000Z' },
    ]));
    state.registerProductSale.mockRejectedValueOnce(new Error('Insufficient stock'));
    mount(); sync();
    await waitFor(() => expect(savedQueue()).toHaveLength(1));
    expect(savedQueue()[0]).toMatchObject({ id: 'old', error: 'stock_error' });
    expect(state.addTransaction).toHaveBeenCalledTimes(1);
  });
});