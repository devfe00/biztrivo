import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeText } from '@/lib/sanitize';

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
  dailyGoal: number;
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

const defaultConfig: StoreConfig = {
  storeName: 'Minha Loja',
  logo: '',
  primaryColor: '#3b82f6',
  whatsapp: '',
  products: [],
  transactions: [],
  vitrineActive: false,
  vitrineClicks: 0,
  profileImage: '',
  dailyGoal: 0,
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<StoreConfig>(defaultConfig);
  const pendingOps = useRef(new Set<string>());

  const fetchData = useCallback(async () => {
    if (!user) {
      setConfig(defaultConfig);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch profile, products, and transactions in parallel
      const [profileRes, productsRes, transactionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('products').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      const profile = profileRes.data;
      const products: Product[] = (productsRes.data ?? []).map(p => ({
        id: p.id,
        name: p.name,
        photo: p.photo ?? '',
        originalPrice: Number(p.original_price) || 0,
        discountPrice: Number(p.discount_price) || 0,
        description: p.description ?? '',
        stock: p.stock ?? 0,
      }));
      const transactions: Transaction[] = (transactionsRes.data ?? []).map(t => ({
        id: t.id,
        type: t.type as 'entrada' | 'saida',
        value: Number(t.value),
        description: t.description,
        category: t.category,
        isPersonal: t.is_personal ?? false,
        date: t.date,
      }));

      setConfig({
        storeName: profile?.store_name ?? 'Minha Loja',
        logo: profile?.logo ?? '',
        primaryColor: profile?.primary_color ?? '#3b82f6',
        whatsapp: profile?.whatsapp ?? '',
        vitrineActive: profile?.vitrine_active ?? false,
        vitrineClicks: profile?.vitrine_clicks ?? 0,
        profileImage: profile?.profile_image ?? '',
        dailyGoal: Number(profile?.daily_goal) || 0,
        products,
        transactions,
      });
    } catch (err) {
      console.error('Error fetching store data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateConfig = async (partial: Partial<StoreConfig>) => {
    if (!user) return;

    // Optimistic update
    setConfig(prev => ({ ...prev, ...partial }));

    // Map to DB columns
    const dbUpdate: Record<string, unknown> = {};
    if (partial.storeName !== undefined) dbUpdate.store_name = sanitizeText(partial.storeName);
    if (partial.logo !== undefined) dbUpdate.logo = partial.logo;
    if (partial.primaryColor !== undefined) dbUpdate.primary_color = partial.primaryColor;
    if (partial.whatsapp !== undefined) dbUpdate.whatsapp = partial.whatsapp;
    if (partial.vitrineActive !== undefined) dbUpdate.vitrine_active = partial.vitrineActive;
    if (partial.profileImage !== undefined) dbUpdate.profile_image = partial.profileImage;

    if (Object.keys(dbUpdate).length > 0) {
      await supabase.from('profiles').update(dbUpdate).eq('user_id', user.id);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!user) return;
    const opKey = `add-product-${product.name}-${product.discountPrice}`;
    if (pendingOps.current.has(opKey)) return;
    pendingOps.current.add(opKey);

    try {
      const { data, error } = await supabase.from('products').insert({
        user_id: user.id,
        name: sanitizeText(product.name),
        photo: product.photo,
        original_price: Math.max(0, product.originalPrice),
        discount_price: Math.max(0.01, product.discountPrice),
        description: sanitizeText(product.description),
        stock: Math.max(0, product.stock),
      }).select().single();

      if (error) throw error;
      if (data) {
        setConfig(prev => ({
          ...prev,
          products: [{
            id: data.id,
            name: data.name,
            photo: data.photo ?? '',
            originalPrice: Number(data.original_price) || 0,
            discountPrice: Number(data.discount_price) || 0,
            description: data.description ?? '',
            stock: data.stock ?? 0,
          }, ...prev.products],
        }));
      }
    } finally {
      pendingOps.current.delete(opKey);
    }
  };

  const removeProduct = async (id: string) => {
    if (!user) return;
    const opKey = `rm-product-${id}`;
    if (pendingOps.current.has(opKey)) return;
    pendingOps.current.add(opKey);

    try {
      setConfig(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
      await supabase.from('products').delete().eq('id', id).eq('user_id', user.id);
    } finally {
      pendingOps.current.delete(opKey);
    }
  };

  const updateProduct = async (product: Product) => {
    if (!user) return;
    const opKey = `upd-product-${product.id}`;
    if (pendingOps.current.has(opKey)) return;
    pendingOps.current.add(opKey);

    try {
      setConfig(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === product.id ? product : p),
      }));

      await supabase.from('products').update({
        name: sanitizeText(product.name),
        photo: product.photo,
        original_price: Math.max(0, product.originalPrice),
        discount_price: Math.max(0.01, product.discountPrice),
        description: sanitizeText(product.description),
        stock: Math.max(0, product.stock),
      }).eq('id', product.id).eq('user_id', user.id);
    } finally {
      pendingOps.current.delete(opKey);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    if (!transaction.value || transaction.value <= 0) {
      throw new Error('Valor da transação deve ser maior que zero.');
    }

    const opKey = `add-tx-${transaction.type}-${transaction.value}-${transaction.description}`;
    if (pendingOps.current.has(opKey)) return;
    pendingOps.current.add(opKey);

    try {
      const { data, error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: transaction.type,
        value: transaction.value,
        description: sanitizeText(transaction.description),
        category: sanitizeText(transaction.category),
        is_personal: transaction.isPersonal,
        date: transaction.date,
      }).select().single();

      if (error) throw error;
      if (data) {
        setConfig(prev => ({
          ...prev,
          transactions: [{
            id: data.id,
            type: data.type as 'entrada' | 'saida',
            value: Number(data.value),
            description: data.description,
            category: data.category,
            isPersonal: data.is_personal ?? false,
            date: data.date,
          }, ...prev.transactions],
        }));
      }
    } finally {
      pendingOps.current.delete(opKey);
    }
  };

  const removeTransaction = async (id: string) => {
    if (!user) return;
    const opKey = `rm-tx-${id}`;
    if (pendingOps.current.has(opKey)) return;
    pendingOps.current.add(opKey);

    try {
      setConfig(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
      await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
    } finally {
      pendingOps.current.delete(opKey);
    }
  };

  return (
    <StoreContext.Provider
      value={{ config, updateConfig, addProduct, removeProduct, updateProduct, addTransaction, removeTransaction, isLoading, refreshData: fetchData }}
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
