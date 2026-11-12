import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Copy, Download, QrCode, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useStore } from '@/contexts/StoreContext';
import { generatePix, inferPixKeyType, pixText, type PixInput, type PixKeyType } from '@/lib/pix';
import { usePixT } from '@/lib/pix-i18n';
import { brl } from '@/lib/fiscal';

export default function Pagamentos() {
  const t = usePixT();
  const { config, isLoading } = useStore();
  const [form, setForm] = useState<PixInput>({ keyType: inferPixKeyType(config.pixKey || ''), key: config.pixKey || '', name: pixText(config.storeName || '').slice(0, 25), city: '', amount: '', description: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof PixInput, boolean>>>({});
  const [result, setResult] = useState<ReturnType<typeof generatePix> | null>(null);
  const qr = useRef<HTMLDivElement>(null);
  const editedReceiver = useRef(false);
  useEffect(() => {
    if (!editedReceiver.current) setForm(prev => ({ ...prev, key: config.pixKey || '', keyType: inferPixKeyType(config.pixKey || ''), name: pixText(config.storeName || '').slice(0, 25) }));
  }, [config.pixKey, config.storeName]);

  function update(field: keyof PixInput, value: string) {
    if (field === 'key' || field === 'keyType' || field === 'name') editedReceiver.current = true;
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors({});
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const reference = crypto.randomUUID().replace(/-/g, '').slice(0, 25);
      setResult(generatePix(form, reference));
      setErrors({});
    } catch (error) {
      const field = error instanceof Error ? error.message : '';
      setErrors({ [field]: true });
      toast.error(t('invalid'));
    }
  }
  async function copy() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.payload); toast.success(t('copied')); }
    catch { toast.error(t('copyError')); }
  }
  function download() {
    const svg = qr.current?.querySelector('svg');
    if (!svg || !result) { toast.error(t('downloadError')); return; }
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url; link.download = `pix-${result.txid}.svg`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (isLoading) return <p className="text-muted-foreground" role="status">{t('loading')}</p>;
  if (config.paisBase !== 'BR') return <p className="text-muted-foreground">{t('brazil')}</p>;
  const fields = [
    { field: 'key', label: 'key', error: 'keyError', max: 77 },
    { field: 'name', label: 'name', error: 'nameError', max: 25 },
    { field: 'city', label: 'city', error: 'cityError', max: 15 },
    { field: 'amount', label: 'amount', error: 'amountError', max: 13 },
    { field: 'description', label: 'description', error: 'descriptionError', max: 73 },
  ] as const;
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Wallet className="text-primary shrink-0" />{t('title')}</h1>
      <p className="text-sm text-muted-foreground flex gap-2 items-start"><ShieldCheck className="h-5 w-5 shrink-0 text-primary" />{t('notice')}</p>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pix-key-type">{t('keyType')}</Label>
            <Select value={form.keyType} onValueChange={value => update('keyType', value as PixKeyType)}>
              <SelectTrigger id="pix-key-type"><SelectValue /></SelectTrigger>
              <SelectContent>{(['cpf', 'cnpj', 'email', 'phone', 'random'] as const).map(type => <SelectItem key={type} value={type}>{t(type)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {fields.map(({ field, label, error, max }) => (
            <div key={field} className="space-y-2 min-w-0">
              <Label htmlFor={`pix-${field}`}>{t(label)}</Label>
              <Input id={`pix-${field}`} value={form[field]} maxLength={max} inputMode={field === 'amount' ? 'decimal' : 'text'} autoComplete="off" onChange={event => update(field, event.target.value)} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `pix-${field}-error` : undefined} />
              {errors[field] && <p id={`pix-${field}-error`} role="alert" className="text-xs text-destructive">{t(error)}</p>}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="gap-2"><QrCode className="h-4 w-4" />{t('generate')}</Button>
          <Button type="button" variant="ghost" onClick={() => { setForm(prev => ({ ...prev, amount: '', description: '' })); setErrors({}); }}>{t('clear')}</Button>
        </div>
      </form>
      <p className="text-xs text-muted-foreground">{t('privacy')}</p>
      <Dialog open={!!result} onOpenChange={open => { if (!open) setResult(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle>{t('ready')}</DialogTitle><DialogDescription>{t('pending')}</DialogDescription></DialogHeader>
          {result && <div className="space-y-4 min-w-0">
            <div className="text-center"><p className="font-heading text-3xl font-bold">{brl(result.cents / 100)}</p><p className="text-sm break-words">{result.name} · {result.city}</p><p className="text-xs text-muted-foreground break-all">{result.key}</p></div>
            <div ref={qr} className="flex justify-center"><QRCodeSVG value={result.payload} size={220} marginSize={4} level="M" title={t('code')} className="pix-qr max-w-full h-auto" /></div>
            <div className="space-y-2"><Label htmlFor="pix-code">{t('code')}</Label><textarea id="pix-code" readOnly value={result.payload} onFocus={event => event.target.select()} className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs break-all min-h-24 resize-none" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Button onClick={copy} className="gap-2"><Copy className="w-4 h-4" />{t('copy')}</Button><Button onClick={download} variant="outline" className="gap-2"><Download className="w-4 h-4" />{t('download')}</Button></div>
            <p className="text-xs text-muted-foreground break-all">{t('reference')}: {result.txid}</p>
            <p className="text-xs text-muted-foreground">{t('reuse')}</p>
            <Button variant="ghost" className="w-full" onClick={() => setResult(null)}>{t('close')}</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
