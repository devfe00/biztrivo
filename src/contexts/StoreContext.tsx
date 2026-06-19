// src/contexts/StoreContext.tsx
// Substitui a versão com Supabase — usa Firestore diretamente
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import {
  doc, collection, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/integrations/firebase/firebase';
import { sanitizeText } from '@/lib/sanitize';

async function uploadImageIfNeeded(dataUrlOrUrl: string, path: string): Promise<string> {
  if (!dataUrlOrUrl || !dataUrlOrUrl.startsWith('data:')) {
    return dataUrlOrUrl ?? '';
  }
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataUrlOrUrl, 'data_url');
  return getDownloadURL(storageRef);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
  slug: string;
  isMei: boolean;
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
  slug: '',
  isMei: false,
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
      const [profileSnap, productsSnap, transactionsSnap] = await Promise.all([
        getDoc(doc(db, 'profiles', user.uid)),
        getDocs(query(
          collection(db, 'products'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )),
        getDocs(query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )),
      ]);

      const profile = profileSnap.exists() ? profileSnap.data() : null;

      const products: Product[] = productsSnap.docs.map(d => {
        const p = d.data();
        return {
          id: d.id,
          name: p.name,
          photo: p.photo ?? '',
          originalPrice: Number(p.originalPrice) || 0,
          discountPrice: Number(p.discountPrice) || 0,
          description: p.description ?? '',
          stock: p.stock ?? 0,
        };
      });

      const transactions: Transaction[] = transactionsSnap.docs.map(d => {
        const t = d.data();
        return {
          id: d.id,
          type: t.type as 'entrada' | 'saida',
          value: Number(t.value),
          description: t.description,
          category: t.category,
          isPersonal: t.isPersonal ?? false,
          date: t.date?.toDate ? t.date.toDate().toISOString() : t.date,
        };
      });

      setConfig({
        storeName: profile?.storeName ?? 'Minha Loja',
        logo: profile?.logo ?? '',
        primaryColor: profile?.primaryColor ?? '#3b82f6',
        whatsapp: profile?.whatsapp ?? '',
        vitrineActive: profile?.vitrineActive ?? false,
        vitrineClicks: profile?.vitrineClicks ?? 0,
        profileImage: profile?.profileImage ?? '',
        dailyGoal: Number(profile?.dailyGoal) || 0,
        slug: profile?.slug ?? '',
        isMei: profile?.isMei ?? false,
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

    const dbUpdate: Record<string, unknown> = {};
    let logoUrl = partial.logo;
    let profileImageUrl = partial.profileImage;

    if (partial.storeName !== undefined) {
      const cleanName = sanitizeText(partial.storeName);
      dbUpdate.storeName = cleanName;
      dbUpdate.slug = `${slugify(cleanName)}-${user.uid.slice(0, 6).toLowerCase()}`;
    }
    if (partial.logo !== undefined) {
      logoUrl = await uploadImageIfNeeded(partial.logo, `profiles/${user.uid}/logo.jpg`);
      dbUpdate.logo = logoUrl;
    }
    if (partial.primaryColor !== undefined) dbUpdate.primaryColor = partial.primaryColor;
    if (partial.whatsapp !== undefined) dbUpdate.whatsapp = partial.whatsapp;
    if (partial.vitrineActive !== undefined) dbUpdate.vitrineActive = partial.vitrineActive;
    if (partial.profileImage !== undefined) {
      profileImageUrl = await uploadImageIfNeeded(partial.profileImage, `profiles/${user.uid}/profile.jpg`);
      dbUpdate.profileImage = profileImageUrl;
    }
    if (partial.dailyGoal !== undefined) dbUpdate.dailyGoal = partial.dailyGoal;
    if (partial.isMei !== undefined) dbUpdate.isMei = partial.isMei;

    setConfig(prev => ({ ...prev, ...partial, logo: logoUrl ?? prev.logo, profileImage: profileImageUrl ?? prev.profileImage }));

    if (Object.keys(dbUpdate).length > 0) {
      dbUpdate.updatedAt = serverTimestamp();
      await setDoc(doc(db, 'profiles', user.uid), dbUpdate, { merge: true });
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!user) return;
    const opKey = `add-product-${product.name}-${product.discountPrice}`;
    if (pendingOps.current.has(opKey)) return;
    pendingOps.current.add(opKey);

    try {
      const tempId = crypto.randomUUID();
      const photoUrl = await uploadImageIfNeeded(product.photo, `products/${user.uid}/${tempId}.jpg`);

      const docRef = await addDoc(collection(db, 'products'), {
        userId: user.uid,
        name: sanitizeText(product.name),
        photo: photoUrl,
        originalPrice: Math.max(0, product.originalPrice),
        discountPrice: Math.max(0.01, product.discountPrice),
        description: sanitizeText(product.description),
        stock: Math.max(0, product.stock),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setConfig(prev => ({
        ...prev,
        products: [{
          id: docRef.id,
          name: product.name,
          photo: photoUrl,
          originalPrice: product.originalPrice,
          discountPrice: product.discountPrice,
          description: product.description,
          stock: product.stock,
        }, ...prev.products],
      }));
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
      await deleteDoc(doc(db, 'products', id));
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
      const photoUrl = await uploadImageIfNeeded(product.photo, `products/${user.uid}/${product.id}.jpg`);
      const updatedProduct = { ...product, photo: photoUrl };

      setConfig(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === product.id ? updatedProduct : p),
      }));

      await updateDoc(doc(db, 'products', product.id), {
        name: sanitizeText(product.name),
        photo: photoUrl,
        originalPrice: Math.max(0, product.originalPrice),
        discountPrice: Math.max(0.01, product.discountPrice),
        description: sanitizeText(product.description),
        stock: Math.max(0, product.stock),
        updatedAt: serverTimestamp(),
      });
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
      const docRef = await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: transaction.type,
        value: transaction.value,
        description: sanitizeText(transaction.description),
        category: sanitizeText(transaction.category),
        isPersonal: transaction.isPersonal,
        date: transaction.date,
        createdAt: serverTimestamp(),
      });

      setConfig(prev => ({
        ...prev,
        transactions: [{
          id: docRef.id,
          type: transaction.type,
          value: transaction.value,
          description: transaction.description,
          category: transaction.category,
          isPersonal: transaction.isPersonal,
          date: transaction.date,
        }, ...prev.transactions],
      }));
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
      await deleteDoc(doc(db, 'transactions', id));
    } finally {
      pendingOps.current.delete(opKey);
    }
  };

  return (
    <StoreContext.Provider value={{
      config, updateConfig, addProduct, removeProduct, updateProduct,
      addTransaction, removeTransaction, isLoading, refreshData: fetchData,
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
