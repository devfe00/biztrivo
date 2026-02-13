import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  photo: string;
  originalPrice: number;
  discountPrice: number;
  description: string;
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

const defaultConfig: StoreConfig = {
  storeName: 'Minha Loja',
  logo: '',
  primaryColor: '#3b82f6',
  whatsapp: '',
  products: [],
  transactions: [],
  vitrineActive: false,
  vitrineClicks: 0,
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<StoreConfig>(() => {
    const saved = localStorage.getItem('biztrivo-store');
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
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
