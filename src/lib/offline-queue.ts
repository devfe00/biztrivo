export interface OfflineSale {
  id: string;
  product: string;
  value: number;
  payment: string;
  date: string;
  productId?: string;
  variantId?: string;
  quantity?: number;
  error?: 'stock_error' | 'product_error' | 'sync_error';
}

export const offlineQueueKey = (uid: string) => `biztrivo:offline_queue:${uid}`;

export function readOfflineQueue(uid: string): { items: OfflineSale[]; ok: boolean } {
  try {
    const raw = localStorage.getItem(offlineQueueKey(uid));
    if (!raw) return { items: [], ok: true };
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? { items: parsed as OfflineSale[], ok: true } : { items: [], ok: true };
  } catch {
    return { items: [], ok: false };
  }
}

export function writeOfflineQueue(uid: string, items: OfflineSale[]): boolean {
  try {
    localStorage.setItem(offlineQueueKey(uid), JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function appendOfflineSales(uid: string, sales: OfflineSale[]): boolean {
  if (sales.length === 0) return true;
  const { items, ok } = readOfflineQueue(uid);
  if (!ok) return false;
  // Stored newest-first so Offline.tsx syncing oldest-first preserves cart order.
  return writeOfflineQueue(uid, [...[...sales].reverse(), ...items]);
}

export function pendingOfflineQuantity(queue: OfflineSale[], productId: string, variantId?: string): number {
  const targetVariant = variantId ?? '';
  return queue
    .filter(s => s.productId === productId && (s.variantId ?? '') === targetVariant)
    .reduce((sum, s) => sum + (s.quantity ?? 1), 0);
}

export function isOfflineError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err && typeof err.code === 'string' ? err.code.toLowerCase() : '';
  if (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'network-request-failed' ||
    code === 'auth/network-request-failed'
  ) {
    return true;
  }
  const message = 'message' in err && typeof err.message === 'string' ? err.message : '';
  return /offline|network|failed to fetch|unavailable|connection|internet/i.test(message);
}