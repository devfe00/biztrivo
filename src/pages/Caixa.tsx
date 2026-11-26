import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Transaction } from '@/contexts/StoreContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Trash2, Pencil, Search, Wallet, Package, ChevronDown, ChevronUp, Plus, ShoppingCart, X, WifiOff } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { toast } from 'sonner';
import { useLang } from '@/lib/useLang';
import { sanitizeMoney } from '@/lib/inputMask';
import { productStock, variantLabel, unitPrice } from '@/lib/inventory';
import RemoveTransactionDialog, { type RemovalChoice } from '@/components/RemoveTransactionDialog';
import ProductPicker from '@/components/ProductPicker';
import { useAuth } from '@/contexts/AuthContext';
import { useCaixaT } from '@/lib/caixa-i18n';
import { type CartItem, caixaDraftKey, parseCaixaDraft } from '@/lib/caixa-draft';
import { groupBySale } from '@/lib/sale-group';
import { useBusinessRecords } from '@/hooks/useBusinessRecords';
import { appendOfflineSales, isOfflineError, pendingOfflineQuantity, readOfflineQueue, type OfflineSale } from '@/lib/offline-queue';

type PendingOfflineSale =
  | { kind: 'products'; lines: CartItem[] }
  | { kind: 'manual'; value: number; description: string };

const CATEGORY_KEYS = ['Venda', 'Reposição', 'Embalagem', 'Frete', 'Pessoal', 'Funcionário', 'Outros'] as const;
const CAT_LABEL_KEY: Record<string, string> = {
  'Venda': 'ext.cx_cat_venda',
  'Reposição': 'ext.cx_cat_reposicao',
  'Embalagem': 'ext.cx_cat_embalagem',
  'Frete': 'ext.cx_cat_frete',
  'Pessoal': 'ext.cx_cat_pessoal',
  'Funcionário': 'ext.cx_cat_funcionario',
  'Outros': 'ext.cx_cat_outros',
};

