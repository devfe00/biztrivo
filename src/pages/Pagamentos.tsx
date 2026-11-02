import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Wallet, ShieldCheck, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, QrCode, Barcode, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { db, FUNCTIONS, callFunction } from '@/integrations/firebase/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFiscalT } from '@/lib/fiscal-i18n';
import { validTaxId, normalizeTaxId } from '@/lib/fiscal';

interface ChargeForm {
  customer: string;
  taxId: string;
  email: string;
  description: string;
  amount: string;
  method: 'pix' | 'boleto';
  due: string;
}

interface ChargeResult {
  chargeId: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  boletoDueDate?: string;
}

const INITIAL_FORM: ChargeForm = {
  customer: '',
  taxId: '',
  email: '',
  description: '',
  amount: '',
  method: 'pix',
  due: '',
};

function randomIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatCurrency(value: string) {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Pagamentos() {
  const t = useFiscalT();
  const { config } = useStore();
  const { user } = useAuth();

  const [mpConnected, setMpConnected] = useState<boolean | null>(null);

  const [form, setForm] = useState<ChargeForm>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ChargeForm, string>>>({});

  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chargeResult, setChargeResult] = useState<ChargeResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpParam = params.get('mp');
    if (mpParam === 'connected') {
      toast.success('Conta Mercado Pago conectada com sucesso!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (mpParam === 'error') {
      toast.error('Erro ao conectar conta Mercado Pago. Tente novamente.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(db, 'privateProfiles', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setMpConnected(snap.data()?.mpConnected === true);
      } else {
        setMpConnected(false);
      }
    });
    return unsub;
  }, [user?.uid]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const { authUrl } = await callFunction<{ authUrl: string }>(
        FUNCTIONS.sellerConnectMercadoPago
      );
      window.location.href = authUrl;
    } catch {
      toast.error('Erro ao iniciar conexão com o Mercado Pago.');
      setConnecting(false);
    }
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof ChargeForm, string>> = {};

    if (!form.customer.trim() || form.customer.trim().length < 2)
      errors.customer = 'Nome obrigatório (mínimo 2 caracteres)';

if (!validTaxId(normalizeTaxId(form.taxId)))
      errors.taxId = 'CPF ou CNPJ inválido';

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = 'E-mail inválido';

    const amountNum = parseFloat(form.amount);
    if (!form.amount || isNaN(amountNum) || amountNum <= 0)
      errors.amount = 'Valor inválido';
    else if (Math.abs(amountNum * 100 - Math.round(amountNum * 100)) >= 0.00001)
      errors.amount = 'Valor inválido (máximo 2 casas decimais)';

    if (form.method === 'boleto' && !form.due)
      errors.due = 'Vencimento obrigatório para boleto';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const amountCents = Math.round(parseFloat(form.amount) * 100);
      const result = await callFunction<ChargeResult>(FUNCTIONS.createSellerCharge, {
        method: form.method,
        amountCents,
        payerName: form.customer.trim(),
        payerTaxId: form.taxId.replace(/\D/g, ''),
        payerEmail: form.email.trim(),
        description: form.description.trim() || undefined,
        dueDate: form.due || undefined,
        idempotencyKey: randomIdempotencyKey(),
      });
      setChargeResult(result);
      setForm(INITIAL_FORM);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar cobrança';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar. Selecione e copie manualmente.');
    }
  }

  if (config.paisBase !== 'BR')
    return <p className="text-muted-foreground">{t('brazil')}</p>;

  if (mpConnected === null) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold flex gap-2 items-center">
          <Wallet className="text-primary" />{t('payments')}
        </h1>
        <p className="text-sm text-muted-foreground animate-pulse">Verificando conexão...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold flex gap-2 items-center">
        <Wallet className="text-primary" />{t('payments')}
      </h1>

      <p className="text-sm text-muted-foreground flex gap-2 items-start">
        <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        {t('paymentNotice')}
      </p>

      {!mpConnected && (
        <div className="border border-border rounded-xl p-6 space-y-4 bg-muted/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Conta Mercado Pago não conectada</p>
              <p className="text-sm text-muted-foreground">{t('blocked')}</p>
            </div>
          </div>
          <Button onClick={handleConnect} disabled={connecting} className="gap-2">
            {connecting ? 'Redirecionando...' : 'Conectar Mercado Pago'}
            {!connecting && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {mpConnected && (
        <>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Conta Mercado Pago conectada</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('customer')}</label>
                <Input
                  value={form.customer}
                  onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                  placeholder="Nome completo"
                />
                {formErrors.customer && <p className="text-xs text-destructive">{formErrors.customer}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('taxId')}</label>
                <Input
                  value={form.taxId}
                  onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  maxLength={18}
                />
                {formErrors.taxId && <p className="text-xs text-destructive">{formErrors.taxId}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('email')}</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="cliente@email.com"
                />
                {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('description')} <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <Input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Encomenda de vestido rosa"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('amount')}</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00"
                />
                {form.amount && !formErrors.amount && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(form.amount)}</p>
                )}
                {formErrors.amount && <p className="text-xs text-destructive">{formErrors.amount}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('method')}</label>
                <select
                  value={form.method}
                  onChange={e => setForm(f => ({ ...f, method: e.target.value as 'pix' | 'boleto' }))}
                  className="h-10 w-full border border-input bg-background rounded-md px-3 text-sm"
                >
                  <option value="pix">Pix</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>

              {form.method === 'boleto' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('due')}</label>
                  <Input
                    type="date"
                    value={form.due}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
                  />
                  {formErrors.due && <p className="text-xs text-destructive">{formErrors.due}</p>}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? 'Gerando...' : form.method === 'pix' ? (
                  <><QrCode className="w-4 h-4" /> Gerar Pix</>
                ) : (
                  <><Barcode className="w-4 h-4" /> Gerar Boleto</>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setForm(INITIAL_FORM); setFormErrors({}); }}
              >
                {t('clear')}
              </Button>
            </div>
          </form>
        </>
      )}

      <Dialog open={!!chargeResult} onOpenChange={(open) => { if (!open) setChargeResult(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              {chargeResult?.pixQrCode ? 'Pix gerado' : 'Boleto gerado'}
            </DialogTitle>
            <DialogDescription>
              Compartilhe com o cliente para receber o pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">

            {chargeResult?.pixQrCode && (
              <div className="space-y-3">
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <QRCodeSVG value={chargeResult.pixQrCode} size={180} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Pix copia e cola</p>
                  <div className="flex gap-2">
                    <Input
                      value={chargeResult.pixQrCode}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(chargeResult.pixQrCode!)}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {chargeResult?.boletoBarcode && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Linha digitável</p>
                  <div className="flex gap-2">
                    <Input
                      value={chargeResult.boletoBarcode}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(chargeResult.boletoBarcode!)}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {chargeResult.boletoUrl && (
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <a href={chargeResult.boletoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" /> Abrir boleto
                    </a>
                  </Button>
                )}
                {chargeResult.boletoDueDate && (
                  <p className="text-xs text-muted-foreground">
                    Vencimento: {new Date(chargeResult.boletoDueDate).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">{t('privacy')}</p>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">{t('privacy')}</p>
    </div>
  );
}