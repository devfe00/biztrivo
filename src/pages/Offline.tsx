import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WifiOff, Wifi, Upload, Trash2, CheckCircle2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { productStock, unitPrice, variantLabel } from '@/lib/inventory';
import {
  type OfflineSale,
  pendingOfflineQuantity,
  readOfflineQueue,
  writeOfflineQueue,
} from '@/lib/offline-queue';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';

const paymentKeys: Record<string, string> = {
  Dinheiro: 'payment_cash', PIX: 'payment_pix', 'Cartão Débito': 'payment_debit',
  'Cartão Crédito': 'payment_credit', Outro: 'payment_other',
};

const Offline = () => {
  const t = useT();
  const { user } = useAuth();
  const { addTransaction, registerProductSale, config } = useStore();
  const [online, setOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<OfflineSale[]>([]);
  const queueRef = useRef<OfflineSale[]>([]);
  const uidRef = useRef(user?.uid);
  uidRef.current = user?.uid;
  const syncLock = useRef(false);
  const wasOnline = useRef(online);
  const [product, setProduct] = useState('');
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [value, setValue] = useState('');
  const [payment, setPayment] = useState('Dinheiro');
  const [syncing, setSyncing] = useState(false);
  const selectedProduct = config.products.find(p => p.id === productId);
  const selectedVariant = selectedProduct?.variants?.find(v => v.id === variantId);
  const hasVariants = Boolean(selectedProduct?.variants?.length);
  const availableStock = selectedProduct ? (hasVariants ? selectedVariant?.stock : productStock(selectedProduct)) : undefined;
  const paymentLabel = (method: string) => paymentKeys[method] ? t(`offline.${paymentKeys[method]}`) : method;

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    let loaded: OfflineSale[] = [];
    if (user) {
      const { items, ok } = readOfflineQueue(user.uid);
      if (!ok) toast.error(t('offline.storage_error'));
      loaded = items;
    }
    queueRef.current = loaded;
    setQueue(loaded);
    setProductId(''); setVariantId(''); setQuantity('1'); setProduct(''); setValue('');
  }, [user?.uid]);

  const persist = useCallback((next: OfflineSale[], uid: string) => {
    // Write before displaying success; a full/blocked browser store must not lose the queue.
    if (!writeOfflineQueue(uid, next)) { toast.error(t('offline.storage_error')); return false; }
    if (uidRef.current === uid) {
      queueRef.current = next;
      setQueue(next);
    }
    return true;
  }, [t]);

  const suggestValue = (id: string, variant: string, qty: string) => {
    const item = config.products.find(p => p.id === id);
    const count = Number(qty);
    if (!item || (item.variants?.length && !variant) || !Number.isSafeInteger(count) || count <= 0) {
      setValue(''); return;
    }
    setValue((Math.round(unitPrice(item, variant || undefined) * count * 100) / 100).toFixed(2));
  };

  const addSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || syncLock.current) return;
    const amount = Math.round(Number(value.trim().replace(',', '.')) * 100) / 100;
    const count = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(count) || count <= 0 || (!productId && !product.trim())) {
      toast.error(t('offline.fill_valid_fields')); return;
    }
    if (productId && (!selectedProduct || (hasVariants && !selectedVariant))) {
      toast.error(t('offline.select_variant')); return;
    }
    if (productId) {
      const pending = pendingOfflineQuantity(queueRef.current, productId, variantId || undefined);
      if (availableStock === undefined || count + pending > availableStock) {
        toast.error(t('offline.stock_error')); return;
      }
    }
    const label = selectedProduct
      ? `${selectedProduct.name}${selectedVariant ? ` (${variantLabel(selectedVariant)})` : ''}`
      : product.trim();
    const sale: OfflineSale = {
      id: crypto.randomUUID(), product: label, value: Math.round(amount * 100) / 100,
      payment, date: new Date().toISOString(), quantity: count,
      ...(productId ? { productId, ...(variantId ? { variantId } : {}) } : {}),
    };
    if (!persist([sale, ...queueRef.current], user.uid)) return;
    setProduct(''); setValue(''); setProductId(''); setVariantId(''); setQuantity('1');
    toast.success(t('offline.sale_saved'));
  };

  const removeSale = (id: string) => {
    if (!user || syncLock.current) return;
    persist(queueRef.current.filter(s => s.id !== id), user.uid);
  };

  const sync = useCallback(async () => {
    if (!online) { toast.error(t('offline.no_connection')); return; }
    if (!user || syncLock.current || queueRef.current.length === 0) return;
    syncLock.current = true;
    setSyncing(true);
    const uid = user.uid;
    // Oldest first, so earlier sales have priority when stock changed on another device.
    const batch = [...queueRef.current].reverse();
    let remaining = [...queueRef.current];
    let ok = 0;
    let failed = 0;
    try {
      for (const sale of batch) {
        if (uidRef.current !== uid) break;
        try {
          if (!Number.isFinite(sale.value) || sale.value <= 0 || !Number.isFinite(Date.parse(sale.date))) throw new Error('Invalid sale');
          if (sale.productId) {
            await registerProductSale(sale.productId, sale.quantity ?? 1, sale.variantId, sale.value, sale.date);
          } else {
            await addTransaction({
              type: 'entrada', value: sale.value,
              description: `${sale.product}${(sale.quantity ?? 1) > 1 ? ` (${sale.quantity}x)` : ''} (offline) • ${sale.payment}`,
              category: 'Venda', isPersonal: false, date: sale.date,
            });
          }
          remaining = remaining.filter(s => s.id !== sale.id);
          ok++;
        } catch (error) {
          const message = error instanceof Error ? error.message : '';
          const key: OfflineSale['error'] = /Insufficient stock|Unavailable variant|Invalid quantity/.test(message)
            ? 'stock_error' : /Product not found|Forbidden/.test(message) ? 'product_error' : 'sync_error';
          remaining = remaining.map(s => s.id === sale.id ? { ...s, error: key } : s);
          failed++;
        }
        // Persist each confirmed result, not only the whole batch at the end.
        if (!persist(remaining, uid)) break;
      }
    } finally {
      syncLock.current = false;
      setSyncing(false);
    }
    if (ok > 0) toast.success(t('offline.sales_synced', { count: ok }));
    if (failed > 0) toast.error(t('offline.sync_failed', { count: failed }));
  }, [online, user, addTransaction, registerProductSale, persist, t]);

  useEffect(() => {
    const restored = online && !wasOnline.current;
    wasOnline.current = online;
    if (restored && queueRef.current.length > 0) {
      toast.info(t('offline.connection_restored'));
      void sync();
    }
  }, [online, sync, t]);

  const total = queue.reduce((sum, sale) => sum + sale.value, 0);
  const fmt = (v: number) => v.toLocaleString(undefined, { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">{t('offline.page_title')}</h1>
        <p className="text-muted-foreground mt-1">{t('offline.page_subtitle')}</p>
      </div>
      <div className={`p-4 border-l-4 ${online ? 'border-l-secondary bg-secondary/5' : 'border-l-warning bg-warning/5'}`}>
        <div className="flex items-center gap-3">
          {online ? <Wifi className="w-5 h-5 text-secondary" /> : <WifiOff className="w-5 h-5 text-warning" />}
          <div className="flex-1">
            <p className="text-sm font-medium">{online ? t('offline.online_status') : t('offline.offline_status')}</p>
            <p className="text-xs text-muted-foreground">{online ? t('offline.online_hint') : t('offline.offline_hint')}</p>
          </div>
        </div>
      </div>
      <Card className="p-6 border-none shadow-md">
        <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> {t('offline.register_sale_title')}</h2>
        <form onSubmit={addSale} className="space-y-4">
          <fieldset disabled={syncing || !user} className="space-y-4 min-w-0">
            <div className="space-y-2">
              <Label htmlFor="offline-product">{t('offline.catalog_product')}</Label>
              <Select value={productId || 'none'} disabled={syncing} onValueChange={id => {
                const next = id === 'none' ? '' : id;
                setProductId(next); setVariantId(''); setQuantity('1'); setProduct('');
                suggestValue(next, '', '1');
              }}>
                <SelectTrigger id="offline-product"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('offline.free_sale')}</SelectItem>
                  {config.products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {config.products.length === 0 && <p className="text-xs text-muted-foreground">{t('offline.no_catalog')}</p>}
            </div>
            {!productId && <div className="space-y-2">
              <Label htmlFor="offline-description">{t('offline.product_placeholder')}</Label>
              <Input id="offline-description" placeholder={t('offline.product_placeholder')} value={product} onChange={e => setProduct(e.target.value)} />
            </div>}
            <div className="grid gap-4 sm:grid-cols-2">
              {hasVariants && <div className="space-y-2">
                <Label htmlFor="offline-variant">{t('offline.variant')}</Label>
                <Select value={variantId} disabled={syncing} onValueChange={id => { setVariantId(id); suggestValue(productId, id, quantity); }}>
                  <SelectTrigger id="offline-variant"><SelectValue placeholder={t('offline.select_variant')} /></SelectTrigger>
                  <SelectContent>{selectedProduct?.variants?.map(v => <SelectItem key={v.id} value={v.id}>{variantLabel(v)}</SelectItem>)}</SelectContent>
                </Select>
              </div>}
              <div className="space-y-2">
                <Label htmlFor="offline-quantity">{t('offline.quantity')}</Label>
                <Input id="offline-quantity" type="number" min="1" step="1" value={quantity} onChange={e => { setQuantity(e.target.value); suggestValue(productId, variantId, e.target.value); }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offline-value">{t('offline.total_value')}</Label>
                <Input id="offline-value" type="text" inputMode="decimal" placeholder={t('offline.value_placeholder')} value={value} onChange={e => setValue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offline-payment">{t('offline.payment_label')}</Label>
                <Select value={payment} disabled={syncing} onValueChange={setPayment}>
                  <SelectTrigger id="offline-payment"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(paymentKeys).map(method => <SelectItem key={method} value={method}>{paymentLabel(method)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {availableStock !== undefined && <p className="text-xs text-muted-foreground">{t('offline.available_stock', { count: availableStock })}</p>}
            <Button type="submit" disabled={syncing || !user} className="w-full gradient-primary text-primary-foreground shadow-glow"><Plus className="w-4 h-4 mr-2" />{t('offline.save_sale')}</Button>
          </fieldset>
        </form>
      </Card>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold font-heading">{t('offline.pending_title')}</h2>
            <p className="text-xs text-muted-foreground">{t('offline.pending_summary', { count: queue.length, total: fmt(total) })}</p>
          </div>
          <Button onClick={() => void sync()} disabled={!online || syncing || queue.length === 0} variant="secondary">
            <Upload className={`w-4 h-4 mr-2 ${syncing ? 'animate-pulse' : ''}`} />{t(syncing ? 'offline.syncing' : 'offline.sync_button')}
          </Button>
        </div>
        {queue.length === 0 ? <div className="text-center py-8 text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-secondary/60" /><p className="text-sm">{t('offline.no_pending')}</p>
        </div> : <div className="space-y-2">{queue.map(sale => <div key={sale.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted/40">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium break-words">{sale.product}{sale.quantity ? ` (${sale.quantity}x)` : ''}</p>
            <p className="text-xs text-muted-foreground">{paymentLabel(sale.payment)} • {new Date(sale.date).toLocaleString()}</p>
            {sale.error && <p role="alert" className="text-xs text-destructive mt-1">{t(`offline.${sale.error}`)}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-secondary whitespace-nowrap">{fmt(sale.value)}</span>
            <Button variant="ghost" size="icon" disabled={syncing} onClick={() => removeSale(sale.id)} aria-label={t('offline.remove_sale')} title={t('offline.remove_sale')}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>)}</div>}
      </section>
    </div>
  );
};

export default Offline;
