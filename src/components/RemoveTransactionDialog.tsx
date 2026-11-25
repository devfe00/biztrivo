import { useEffect, useState } from 'react';
import type { Transaction } from '@/contexts/StoreContext';
import { useCaixaT } from '@/lib/caixa-i18n';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Undo2 } from 'lucide-react';

export type RemovalReason = 'devolucao' | 'remover';

export interface RemovalChoice {
  reason: RemovalReason;
  restock: boolean;
  quantity: number;
}

interface Props {
  sale: Transaction | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (choice: RemovalChoice) => void | Promise<void>;
}

export default function RemoveTransactionDialog({ sale, busy, onClose, onConfirm }: Props) {
  const tc = useCaixaT();

  const total = sale?.quantity ?? 0;
  const returned = sale?.returnedQuantity ?? 0;
  const remaining = Math.max(0, total - returned);
  const hasReturns = returned > 0;

  const [reason, setReason] = useState<RemovalReason>('remover');
  const [restock, setRestock] = useState(true);
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    if (!sale) return;
    setReason(hasReturns ? 'devolucao' : 'remover');
    setRestock(true);
    setQuantity(String(Math.max(1, remaining)));
  }, [sale?.id, hasReturns, remaining]);

  const isRefund = reason === 'devolucao';
  const qty = Number(quantity);
  const qtyValid = Number.isSafeInteger(qty) && qty >= 1 && qty <= remaining;
  const canConfirm = !busy && (isRefund ? qtyValid : !hasReturns);

  return (
    <Dialog open={!!sale} onOpenChange={open => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tc('removeTitle')}</DialogTitle>
        </DialogHeader>

        {sale && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground break-words">{sale.description}</p>

            <div>
              <Label>{tc('removeReason')}</Label>
              <Select value={reason} onValueChange={v => setReason(v as RemovalReason)} disabled={busy}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remover" disabled={hasReturns}>{tc('removeEntry')}</SelectItem>
                  <SelectItem value="devolucao" disabled={remaining <= 0}>{tc('removeReturn')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isRefund && (
              <div>
                <Label htmlFor="refund-qty">{tc('returnQuantity')}</Label>
                <Input
                  id="refund-qty"
                  type="number"
                  min={1}
                  max={remaining}
                  step={1}
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="mt-1 w-28"
                  disabled={busy}
                />
              </div>
            )}

            {sale.productId && (
              <div className="flex items-center gap-2">
                <Checkbox id="restock" checked={restock} onCheckedChange={v => setRestock(v === true)} disabled={busy} />
                <Label htmlFor="restock" className="text-sm cursor-pointer">{tc('returnToStock')}</Label>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {hasReturns && !isRefund ? tc('hasReturnsHint') : isRefund ? tc('hintRefund') : tc('hintRemove')}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={busy}>{tc('back')}</Button>
              <Button
                disabled={!canConfirm}
                onClick={() => onConfirm({
                  reason,
                  restock: !!sale.productId && restock,
                  quantity: isRefund ? qty : total,
                })}
              >
                {isRefund ? <Undo2 className="w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {isRefund ? tc('confirmRefund') : tc('confirmRemove')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}