import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { FUNCTIONS, callFunction } from '@/integrations/firebase/firebase';
import type { Product } from '@/contexts/StoreContext';

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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [comparisons, setComparisons] = useState<Comparison[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null); setSummary(null); setComparisons(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) { toast.error('Arquivo grande demais (máx 8MB).'); return; }
    const ok = f.type.startsWith('image/') || f.type === 'application/pdf';
    if (!ok) { toast.error('Use imagem (JPG/PNG) ou PDF.'); return; }
    setFile(f); setSummary(null); setComparisons(null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const data = await callFunction<{ summary: Summary; comparisons: Comparison[]; error?: string }>(FUNCTIONS.compareInvoice, {
  fileBase64: dataUrl,
  products: products.map(p => ({ id: p.id, name: p.name, discountPrice: p.discountPrice, stock: p.stock })),
});
if (!data?.comparisons) throw new Error(data?.error || 'Falha ao processar');
      setSummary(data.summary);
      setComparisons(data.comparisons);
      toast.success(`${data.summary.totalItems} itens extraídos da nota.`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao analisar nota.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Comparar Nota Fiscal
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
                {file ? file.name : 'Clique ou arraste sua nota fiscal'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou PDF (até 8MB)</p>
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
                {loading ? 'Analisando nota...' : 'Analisar com IA'}
              </Button>
            </div>

            {loading && (
              <p className="text-xs text-muted-foreground text-center">
                A IA está lendo os itens da sua nota. Pode levar até 30 segundos.
              </p>
            )}
          </div>
        )}

        {comparisons && summary && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Itens" value={summary.totalItems} />
              <Stat label="Encontrados" value={summary.matched} tone="success" />
              <Stat label="Novos" value={summary.newItems} tone="warning" />
              <Stat label="Preço mudou" value={summary.priceChanges} tone="danger" />
            </div>

            {(summary.supplier || summary.date || summary.invoiceTotal) && (
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                {summary.supplier && <span><b>Fornecedor:</b> {summary.supplier}</span>}
                {summary.date && <span><b>Data:</b> {summary.date}</span>}
                {summary.invoiceTotal != null && <span><b>Total:</b> {brl(summary.invoiceTotal)}</span>}
              </div>
            )}

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs uppercase">
                  <tr>
                    <th className="text-left p-2">Item da nota</th>
                    <th className="text-right p-2">Qtd</th>
                    <th className="text-right p-2">Preço nota</th>
                    <th className="text-right p-2">Seu preço</th>
                    <th className="text-right p-2">Diferença</th>
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
                            <AlertTriangle className="w-3 h-3" /> Não está na vitrine
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
                          <span className="text-green-600 dark:text-green-400">igual</span>
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
              <Button variant="outline" onClick={reset}>Analisar outra nota</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
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