import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

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
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      setConfig({
        storeName: profile?.store_name || 'Minha Loja',
        logo: profile?.logo || '',
        primaryColor: profile?.primary_color || '#3b82f6',
        whatsapp: profile?.whatsapp || '',
        vitrineActive: profile?.vitrine_active || false,
        vitrineClicks: profile?.vitrine_clicks || 0,
        profileImage: profile?.profile_image || '',
        products: (products || []).map(p => ({
          id: p.id,
          name: p.name,
          photo: p.photo || '',
          originalPrice: Number(p.original_price) || 0,
          discountPrice: Number(p.discount_price) || 0,
          description: p.description || '',
          stock: p.stock || 0,
        })),
        transactions: (transactions || []).map(t => ({
          id: t.id,
          type: t.type as 'entrada' | 'saida',
          value: Number(t.value),
          description: t.description,
          category: t.category,
          isPersonal: t.is_personal || false,
          date: t.date,
        })),
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
    
    setConfig(prev => ({ ...prev, ...partial }));

    // Map frontend keys to DB columns
    const profileUpdate: Record<string, unknown> = {};
    if (partial.storeName !== undefined) profileUpdate.store_name = partial.storeName;
    if (partial.logo !== undefined) profileUpdate.logo = partial.logo;
    if (partial.primaryColor !== undefined) profileUpdate.primary_color = partial.primaryColor;
    if (partial.whatsapp !== undefined) profileUpdate.whatsapp = partial.whatsapp;
    if (partial.vitrineActive !== undefined) profileUpdate.vitrine_active = partial.vitrineActive;
    if (partial.profileImage !== undefined) profileUpdate.profile_image = partial.profileImage;

    if (Object.keys(profileUpdate).length > 0) {
      await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', user.id);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: product.name,
        photo: product.photo,
        original_price: product.originalPrice,
        discount_price: product.discountPrice,
        description: product.description,
        stock: product.stock,
      })
      .select()
      .single();

    if (data && !error) {
      setConfig(prev => ({
        ...prev,
        products: [{
          id: data.id,
          name: data.name,
          photo: data.photo || '',
          originalPrice: Number(data.original_price) || 0,
          discountPrice: Number(data.discount_price) || 0,
          description: data.description || '',
          stock: data.stock || 0,
        }, ...prev.products],
      }));
    }
  };

  const removeProduct = async (id: string) => {
    if (!user) return;
    await supabase.from('products').delete().eq('id', id).eq('user_id', user.id);
    setConfig(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
  };

  const updateProduct = async (product: Product) => {
    if (!user) return;
    await supabase
      .from('products')
      .update({
        name: product.name,
        photo: product.photo,
        original_price: product.originalPrice,
        discount_price: product.discountPrice,
        description: product.description,
        stock: product.stock,
      })
      .eq('id', product.id)
      .eq('user_id', user.id);

    setConfig(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === product.id ? product : p),
    }));
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: transaction.type,
        value: transaction.value,
        description: transaction.description,
        category: transaction.category,
        is_personal: transaction.isPersonal,
        date: transaction.date,
      })
      .select()
      .single();

    if (data && !error) {
      setConfig(prev => ({
        ...prev,
        transactions: [{
          id: data.id,
          type: data.type as 'entrada' | 'saida',
          value: Number(data.value),
          description: data.description,
          category: data.category,
          isPersonal: data.is_personal || false,
          date: data.date,
        }, ...prev.transactions],
      }));
    }
  };

  const removeTransaction = async (id: string) => {
    if (!user) return;
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
    setConfig(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  return (
    <StoreContext.Provider value={{
      config,
      updateConfig,
      addProduct,
      removeProduct,
      updateProduct,
      addTransaction,
      removeTransaction,
      isLoading,
      refreshData: fetchData,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
