import { useState, useRef } from 'react';
import { useT } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { FUNCTIONS, callFunction } from '@/integrations/firebase/firebase';
import type { Product } from '@/contexts/StoreContext';
import UpgradeModal from '@/components/UpgradeModal';

interface Props {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Comparison {
  invoice: { name: string; quantity: number; unit_price: number; total: number };
  matchedProductId: string | null;
  matchedProductName: string | null;
  matchedPrice: number | null;
  matchedStock: number | null;
  matchScore: number;
  priceDiff: number | null;
  priceDiffPct: number | null;
  status: 'ok' | 'price_changed' | 'new';
}

interface Summary {
  totalItems: number;
  matched: number;
  newItems: number;
  priceChanges: number;
  invoiceTotal: number | null;
  supplier: string | null;
  date: string | null;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export default function InvoiceComparator({ products, open, onOpenChange }: Props) {
  const t = useT();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [comparisons, setComparisons] = useState<Comparison[] | null>(null);
  const [trialUsage, setTrialUsage] = useState<{ used: number; remaining: number; limit: number } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null); setSummary(null); setComparisons(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) { toast.error(t('invoice_comparator.file_too_large')); return; }
    const ok = f.type.startsWith('image/') || f.type === 'application/pdf';
    if (!ok) { toast.error(t('invoice_comparator.invalid_file_type')); return; }
    setFile(f); setSummary(null); setComparisons(null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const data = await callFunction<{
        summary: Summary;
        comparisons: Comparison[];
        trialUsage?: { used: number; remaining: number; limit: number } | null;
        error?: string;
      }>(FUNCTIONS.compareInvoice, {
        fileBase64: dataUrl,
        products: products.map(p => ({ id: p.id, name: p.name, discountPrice: p.discountPrice, stock: p.stock })),
      });
      if (!data?.comparisons) throw new Error(data?.error || t('invoice_comparator.process_error'));
      setSummary(data.summary);
      setComparisons(data.comparisons);
      if (data.trialUsage) setTrialUsage(data.trialUsage);
      toast.success(t('invoice_comparator.items_extracted', { count: data.summary.totalItems }));
    } catch (e: any) {
      if ((e as any)?.status === 403 && (e as any)?.code === 'UPGRADE_REQUIRED') {
        setShowUpgrade(true);
      } else {
        toast.error(e?.message || t('invoice_comparator.analyze_error'));
      }
    } finally {
      setLoading(false);
    }
  };

return (
    <>
      <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('invoice_comparator.dialog_title')}
            </DialogTitle>
          </DialogHeader>

          {!comparisons && (
            <div className="space-y-4">
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0] || null); }}
                className="rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  {file ? file.name : t('invoice_comparator.drop_placeholder')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('invoice_comparator.file_types_hint')}</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
              </div>

              {file && (
                <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="truncate">{file.name} · {(file.size / 1024).toFixed(0)} KB</span>
                  <button onClick={reset} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={analyze}
                  disabled={!file || loading}
                  className="gradient-primary text-primary-foreground shadow-glow"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {loading ? t('invoice_comparator.analyzing') : t('invoice_comparator.analyze_button')}
                </Button>
              </div>

              {loading && (
                <p className="text-xs text-muted-foreground text-center">
                  {t('invoice_comparator.analyzing_hint')}
                </p>
              )}
            </div>
          )}

          {comparisons && summary && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat label={t('invoice_comparator.stat_items')} value={summary.totalItems} />
                <Stat label={t('invoice_comparator.stat_matched')} value={summary.matched} tone="success" />
                <Stat label={t('invoice_comparator.stat_new')} value={summary.newItems} tone="warning" />
                <Stat label={t('invoice_comparator.stat_price_changed')} value={summary.priceChanges} tone="danger" />
              </div>

              {(summary.supplier || summary.date || summary.invoiceTotal) && (
                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  {summary.supplier && <span><b>{t('invoice_comparator.supplier_label')}</b> {summary.supplier}</span>}
                  {summary.date && <span><b>{t('invoice_comparator.date_label')}</b> {summary.date}</span>}
                  {summary.invoiceTotal != null && <span><b>{t('invoice_comparator.total_label')}</b> {brl(summary.invoiceTotal)}</span>}
                </div>
              )}

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-xs uppercase">
                    <tr>
                      <th className="text-left p-2">{t('invoice_comparator.table_item')}</th>
                      <th className="text-right p-2">{t('invoice_comparator.table_qty')}</th>
                      <th className="text-right p-2">{t('invoice_comparator.table_invoice_price')}</th>
                      <th className="text-right p-2">{t('invoice_comparator.table_your_price')}</th>
                      <th className="text-right p-2">{t('invoice_comparator.table_diff')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((c, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2">
                          <div className="font-medium">{c.invoice.name}</div>
                          {c.matchedProductName ? (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              {c.matchedProductName}
                              <span className="opacity-60">({Math.round(c.matchScore * 100)}%)</span>
                            </div>
                          ) : (
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {t('invoice_comparator.not_in_showcase')}
                            </div>
                          )}
                        </td>
                        <td className="text-right p-2">{c.invoice.quantity}</td>
                        <td className="text-right p-2">{brl(c.invoice.unit_price)}</td>
                        <td className="text-right p-2 text-muted-foreground">{c.matchedPrice != null ? brl(c.matchedPrice) : '—'}</td>
                        <td className="text-right p-2">
                          {c.priceDiff == null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : Math.abs(c.priceDiff) < 0.01 ? (
                            <span className="text-green-600 dark:text-green-400">{t('invoice_comparator.equal')}</span>
                          ) : (
                            <span className={c.priceDiff > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}>
                              {c.priceDiff > 0 ? '+' : ''}{brl(c.priceDiff)}
                              {c.priceDiffPct != null && <span className="text-xs opacity-70 ml-1">({c.priceDiffPct > 0 ? '+' : ''}{c.priceDiffPct}%)</span>}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={reset}>{t('invoice_comparator.analyze_another')}</Button>
              </div>
            </div>
          )}

          {trialUsage && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Você usou <strong>{trialUsage.used}</strong> de <strong>{trialUsage.limit}</strong> análises do mês —{' '}
              <strong>{trialUsage.remaining}</strong> restantes.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="Você atingiu o limite de análises de nota fiscal do período de teste."
      />
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'warning' | 'danger' }) {
  const color =
    tone === 'success' ? 'text-green-600 dark:text-green-400' :
    tone === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
    tone === 'danger' ? 'text-destructive' : 'text-foreground';
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}