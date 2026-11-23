import { useState, useMemo } from 'react';
import { useStore, Transaction } from '@/contexts/StoreContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Trash2, Search, Wallet, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { toast } from 'sonner';
import { useLang } from '@/lib/useLang';
import { productStock, variantLabel, unitPrice } from '@/lib/inventory';
import RemoveTransactionDialog, { type RemovalChoice } from '@/components/RemoveTransactionDialog';
import { useBusinessRecords } from '@/hooks/useBusinessRecords';

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
  const { config, addTransaction, removeTransaction, cancelSale, undoCancelSale, registerProductSale, refreshData } = useStore();
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

  const { lang } = useLang();
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
    const numValue = parseFloat(value.replace(',', '.'));

    if (!numValue || numValue <= 0) {
      toast.error(tr('ext.cx_err_value'));
      return;
    }

    const resolvedDescription = description.trim() || category;

    if (type === 'entrada' && selectedProductId) {
      const product = config.products.find(p => p.id === selectedProductId);
      if (!product) { toast.error(tr('ext.cx_err_product')); return; }

      const available = product.variants?.length
        ? product.variants.find(v => v.id === selectedVariantId)?.stock ?? 0
        : productStock(product);

      if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > available) {
        toast.error(tr('ext.cx_err_stock'));
        return;
      }

      try {
        await registerProductSale(selectedProductId, quantity, selectedVariantId || undefined, numValue);
        toast.success(tr('ext.cx_ok_product_sale'));
        notifySale(numValue);
        setValue('');
        setDescription('');
        setIsPersonal(false);
        resetProductSelection();
      } catch (err) {
        console.error('Erro ao registrar venda com produto:', err);
        toast.error(tr('ext.cx_err_save'));
      }
      return;
    }

    try {
      await addTransaction({
        type,
        value: numValue,
        description: resolvedDescription,
        category,
        isPersonal: type === 'saida' && isPersonal,
        date: new Date().toISOString(),
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
      toast.error(tr('ext.cx_err_save'));
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

    const tl = (pt: string, en: string, es: string, fr: string) =>
    lang === 'pt' ? pt : lang === 'es' ? es : lang === 'fr' ? fr : en;

  const confirmRemove = async (choice: RemovalChoice) => {
    if (!removing) return;
    if (!navigator.onLine) {
      toast.error(tl(
        'Sem conexão. Remover ou devolver uma venda exige internet.',
        'No connection. Removing or returning a sale requires internet.',
        'Sin conexión. Eliminar o devolver una venta requiere internet.',
        'Pas de connexion. Supprimer ou retourner une vente nécessite internet.',
      ));
      return;
    }
    setRemoveBusy(true);
    try {
      if (choice.reason === 'devolucao') {
        await businessApi.refund(removing.id, choice.quantity, choice.restock, 'Caixa');
        await refreshData();
        toast.success(tl('Devolução registrada', 'Return recorded', 'Devolución registrada', 'Retour enregistré'));
        setRemoving(null);
        return;
      }
      const { removed, restocked } = await cancelSale(removing.id, { restock: choice.restock });
      setRemoving(null);
      toast(tl('Venda removida', 'Sale removed', 'Venta eliminada', 'Vente supprimée'), {
        description: removed.description,
        duration: 8000,
        action: {
          label: tl('Desfazer', 'Undo', 'Deshacer', 'Annuler'),
          onClick: async () => {
            try {
              await undoCancelSale(removed, restocked);
            } catch {
              toast.error(tl(
                'Não foi possível desfazer. Confira o estoque.',
                'Could not undo. Check stock.',
                'No se pudo deshacer. Revisa el inventario.',
                'Impossible d’annuler. Vérifiez le stock.',
              ));
            }
          },
        },
      });
      if (choice.restock && !restocked) {
        toast.warning(tl(
          'Venda removida, mas o estoque não pôde ser devolvido (produto ou variação não existe mais).',
          'Sale removed, but stock could not be restored (product or variant no longer exists).',
          'Venta eliminada, pero no se pudo devolver el inventario (el producto o la variante ya no existe).',
          'Vente supprimée, mais le stock n’a pas pu être remis (produit ou variante inexistant).',
        ));
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message === 'HAS_RETURNS'
        ? tl('Esta venda já tem devolução registrada.', 'This sale already has a return.', 'Esta venta ya tiene una devolución.', 'Cette vente a déjà un retour.')
        : tr('ext.cx_err_save'));
    } finally {
      setRemoveBusy(false);
    }
  };

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

      {/* Input Form */}
      <Card className="p-6 border-none shadow-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="value">{tr('ext.cx_value')}</Label>
            <Input id="value" type="text" placeholder="0,00" value={value} onChange={e => setValue(e.target.value)} className="mt-1 text-lg font-semibold" />
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
            <Select
              value={selectedProductId || 'none'}
              disabled={config.products.length === 0}
              onValueChange={val => {
                const id = val === 'none' ? '' : val;
                setSelectedProductId(id);
                setSelectedVariantId('');
                setQuantity(1);
                if (id) {
                  const p = config.products.find(pr => pr.id === id);
                  if (p) {
                    const price = unitPrice(p);
                    setValue(price.toFixed(2).replace('.', ','));
                    setDescription(p.name);
                    setCategory('Venda');
                  }
                } else {
                  setValue('');
                  setDescription('');
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={
                    config.products.length === 0
                      ? tr('ext.cx_link_no_products')
                      : tr('ext.cx_link_none')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{tr('ext.cx_link_none')}</SelectItem>
                {config.products
                  .filter(p => productStock(p) > 0)
                  .map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" />
                        {p.name} · {productStock(p)} {tr('ext.cx_in_stock')}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="desc">{tr('ext.cx_desc')}</Label>
          <Input id="desc" placeholder={tr('ext.cx_desc_ph')} value={description} onChange={e => setDescription(e.target.value)} className="mt-1" />
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

        <div className="flex items-center gap-3">
          <Switch checked={isPersonal} onCheckedChange={setIsPersonal} disabled={!!selectedProductId} />
          <Label className="text-sm cursor-pointer">{tr('ext.cx_personal')} <span className="text-muted-foreground">{tr('ext.cx_personal_hint')}</span></Label>
        </div>

        <div className="flex gap-4 pt-2">
          <button onClick={() => handleAdd('entrada')}
            className="flex-1 py-4 rounded-xl bg-secondary text-secondary-foreground font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-glow-green">
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
              {filtered.map(t => (
                <Card key={t.id} className={`p-4 border-none shadow-sm flex items-center justify-between ${t.isPersonal ? 'border-l-4 border-l-warning bg-warning/5' : ''}`}>
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
                      <button onClick={() => handleRemove(t.id)} aria-label={tr('ext.cx_confirm_rm')}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
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
    </div>
  );
};

export default Caixa;
