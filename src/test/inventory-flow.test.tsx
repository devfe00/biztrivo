import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n';
import Vitrine from '@/pages/Vitrine';

const state = vi.hoisted(() => ({
  addProduct: vi.fn(),
  registerProductSale: vi.fn(),
  getCurrentSubscription: vi.fn(),
  igModalOpened: vi.fn(),
}));

vi.mock('@/integrations/firebase/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  FUNCTIONS: {},
  callFunction: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'vitrine-test', email: 'loja@example.com' } }),
}));
vi.mock('@/lib/billing', async () => {
  const actual = await vi.importActual<typeof import('@/lib/billing')>('@/lib/billing');
  return { ...actual, getCurrentSubscription: state.getCurrentSubscription };
});
vi.mock('@/contexts/StoreContext', () => ({
  useStore: () => ({
    config: { slug: 'test', storeName: 'Loja', whatsapp: '', logo: '', primaryColor: '#3b82f6', vitrineActive: true, vitrineOnlyMode: false,
      products: [{ id: 'shirt', name: 'Camisa', description: '', photo: '', originalPrice: 50, discountPrice: 0, stock: 2, lowStockThreshold: 3,
        variants: [{ id: 'red', size: 'P', color: 'Vermelho', stock: 2 }] }],
    },
    addProduct: state.addProduct, registerProductSale: state.registerProductSale,
    updateProduct: vi.fn(), updateConfig: vi.fn(), removeProduct: vi.fn(),
  }),
}));
vi.mock('@/components/InstagramPostGenerator', () => ({
  default: ({ open, product }: { open: boolean; product: { name: string } }) =>
    open ? <div role="dialog" aria-label="ig-generator">Gerador {product.name}</div> : null,
}));
vi.mock('@/components/InvoiceComparator', () => ({ default: () => null }));
vi.mock('qrcode.react', () => ({ QRCodeCanvas: () => <canvas /> }));

beforeEach(() => {
  cleanup();
  localStorage.clear();
  localStorage.setItem('biztrivo:lang', 'pt');
  vi.clearAllMocks();
  state.getCurrentSubscription.mockResolvedValue({ plan: 'pro', status: 'active', currentPeriodEnd: null });
});

describe('Inventory management flow', () => {
  it('saves the size/color and its individual stock on product creation', async () => {
    render(<I18nProvider><Vitrine /></I18nProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.change(screen.getByPlaceholderText('Ex: Camiseta Básica'), { target: { value: 'Camiseta' } });
    fireEvent.change(screen.getByPlaceholderText('49,90'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar variação' }));
    fireEvent.change(screen.getByLabelText('Tamanho'), { target: { value: 'M' } });
    fireEvent.change(screen.getByLabelText('Cor'), { target: { value: 'Azul' } });
    fireEvent.change(screen.getByLabelText('Estoque'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Produto' }));
    await waitFor(() => expect(state.addProduct).toHaveBeenCalledWith(expect.objectContaining({ stock: 4, variants: [expect.objectContaining({ size: 'M', color: 'Azul', stock: 4 })] })));
  });

  it('cannot record a variant sale without selecting its size/color', () => {
    render(<I18nProvider><Vitrine /></I18nProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Registrar venda' }));
    expect(screen.getByRole('button', { name: 'Confirmar venda' })).toBeDisabled();
    expect(state.registerProductSale).not.toHaveBeenCalled();
  });

  it('blocks PostAI on Vitrine for trial and free users with UpgradeModal instead of opening the generator', async () => {
    for (const plan of ['trial', 'free'] as const) {
      cleanup();
      state.getCurrentSubscription.mockResolvedValue({ plan, status: 'active', currentPeriodEnd: null });
      render(<I18nProvider><Vitrine /></I18nProvider>);
      fireEvent.click(screen.getByRole('button', { name: 'Post IA' }));
      await screen.findByRole('link', { name: /Assinar a Biztrivo/i });
      expect(screen.queryByRole('dialog', { name: 'ig-generator' })).toBeNull();
    }
  });

  it('opens InstagramPostGenerator on Vitrine for active Pro subscribers', async () => {
    state.getCurrentSubscription.mockResolvedValue({ plan: 'pro', status: 'active', currentPeriodEnd: null });
    render(<I18nProvider><Vitrine /></I18nProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Post IA' }));
    await screen.findByRole('dialog', { name: 'ig-generator' });
    expect(screen.queryByRole('link', { name: /Assinar a Biztrivo/i })).toBeNull();
  });
});