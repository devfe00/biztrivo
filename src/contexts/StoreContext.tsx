import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  photo: string;
  originalPrice: number;
  discountPrice: number;
  description: string;
  stock: number;
}

export interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  value: number;
  description: string;
  category: string;
  isPersonal: boolean;
  date: string;
}

export interface StoreConfig {
  storeName: string;
  logo: string;
  primaryColor: string;
  whatsapp: string;
  products: Product[];
  transactions: Transaction[];
  vitrineActive: boolean;
  vitrineClicks: number;
  userPlan: 'gratuito' | 'pro';
}

interface StoreContextType {
  config: StoreConfig;
  updateConfig: (partial: Partial<StoreConfig>) => void;
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  updateProduct: (product: Product) => void;
  addTransaction: (transaction: Transaction) => void;
  removeTransaction: (id: string) => void;
}

const todayStr = new Date().toISOString().split('T')[0];

const seedTransactions: Transaction[] = [
  { id: 'seed-1', type: 'entrada', value: 150, description: 'Venda de camiseta estampada', category: 'Venda', isPersonal: false, date: `${todayStr}T09:00:00` },
  { id: 'seed-2', type: 'entrada', value: 80, description: 'Venda de boné personalizado', category: 'Venda', isPersonal: false, date: `${todayStr}T09:30:00` },
  { id: 'seed-3', type: 'entrada', value: 220, description: 'Venda de kit 3 camisetas', category: 'Venda', isPersonal: false, date: `${todayStr}T10:15:00` },
  { id: 'seed-4', type: 'entrada', value: 95, description: 'Venda de caneca personalizada', category: 'Venda', isPersonal: false, date: `${todayStr}T11:00:00` },
  { id: 'seed-5', type: 'entrada', value: 175, description: 'Venda de moletom básico', category: 'Venda', isPersonal: false, date: `${todayStr}T14:00:00` },
  { id: 'seed-6', type: 'saida', value: 200, description: 'Compra de camisetas no fornecedor', category: 'Reposição', isPersonal: false, date: `${todayStr}T08:00:00` },
  { id: 'seed-7', type: 'saida', value: 120, description: 'Reposição de bonés', category: 'Reposição', isPersonal: false, date: `${todayStr}T08:30:00` },
  { id: 'seed-8', type: 'saida', value: 45, description: 'Sacolas e caixas de papelão', category: 'Embalagem', isPersonal: false, date: `${todayStr}T09:45:00` },
  { id: 'seed-9', type: 'saida', value: 35, description: 'Envio para cliente SP', category: 'Frete', isPersonal: false, date: `${todayStr}T12:00:00` },
  { id: 'seed-10', type: 'saida', value: 60, description: 'Almoço e gasolina', category: 'Pessoal', isPersonal: true, date: `${todayStr}T13:00:00` },
];

const defaultConfig: StoreConfig = {
  storeName: 'Minha Loja',
  logo: '',
  primaryColor: '#3b82f6',
  whatsapp: '',
  products: [],
  transactions: seedTransactions,
  vitrineActive: false,
  vitrineClicks: 0,
  userPlan: 'gratuito',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<StoreConfig>(() => {
    const saved = localStorage.getItem('biztrivo-store');
    if (saved) {
      const parsed = { ...defaultConfig, ...JSON.parse(saved) };
      // Seed test transactions if none exist
      if (!parsed.transactions || parsed.transactions.length === 0) {
        parsed.transactions = seedTransactions;
      }
      return parsed;
    }
    return defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem('biztrivo-store', JSON.stringify(config));
  }, [config]);

  const updateConfig = (partial: Partial<StoreConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  const addProduct = (product: Product) => {
    setConfig(prev => ({ ...prev, products: [...prev.products, product] }));
  };

  const removeProduct = (id: string) => {
    setConfig(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
  };

  const updateProduct = (product: Product) => {
    setConfig(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === product.id ? product : p),
    }));
  };

  const addTransaction = (transaction: Transaction) => {
    setConfig(prev => ({ ...prev, transactions: [...prev.transactions, transaction] }));
  };

  const removeTransaction = (id: string) => {
    setConfig(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  return (
    <StoreContext.Provider value={{ config, updateConfig, addProduct, removeProduct, updateProduct, addTransaction, removeTransaction }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