const Caixa = () => {
  const tr = useT();
  const navigate = useNavigate();
  const { config, addTransaction, updateTransaction, removeTransaction, cancelSale, undoCancelSale, registerProductSales, refreshData, isLoading } = useStore();
  const tc = useCaixaT();
  const { user } = useAuth();
  const businessApi = useBusinessRecords({ subscribe: false });
  const { notifySale, notifyPersonalExpense } = useNotifications();
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Venda');
  const [isPersonal, setIsPersonal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [removing, setRemoving] = useState<Transaction | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pendingOffline, setPendingOffline] = useState<PendingOfflineSale | null>(null);
  const [entryDate, setEntryDate] = useState(''); 
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Venda');
  const [editDay, setEditDay] = useState('');
  const [editPersonal, setEditPersonal] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const cartTotal = cart.reduce((sum, item) => sum + item.value, 0);

  const draftKey = user ? caixaDraftKey(user.uid) : null;
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    setDraftLoaded(false);
    if (!draftKey) return;
    try {
      const stored = localStorage.getItem(draftKey);
      const draft = stored ? parseCaixaDraft(JSON.parse(stored)) : null;
      if (draft) {
        setCart(draft.cart);
        setValue(draft.value);
        setDescription(draft.description);
        setCategory(draft.category);
        setSelectedProductId(draft.selectedProductId);
        setSelectedVariantId(draft.selectedVariantId);
        setQuantity(draft.quantity);
        setIsPersonal(draft.isPersonal);
        if (draft.cart.length > 0) toast.info(tc('draftRestored'));
      }
    } catch {
      // rascunho corrompido: começa vazio
    }
    setDraftLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !draftLoaded) return;
    try {
      if (cart.length === 0 && !value && !description && !selectedProductId) {
        localStorage.removeItem(draftKey);
      } else {
        localStorage.setItem(draftKey, JSON.stringify({
          version: 1, cart, value, description, category, selectedProductId, selectedVariantId, quantity, isPersonal,
        }));
      }
    } catch {
      // armazenamento indisponível ou cheio: o rascunho só não é persistido
    }
  }, [draftKey, draftLoaded, cart, value, description, category, selectedProductId, selectedVariantId, quantity, isPersonal]);

  useEffect(() => {
    if (!draftLoaded || isLoading || config.products.length === 0) return;
    const exists = (id: string) => config.products.some(p => p.id === id);
    setCart(prev => (prev.every(item => exists(item.productId)) ? prev : prev.filter(item => exists(item.productId))));
    if (selectedProductId && !exists(selectedProductId)) {
      setSelectedProductId('');
      setSelectedVariantId('');
      setQuantity(1);
    }
  }, [draftLoaded, isLoading, config.products, selectedProductId]);

  const { lang } = useLang();
  const txt = (pt: string, en: string, es: string, fr: string) => (lang === 'pt' ? pt : lang === 'es' ? es : lang === 'fr' ? fr : en);
  const [period, setPeriod] = useState('today');
  const localKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = localKey(new Date());
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang, { month: 'long', year: 'numeric' });
      return { key, label };
    });
  }, [lang]);

  const isToday = !entryDate || entryDate >= todayStr;
  //mantém o horário atual; outro dia vai ao meio-dia local (evita virar "dia anterior/seguinte" por fuso)
  const dayToISO = (day: string) => (day >= todayStr ? new Date().toISOString() : new Date(`${day}T12:00:00`).toISOString());
  const entryDateISO = () => dayToISO(entryDate || todayStr);
  const minEntryDate = `${months[months.length - 1].key}-01`;

  const todayTransactions = useMemo(() =>
    config.transactions
      .filter(t => {
        const k = localKey(new Date(t.date));
        return period === 'today' ? k === todayStr : k.startsWith(period);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [config.transactions, todayStr, period]
  );

  const runningBalance = useMemo(() => {
    let balance = 0;
    const sorted = [...todayTransactions].reverse();
    return sorted.map(t => {
      balance += t.type === 'entrada' ? t.value : -t.value;
      return { ...t, balance };
    }).reverse();
  }, [todayTransactions]);

  const totalEntradas = todayTransactions.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
  const totalSaidas = todayTransactions.filter(t => t.type === 'saida').reduce((s, t) => s + t.value, 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const resetProductSelection = () => {
    setSelectedProductId('');
    setSelectedVariantId('');
    setQuantity(1);
  };

  const handleAdd = async (type: 'entrada' | 'saida') => {
    if (type === 'entrada' && (selectedProductId || (cart.length > 0 && !value.trim()))) {
      await registerSale();
      return;
    }

    const numValue = parseFloat(value.replace(',', '.'));

    if (!numValue || numValue <= 0) {
      toast.error(tr('ext.cx_err_value'));
      return;
    }

    const resolvedDescription = description.trim() || category;

    if (!isToday && !navigator.onLine) {
      toast.error(txt('Sem internet: lançamentos em outra data precisam de conexão.', 'Offline: entries on another date need a connection.', 'Sin internet: los movimientos en otra fecha requieren conexión.', 'Hors ligne : les écritures à une autre date nécessitent une connexion.'));
      return;
    }

    if (type === 'entrada' && category === 'Venda' && !navigator.onLine) {
      setPendingOffline({ kind: 'manual', value: numValue, description: resolvedDescription });
      return;
    }

    try {
      await addTransaction({
        type,
        value: numValue,
        description: resolvedDescription,
        category,
        isPersonal: type === 'saida' && isPersonal,
        date: entryDateISO(),
      });

      toast.success(tr('ext.cx_ok_save'));
      if (type === 'entrada') notifySale(numValue);
      if (type === 'saida' && isPersonal) notifyPersonalExpense();

      setValue('');
      setDescription('');
      setIsPersonal(false);
      resetProductSelection();
    } catch (err) {
      console.error('Erro ao registrar lançamento:', err);
      if (type === 'entrada' && category === 'Venda' && isToday && isOfflineError(err)) {
        setPendingOffline({ kind: 'manual', value: numValue, description: resolvedDescription });
      } else {
        toast.error(tr('ext.cx_err_save'));
      }
    }
  };

  const handleRemove = async (id: string) => {
    const target = config.transactions.find(t => t.id === id);
    if (target?.productId && target.quantity) {
      setRemoving(target);
      return;
    }
    const removed = await removeTransaction(id);
    if (!removed) return;
    const { id: _id, ...data } = removed;
    toast(lang === 'pt' ? 'Lançamento removido' : lang === 'es' ? 'Movimiento eliminado' : lang === 'fr' ? 'Écriture supprimée' : 'Entry removed', {
      description: removed.description,
      duration: 8000,
      action: {
        label: lang === 'pt' ? 'Desfazer' : lang === 'es' ? 'Deshacer' : lang === 'fr' ? 'Annuler' : 'Undo',
        onClick: () => { addTransaction(data); },
      },
    });
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setEditValue(t.value.toFixed(2).replace('.', ','));
    setEditDescription(t.description);
    setEditCategory(t.category);
    setEditDay(localKey(new Date(t.date)));
    setEditPersonal(t.isPersonal);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const numValue = parseFloat(editValue.replace(',', '.'));
    if (!numValue || numValue <= 0) { toast.error(tr('ext.cx_err_value')); return; }
    if (!editDescription.trim()) { toast.error(tr('ext.cx_err_save')); return; }
    if (!navigator.onLine) { toast.error(tc('offlineBlock')); return; }
    const sameDay = editDay === localKey(new Date(editing.date));
    setEditBusy(true);
    try {
      await updateTransaction(editing.id, {
        value: numValue,
        description: editDescription.trim(),
        category: editCategory,
        isPersonal: editPersonal,
        date: sameDay ? editing.date : dayToISO(editDay),
      });
      toast.success(txt('Lançamento atualizado', 'Entry updated', 'Movimiento actualizado', 'Écriture mise à jour'));
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error && err.message === 'HAS_RETURNS'
        ? txt('Esta venda tem devolução: o valor não pode ser alterado.', 'This sale has a return: the amount cannot be changed.', 'Esta venta tiene devolución: no se puede cambiar el importe.', 'Cette vente a un retour : le montant ne peut pas être modifié.')
        : tr('ext.cx_err_save'));
    } finally {
      setEditBusy(false);
    }
  };

  const confirmRemove = async (choice: RemovalChoice) => {
    if (!removing) return;
    if (!navigator.onLine) {
      toast.error(tc('offlineBlock'));
      return;
    }
    setRemoveBusy(true);
    try {
      if (choice.reason === 'devolucao') {
        await businessApi.refund(removing.id, choice.quantity, choice.restock, 'Caixa');
        await refreshData();
        toast.success(tc('saleRefunded'));
        setRemoving(null);
        return;
      }
      const { removed, restocked } = await cancelSale(removing.id, { restock: choice.restock });
      setRemoving(null);
      toast(tc('saleRemoved'), {
        description: removed.description,
        duration: 8000,
        action: {
          label: tc('undo'),
          onClick: async () => {
            try {
              await undoCancelSale(removed, restocked);
            } catch {
              toast.error(tc('undoFail'));
            }
          },
        },
      });
      if (choice.restock && !restocked) {
        toast.warning(tc('restockFail'));
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message === 'HAS_RETURNS'
        ? tc('hasReturnsToast')
        : tr('ext.cx_err_save'));
    } finally {
      setRemoveBusy(false);
    }
  };

    const stageCurrentItem = (): CartItem | null => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (!numValue || numValue <= 0) { toast.error(tr('ext.cx_err_value')); return null; }
    const product = config.products.find(p => p.id === selectedProductId);
    if (!product) { toast.error(tr('ext.cx_err_product')); return null; }
    const variant = product.variants?.find(v => v.id === selectedVariantId);
    if (product.variants?.length && !variant) { toast.error(tr('ext.cx_variant_ph')); return null; }

    const inCart = cart
      .filter(item => item.productId === product.id && (item.variantId ?? '') === (variant?.id ?? ''))
      .reduce((sum, item) => sum + item.quantity, 0);
    const available = (variant ? variant.stock : productStock(product)) - inCart;
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > available) {
      toast.error(tr('ext.cx_err_stock'));
      return null;
    }

    return {
      key: crypto.randomUUID(),
      productId: product.id,
      variantId: variant?.id,
      quantity,
      value: numValue,
      label: `${product.name}${variant ? ` (${variantLabel(variant)})` : ''}`,
    };
  };

  const addToCart = () => {
    const item = stageCurrentItem();
    if (!item) return;
    setCart(prev => [...prev, item]);
    setValue('');
    setDescription('');
    resetProductSelection();
  };

  const registerSale = async () => {
    if (submitting) return;
    let lines = cart;
    if (selectedProductId) {
      const staged = stageCurrentItem();
      if (!staged) return;
      lines = [...cart, staged];
    }
    if (lines.length === 0) return;
    if (!navigator.onLine) {
      if (!isToday) {
        toast.error(txt('Sem internet: lançamentos em outra data precisam de conexão.', 'Offline: entries on another date need a connection.', 'Sin internet: los movimientos en otra fecha requieren conexión.', 'Hors ligne : les écritures à une autre date nécessitent une connexion.'));
        return;
      }
      setPendingOffline({ kind: 'products', lines });
      return;
    }
    setSubmitting(true);
    try {
      await registerProductSales(lines.map(line => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        totalValue: line.value,
      })), isToday ? undefined : entryDateISO());
      toast.success(tr('ext.cx_ok_product_sale'));
      notifySale(lines.reduce((sum, line) => sum + line.value, 0));
      setCart([]);
      setValue('');
      setDescription('');
      setIsPersonal(false);
      resetProductSelection();
    } catch (err) {
      console.error('Erro ao registrar venda com produtos:', err);
      if (isToday && isOfflineError(err)) {
        setPendingOffline({ kind: 'products', lines });
      } else {
        toast.error(tr('ext.cx_err_save'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSendOffline = () => {
    if (!user || !pendingOffline) return;
    const now = new Date().toISOString();
    let sales: OfflineSale[];
    if (pendingOffline.kind === 'products') {
      const { items: existing, ok } = readOfflineQueue(user.uid);
      if (!ok) {
        toast.error(tr('offline.storage_error'));
        return;
      }
      const requested = new Map<string, { productId: string; variantId?: string; qty: number }>();
      for (const line of pendingOffline.lines) {
        const mapKey = `${line.productId}::${line.variantId ?? ''}`;
        const prev = requested.get(mapKey);
        requested.set(mapKey, { productId: line.productId, variantId: line.variantId, qty: (prev?.qty ?? 0) + line.quantity });
      }
      for (const req of requested.values()) {
        const prod = config.products.find(p => p.id === req.productId);
        const variant = req.variantId ? prod?.variants?.find(v => v.id === req.variantId) : undefined;
        const available = prod ? (prod.variants?.length ? (variant?.stock ?? 0) : productStock(prod)) : 0;
        if (req.qty + pendingOfflineQuantity(existing, req.productId, req.variantId) > available) {
          toast.error(tc('offlineStockExceeded'));
          setPendingOffline(null);
          return;
        }
      }
      sales = pendingOffline.lines.map(line => ({
        id: crypto.randomUUID(),
        product: line.label,
        value: Math.round(line.value * 100) / 100,
        payment: 'Outro',
        date: now,
        productId: line.productId,
        ...(line.variantId ? { variantId: line.variantId } : {}),
        quantity: line.quantity,
      }));
    } else {
      sales = [{
        id: crypto.randomUUID(),
        product: pendingOffline.description,
        value: Math.round(pendingOffline.value * 100) / 100,
        payment: 'Outro',
        date: now,
        quantity: 1,
      }];
    }

    if (!appendOfflineSales(user.uid, sales)) {
      toast.error(tr('offline.storage_error'));
      return;
    }
    setCart([]);
    setValue('');
    setDescription('');
    setIsPersonal(false);
    resetProductSelection();
    setPendingOffline(null);
    toast.success(tc('offlineQueued'), {
      action: { label: tc('offlineViewQueue'), onClick: () => navigate('/offline') },
    });
  };

  const pendingOfflineTotal = pendingOffline
    ? pendingOffline.kind === 'products'
      ? pendingOffline.lines.reduce((sum, line) => sum + line.value, 0)
      : pendingOffline.value
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">{tr('ext.cx_title')}</h1>
        <p className="text-muted-foreground mt-1">{tr('ext.cx_subtitle')}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-none shadow-md text-center">
          <p className="text-xs text-muted-foreground">{tr('ext.cx_in')}</p>
          <p className="text-xl font-bold font-heading text-secondary">{formatCurrency(totalEntradas)}</p>
        </Card>
        <Card className="p-4 border-none shadow-md text-center">
          <p className="text-xs text-muted-foreground">{tr('ext.cx_out')}</p>
          <p className="text-xl font-bold font-heading text-destructive">{formatCurrency(totalSaidas)}</p>
        </Card>
        <Card className="p-4 border-none shadow-md text-center">
          <p className="text-xs text-muted-foreground">{tr('ext.cx_bal')}</p>
          <p className={`text-xl font-bold font-heading ${totalEntradas - totalSaidas >= 0 ? 'text-secondary' : 'text-destructive'}`}>
            {formatCurrency(totalEntradas - totalSaidas)}
          </p>
        </Card>
      </div>

      <Card className="p-6 border-none shadow-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="value">{tr('ext.cx_value')}</Label>
            <Input id="value" type="text" inputMode="decimal" placeholder="0,00" value={value} onChange={e => setValue(sanitizeMoney(e.target.value))} className="mt-1 text-lg font-semibold" />
          </div>
          <div>
            <Label htmlFor="category">{tr('ext.cx_category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_KEYS.map(c => <SelectItem key={c} value={c}>{tr(CAT_LABEL_KEY[c])}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              {tr('ext.cx_link_product')}
            </Label>
            <ProductPicker
              products={config.products}
              value={selectedProductId}
              disabled={config.products.length === 0}
              placeholder={config.products.length === 0 ? tr('ext.cx_link_no_products') : tr('ext.cx_link_none')}
              inStockLabel={tr('ext.cx_in_stock')}
              onChange={id => {
                setSelectedProductId(id);
                setSelectedVariantId('');
                setQuantity(1);
                if (id) {
                  const p = config.products.find(pr => pr.id === id);
                  if (p) {
                    setValue(unitPrice(p).toFixed(2).replace('.', ','));
                    setDescription(p.name);
                    setCategory('Venda');
                  }
                } else {
                  setValue('');
                  setDescription('');
                }
              }}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="desc">{tr('ext.cx_desc')}</Label>
          <Input id="desc" placeholder={tr('ext.cx_desc_ph')} value={description} onChange={e => setDescription(e.target.value)} className="mt-1" />
        </div>

        <div>
          <Label htmlFor="entry-date">{txt('Data do lançamento', 'Entry date', 'Fecha del movimiento', 'Date de l’écriture')}</Label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Input
              id="entry-date"
              type="date"
              value={entryDate || todayStr}
              min={minEntryDate}
              max={todayStr}
              onChange={e => setEntryDate(!e.target.value || e.target.value >= todayStr ? '' : e.target.value)}
              className="w-auto"
            />
            {!isToday && (
              <>
                <span className="text-xs font-medium text-warning">
                  {txt('Lançando em', 'Posting on', 'Registrando en', 'Saisie au')} {new Date(`${entryDate}T12:00:00`).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang)}
                </span>
                <button type="button" onClick={() => setEntryDate('')} className="text-xs underline text-muted-foreground hover:text-foreground">
                  {txt('Voltar para hoje', 'Back to today', 'Volver a hoy', 'Revenir à aujourd’hui')}
                </button>
              </>
            )}
          </div>
        </div>

        {selectedProductId && (() => {
          const p = config.products.find(pr => pr.id === selectedProductId);
          return p?.variants?.length ? (
            <div className="mt-2">
              <Label>{tr('ext.cx_variant')}</Label>
              <Select
                value={selectedVariantId}
                onValueChange={vid => {
                  setSelectedVariantId(vid);
                  const p2 = config.products.find(pr => pr.id === selectedProductId);
                  const v = p2?.variants?.find(va => va.id === vid);
                  if (p2 && v) {
                    const price = unitPrice(p2, vid);
                    setValue((price * quantity).toFixed(2).replace('.', ','));
                    setDescription(`${p2.name} (${variantLabel(v)})`);
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={tr('ext.cx_variant_ph')} />
                </SelectTrigger>
                <SelectContent>
                  {p.variants.map(v => (
                    <SelectItem key={v.id} value={v.id} disabled={v.stock === 0}>
                      {variantLabel(v)} · {v.stock === 0 ? tr('ext.cx_no_stock') : `${v.stock} un.`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null;
        })()}

        {selectedProductId && (
          <div className="mt-2 flex items-center gap-3">
            <Label>{tr('ext.cx_qty')}</Label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, quantity - 1);
                  setQuantity(next);
                  const p = config.products.find(pr => pr.id === selectedProductId);
                  if (p) {
                    const price = unitPrice(p, selectedVariantId || undefined);
                    setValue((price * next).toFixed(2).replace('.', ','));
                  }
                }}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-semibold text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => {
                  const p = config.products.find(pr => pr.id === selectedProductId);
                  if (!p) return;
                  const maxStock = p.variants?.length
                    ? p.variants.find(v => v.id === selectedVariantId)?.stock ?? 0
                    : productStock(p);
                  const next = Math.min(maxStock, quantity + 1);
                  setQuantity(next);
                  const price = unitPrice(p, selectedVariantId || undefined);
                  setValue((price * next).toFixed(2).replace('.', ','));
                }}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {selectedProductId && (
          <button
            type="button"
            onClick={addToCart}
            disabled={submitting}
            className="w-full py-2.5 rounded-lg border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {tc('cartAdd')}
          </button>
        )}

        {cart.length > 0 && (
          <div className="rounded-xl border border-border p-3 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              {tc('cartTitle')} ({cart.length})
            </p>
            {cart.map(item => (
              <div key={item.key} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 break-words">{item.quantity}x {item.label}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold">{formatCurrency(item.value)}</span>
                  <button
                    type="button"
                    aria-label={tc('cartRemove')}
                    onClick={() => setCart(prev => prev.filter(c => c.key !== item.key))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
              <span>{tc('cartTotal')}</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Switch checked={isPersonal} onCheckedChange={setIsPersonal} disabled={!!selectedProductId} />
          <Label className="text-sm cursor-pointer">{tr('ext.cx_personal')} <span className="text-muted-foreground">{tr('ext.cx_personal_hint')}</span></Label>
        </div>

        <div className="flex gap-4 pt-2">
          <button onClick={() => handleAdd('entrada')} disabled={submitting}
            className="flex-1 py-4 rounded-xl bg-secondary text-secondary-foreground font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-glow-green disabled:opacity-50">
            <TrendingUp className="w-6 h-6" /> {tr('ext.cx_btn_in')}
          </button>
          <button onClick={() => { resetProductSelection(); handleAdd('saida'); }}
            className="flex-1 py-4 rounded-xl bg-destructive text-destructive-foreground font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <TrendingDown className="w-6 h-6" /> {tr('ext.cx_btn_out')}
          </button>
        </div>
      </Card>

      {/* Ledger */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold font-heading">{tr('ext.cx_ledger')}</h2>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]" aria-label={tr('ext.cx_period')}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{tr('ext.cx_today')}</SelectItem>
              {months.map(m => <SelectItem key={m.key} value={m.key} className="capitalize">{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={tr('ext.cx_search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">{tr('ext.cx_all')}</SelectItem>
              {CATEGORY_KEYS.map(c => <SelectItem key={c} value={c}>{tr(CAT_LABEL_KEY[c])}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {(() => {
          const filtered = runningBalance.filter(t => {
            const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase());
            const matchCategory = filterCategory === 'Todas' || t.category === filterCategory;
            return matchSearch && matchCategory;
          });

          const entryBody = (t: (typeof filtered)[number]) => (
            <>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.type === 'entrada' ? 'bg-secondary/10' : 'bg-destructive/10'}`}>
                  {t.type === 'entrada' ? <TrendingUp className="w-5 h-5 text-secondary" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{CAT_LABEL_KEY[t.category] ? tr(CAT_LABEL_KEY[t.category]) : t.category}</span>
                    {period !== 'today' && <span className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang)}</span>}
                    {t.isPersonal && <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">{tr('ext.cx_personal_tag')}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`font-bold text-sm ${t.type === 'entrada' ? 'text-secondary' : 'text-destructive'}`}>
                    {t.type === 'entrada' ? '+' : '-'} {formatCurrency(t.value)}
                  </p>
                  <p className="text-xs text-muted-foreground">{tr('ext.cx_running')} {formatCurrency(t.balance)}</p>
                </div>
                {!t.originalSaleId && (
                  <>
                    <button onClick={() => openEdit(t)} aria-label={txt('Editar', 'Edit', 'Editar', 'Modifier')}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRemove(t.id)} aria-label={tr('ext.cx_confirm_rm')}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </>
          );

          return filtered.length === 0 ? (
            <Card className="p-10 border-none shadow-md text-center">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-primary/30" />
              <p className="text-lg font-semibold font-heading">
                {runningBalance.length === 0 ? tr('ext.cx_empty_title') : tr('ext.cx_none_title')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {runningBalance.length === 0 ? tr('ext.cx_empty_sub') : tr('ext.cx_none_sub')}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {groupBySale(filtered).map(group => {
                if (group.items.length === 1) {
                  const t = group.items[0];
                  return (
                    <Card key={t.id} className={`p-4 border-none shadow-sm flex items-center justify-between ${t.isPersonal ? 'border-l-4 border-l-warning bg-warning/5' : ''}`}>
                      {entryBody(t)}
                    </Card>
                  );
                }
                const groupTotal = group.items.reduce((sum, t) => sum + (t.type === 'entrada' ? t.value : -t.value), 0);
                return (
                  <Card key={group.key} className="border-none shadow-sm overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between bg-muted/40">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-secondary" />
                        <span className="font-semibold text-sm">{tc('saleOfItems', { n: group.items.length })}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-secondary">+ {formatCurrency(groupTotal)}</p>
                        <p className="text-xs text-muted-foreground">{tr('ext.cx_running')} {formatCurrency(group.items[0].balance)}</p>
                      </div>
                    </div>
                    <div className="divide-y divide-border">
                      {group.items.map(t => (
                        <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                          {entryBody(t)}
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        })()}
      </div>

      <RemoveTransactionDialog
        sale={removing}
        busy={removeBusy}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
      />

      <Dialog open={!!editing} onOpenChange={open => !open && !editBusy && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{txt('Editar lançamento', 'Edit entry', 'Editar movimiento', 'Modifier l’écriture')}</DialogTitle>
          </DialogHeader>
          {editing && (() => {
            const linked = !!editing.productId;
            const hasReturns = (editing.returnedQuantity ?? 0) > 0;
            return (
              <div className="space-y-4">
                {linked && (
                  <p className="text-xs text-muted-foreground">
                    {txt('Venda de produto: categoria e quantidade ficam travadas (afetam o estoque).', 'Product sale: category and quantity are locked (they affect stock).', 'Venta de producto: categoría y cantidad bloqueadas (afectan el inventario).', 'Vente de produit : catégorie et quantité verrouillées (impact sur le stock).')}
                  </p>
                )}
                <div>
                  <Label htmlFor="edit-value">{tr('ext.cx_value')}</Label>
                  <Input id="edit-value" inputMode="decimal" value={editValue} disabled={hasReturns} onChange={e => setEditValue(sanitizeMoney(e.target.value))} className="mt-1" />
                  {hasReturns && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {txt('Esta venda tem devolução: o valor não pode ser alterado.', 'This sale has a return: the amount cannot be changed.', 'Esta venta tiene devolución: no se puede cambiar el importe.', 'Cette vente a un retour : le montant ne peut pas être modifié.')}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-desc">{tr('ext.cx_desc')}</Label>
                  <Input id="edit-desc" value={editDescription} maxLength={200} onChange={e => setEditDescription(e.target.value)} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{tr('ext.cx_category')}</Label>
                    <Select value={editCategory} onValueChange={setEditCategory} disabled={linked}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_KEYS.map(c => <SelectItem key={c} value={c}>{tr(CAT_LABEL_KEY[c])}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-date">{txt('Data', 'Date', 'Fecha', 'Date')}</Label>
                    <Input id="edit-date" type="date" value={editDay} max={todayStr} onChange={e => e.target.value && setEditDay(e.target.value)} className="mt-1" />
                  </div>
                </div>
                {editing.type === 'saida' && !linked && (
                  <div className="flex items-center gap-3">
                    <Switch checked={editPersonal} onCheckedChange={setEditPersonal} />
                    <Label className="text-sm">{tr('ext.cx_personal')}</Label>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={editBusy} onClick={() => setEditing(null)}>
              {txt('Cancelar', 'Cancel', 'Cancelar', 'Annuler')}
            </Button>
            <Button type="button" disabled={editBusy} onClick={saveEdit}>
              {txt('Salvar', 'Save', 'Guardar', 'Enregistrer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingOffline} onOpenChange={open => !open && setPendingOffline(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-warning" />
              {tc('offlineSaleTitle')}
            </DialogTitle>
            <DialogDescription>
              {tc('offlineSaleDesc', { total: formatCurrency(pendingOfflineTotal) })}
            </DialogDescription>
          </DialogHeader>
          {pendingOffline && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm max-h-48 overflow-y-auto">
              {pendingOffline.kind === 'products' ? (
                pendingOffline.lines.map(line => (
                  <div key={line.key} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 break-words">{line.quantity}x {line.label}</span>
                    <span className="font-semibold shrink-0">{formatCurrency(line.value)}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 break-words">{pendingOffline.description}</span>
                  <span className="font-semibold shrink-0">{formatCurrency(pendingOffline.value)}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPendingOffline(null)}>
              {tc('offlineKeepHere')}
            </Button>
            <Button type="button" onClick={confirmSendOffline}>
              {tc('offlineSendQueue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Caixa;
