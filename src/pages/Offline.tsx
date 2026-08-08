import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { WifiOff, Wifi, Upload, Trash2, CheckCircle2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';

interface OfflineSale {
  id: string;
  product: string;
  value: number;
  payment: string;
  date: string;
}

const queueKey = (uid: string) => `biztrivo:offline_queue:${uid}`;

const Offline = () => {
  const t = useT();
  const { user } = useAuth();
  const { addTransaction, config } = useStore();
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queue, setQueue] = useState<OfflineSale[]>([]);
  const [product, setProduct] = useState('');
  const [value, setValue] = useState('');
  const [payment, setPayment] = useState('Dinheiro');
  const [syncing, setSyncing] = useState(false);

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
    if (!user) return;
    try {
      const raw = localStorage.getItem(queueKey(user.uid));
      setQueue(raw ? JSON.parse(raw) : []);
    } catch { setQueue([]); }
  }, [user]);

  const persist = (next: OfflineSale[]) => {
    setQueue(next);
    if (user) localStorage.setItem(queueKey(user.uid), JSON.stringify(next));
  };

  const addSale = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(value.replace(',', '.'));
    if (!product.trim() || !v || v <= 0) {
      toast.error(t('offline.fill_valid_fields'));
      return;
    }
    const sale: OfflineSale = {
      id: crypto.randomUUID(),
      product: product.trim(),
      value: v,
      payment,
      date: new Date().toISOString(),
    };
    persist([sale, ...queue]);
    setProduct(''); setValue('');
    toast.success(t('offline.sale_saved'));
  };

  const removeSale = (id: string) => {
    persist(queue.filter(s => s.id !== id));
  };

const sync = useCallback(async () => {
    if (!online) { toast.error(t('offline.no_connection')); return; }
    if (queue.length === 0) return;
    setSyncing(true);
    const failed: OfflineSale[] = [];
    let ok = 0;
    for (const sale of queue) {
      try {
        await addTransaction({
          type: 'entrada',
          value: sale.value,
          description: `${sale.product} (offline)`,
          category: sale.payment,
          isPersonal: false,
          date: sale.date,
        });
        ok++;
      } catch (e) {
        failed.push(sale);
      }
    }
    persist(failed);
    setSyncing(false);
    if (ok > 0) toast.success(t('offline.sales_synced', { count: ok }));
    if (failed.length > 0) toast.error(t('offline.sync_failed', { count: failed.length }));
  }, [online, queue, addTransaction, user]);

  useEffect(() => {
    if (online && queue.length > 0) {
      toast.info(t('offline.connection_restored'));
      sync();
    }
  }, [online]); 

  const total = queue.reduce((s, q) => s + q.value, 0);
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">{t('offline.page_title')}</h1>
        <p className="text-muted-foreground mt-1">{t('offline.page_subtitle')}</p>
      </div>

      <Card className={`p-4 border-none shadow-md border-l-4 ${online ? 'border-l-secondary bg-secondary/5' : 'border-l-warning bg-warning/5'}`}>
        <div className="flex items-center gap-3">
          {online ? <Wifi className="w-5 h-5 text-secondary" /> : <WifiOff className="w-5 h-5 text-warning" />}
          <div className="flex-1">
            <p className="text-sm font-medium">{online ? t('offline.online_status') : t('offline.offline_status')}</p>
            <p className="text-xs text-muted-foreground">
              {online
                ? t('offline.online_hint')
                : t('offline.offline_hint')}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-none shadow-md">
        <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> {t('offline.register_sale_title')}</h2>
        <form onSubmit={addSale} className="space-y-3">
          <Input list="prod-list" placeholder={t('offline.product_placeholder')} value={product} onChange={e => setProduct(e.target.value)} />
          <datalist id="prod-list">
            {config.products.map(p => <option key={p.id} value={p.name} />)}
          </datalist>
          <Input type="text" inputMode="decimal" placeholder={t('offline.value_placeholder')} value={value} onChange={e => setValue(e.target.value)} />
          <select value={payment} onChange={e => setPayment(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="Dinheiro">{t('offline.payment_cash')}</option>
            <option value="PIX">{t('offline.payment_pix')}</option>
            <option value="Cartão Débito">{t('offline.payment_debit')}</option>
            <option value="Cartão Crédito">{t('offline.payment_credit')}</option>
            <option value="Outro">{t('offline.payment_other')}</option>
          </select>
          <button type="submit" className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm shadow-glow">
            {t('offline.save_sale')}
          </button>
        </form>
      </Card>

      <Card className="p-6 border-none shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold font-heading">{t('offline.pending_title')}</h2>
            <p className="text-xs text-muted-foreground">{t('offline.pending_summary', { count: queue.length, total: fmt(total) })}</p>
          </div>
          <button
            onClick={sync}
            disabled={!online || syncing || queue.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90"
          >
            <Upload className={`w-4 h-4 ${syncing ? 'animate-pulse' : ''}`} />
            {t('offline.sync_button')}
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-secondary/60" />
            <p className="text-sm">{t('offline.no_pending')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div>
                  <p className="text-sm font-medium">{s.product}</p>
                  <p className="text-xs text-muted-foreground">{s.payment} • {new Date(s.date).toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-secondary">{fmt(s.value)}</span>
                  <button onClick={() => removeSale(s.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Offline;