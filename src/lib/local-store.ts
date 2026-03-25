export interface LocalProduct {
  id: string;
  name: string;
  photo: string;
  originalPrice: number;
  discountPrice: number;
  description: string;
  stock: number;
}

export interface LocalTransaction {
  id: string;
  type: 'entrada' | 'saida';
  value: number;
  description: string;
  category: string;
  isPersonal: boolean;
  date: string;
}

export interface LocalStoreConfig {
  storeName: string;
  logo: string;
  primaryColor: string;
  whatsapp: string;
  products: LocalProduct[];
  transactions: LocalTransaction[];
  vitrineActive: boolean;
  vitrineClicks: number;
  profileImage: string;
}

const STORE_KEY = 'biztrivo:store:configs';

export const defaultLocalStoreConfig: LocalStoreConfig = {
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

const isBrowser = typeof window !== 'undefined';

const readStoreMap = (): Record<string, LocalStoreConfig> => {
  if (!isBrowser) return {};

  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LocalStoreConfig>) : {};
  } catch {
    return {};
  }
};

const writeStoreMap = (value: Record<string, LocalStoreConfig>) => {
  if (!isBrowser) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(value));
};

export const getLocalStoreConfig = (userId: string): LocalStoreConfig => {
  const storeMap = readStoreMap();
  return {
    ...defaultLocalStoreConfig,
    ...storeMap[userId],
    products: storeMap[userId]?.products ?? [],
    transactions: storeMap[userId]?.transactions ?? [],
  };
};

export const saveLocalStoreConfig = (userId: string, config: LocalStoreConfig) => {
  const storeMap = readStoreMap();
  storeMap[userId] = config;
  writeStoreMap(storeMap);
};

export const updateLocalStoreConfig = (
  userId: string,
  updater: (current: LocalStoreConfig) => LocalStoreConfig,
) => {
  const current = getLocalStoreConfig(userId);
  const next = updater(current);
  saveLocalStoreConfig(userId, next);
  return next;
};

export const listLocalStoreConfigs = () => {
  const storeMap = readStoreMap();
  return Object.entries(storeMap).map(([userId, config]) => ({ userId, config }));
};

export const slugifyStoreName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
