import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  defaultLocalStoreConfig,
  getLocalStoreConfig,
  saveLocalStoreConfig,
  type LocalStoreConfig,
} from '@/lib/local-store';
import { updateCurrentLocalUser } from '@/lib/local-auth';

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
  profileImage: string;
}

interface StoreContextType {
  config: StoreConfig;
  updateConfig: (partial: Partial<StoreConfig>) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const defaultConfig: StoreConfig = defaultLocalStoreConfig;

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const persistConfig = (userId: string, nextConfig: LocalStoreConfig) => {
  saveLocalStoreConfig(userId, nextConfig);
  updateCurrentLocalUser({ storeName: nextConfig.storeName });
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<StoreConfig>(defaultConfig);

  const fetchData = useCallback(async () => {
    if (!user) {
      setConfig(defaultConfig);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const localConfig = getLocalStoreConfig(user.id);
      const mergedConfig = {
        ...localConfig,
        storeName: localConfig.storeName || user.storeName || 'Minha Loja',
      };

      setConfig(mergedConfig);
      persistConfig(user.id, mergedConfig);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateConfig = (partial: Partial<StoreConfig>) => {
    if (!user) return;

    setConfig((prev) => {
      const next = { ...prev, ...partial };
      persistConfig(user.id, next);
      return next;
    });
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!user) return;

    setConfig((prev) => {
      const next = {
        ...prev,
        products: [{ ...product, id: crypto.randomUUID() }, ...prev.products],
      };
      persistConfig(user.id, next);
      return next;
    });
  };

  const removeProduct = async (id: string) => {
    if (!user) return;

    setConfig((prev) => {
      const next = {
        ...prev,
        products: prev.products.filter((product) => product.id !== id),
      };
      persistConfig(user.id, next);
      return next;
    });
  };

  const updateProduct = async (product: Product) => {
    if (!user) return;

    setConfig((prev) => {
      const next = {
        ...prev,
        products: prev.products.map((item) => (item.id === product.id ? product : item)),
      };
      persistConfig(user.id, next);
      return next;
    });
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;

    setConfig((prev) => {
      const next = {
        ...prev,
        transactions: [{ ...transaction, id: crypto.randomUUID() }, ...prev.transactions],
      };
      persistConfig(user.id, next);
      return next;
    });
  };

  const removeTransaction = async (id: string) => {
    if (!user) return;

    setConfig((prev) => {
      const next = {
        ...prev,
        transactions: prev.transactions.filter((transaction) => transaction.id !== id),
      };
      persistConfig(user.id, next);
      return next;
    });
  };

  return (
    <StoreContext.Provider
      value={{
        config,
        updateConfig,
        addProduct,
        removeProduct,
        updateProduct,
        addTransaction,
        removeTransaction,
        isLoading,
        refreshData: fetchData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
