import { useEffect, useState } from 'react';
import type { Transaction } from '@/contexts/StoreContext';
import { useLang } from '@/lib/useLang';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Undo2 } from 'lucide-react';

export type RemovalReason = 'devolucao' | 'cancelamento' | 'erro' | 'outro';

export interface RemovalChoice {
  reason: RemovalReason;
  restock: boolean;
  quantity: number;
}

const TEXT = {
  pt: {
    title: 'Remover venda',
    reason: 'Motivo',
    devolucao: 'Devolução (cliente devolveu o produto)',
    cancelamento: 'Cancelamento da venda',
    erro: 'Erro de lançamento',
    outro: 'Outro',
    quantity: 'Quantidade devolvida',
    restock: 'Devolver ao estoque',
    hintRefund: 'A venda continua no caixa e uma saída de devolução é criada.',
    hintRemove: 'O lançamento será apagado do caixa.',
    hasReturns: 'Esta venda já tem devolução registrada. Só é possível registrar nova devolução.',
    confirmRefund: 'Registrar devolução',
    confirmRemove: 'Remover venda',
    back: 'Voltar',
  },
  en: {
    title: 'Remove sale',
    reason: 'Reason',
    devolucao: 'Return (customer returned the product)',
    cancelamento: 'Sale cancelled',
    erro: 'Entry mistake',
    outro: 'Other',
    quantity: 'Returned quantity',
    restock: 'Return to stock',
    hintRefund: 'The sale stays in the ledger and a refund expense is created.',
    hintRemove: 'The entry will be deleted from the ledger.',
    hasReturns: 'This sale already has a return. You can only record another return.',
    confirmRefund: 'Record return',
    confirmRemove: 'Remove sale',
    back: 'Back',
  },
  es: {
    title: 'Eliminar venta',
    reason: 'Motivo',
    devolucao: 'Devolución (el cliente devolvió el producto)',
    cancelamento: 'Cancelación de la venta',
    erro: 'Error de registro',
    outro: 'Otro',
    quantity: 'Cantidad devuelta',
    restock: 'Devolver al inventario',
    hintRefund: 'La venta sigue en la caja y se crea una salida por devolución.',
    hintRemove: 'El movimiento se eliminará de la caja.',
    hasReturns: 'Esta venta ya tiene una devolución. Solo puedes registrar otra devolución.',
    confirmRefund: 'Registrar devolución',
    confirmRemove: 'Eliminar venta',
    back: 'Volver',
  },
  fr: {
    title: 'Supprimer la vente',
    reason: 'Motif',
    devolucao: 'Retour (le client a rendu le produit)',
    cancelamento: 'Annulation de la vente',
    erro: 'Erreur de saisie',
    outro: 'Autre',
    quantity: 'Quantité retournée',
    restock: 'Remettre en stock',
    hintRefund: 'La vente reste en caisse et une sortie de remboursement est créée.',
    hintRemove: 'L’écriture sera supprimée de la caisse.',
    hasReturns: 'Cette vente a déjà un retour. Vous ne pouvez enregistrer qu’un autre retour.',
    confirmRefund: 'Enregistrer le retour',
    confirmRemove: 'Supprimer la vente',
    back: 'Retour',
  },
};

interface Props {
  sale: Transaction | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (choice: RemovalChoice) => void | Promise<void>;
}

export default function RemoveTransactionDialog({ sale, busy, onClose, onConfirm }: Props) {
  const { lang } = useLang();
  const tx = TEXT[lang as keyof typeof TEXT] ?? TEXT.en;

  const total = sale?.quantity ?? 0;
  const returned = sale?.returnedQuantity ?? 0;
  const remaining = Math.max(0, total - returned);
  const hasReturns = returned > 0;

  const [reason, setReason] = useState<RemovalReason>('erro');
  const [restock, setRestock] = useState(true);
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    if (!sale) return;
    setReason(hasReturns ? 'devolucao' : 'erro');
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
          <DialogTitle>{tx.title}</DialogTitle>
        </DialogHeader>

        {sale && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground break-words">{sale.description}</p>

            <div>
              <Label>{tx.reason}</Label>
              <Select value={reason} onValueChange={v => setReason(v as RemovalReason)} disabled={busy}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="devolucao" disabled={remaining <= 0}>{tx.devolucao}</SelectItem>
                  <SelectItem value="cancelamento" disabled={hasReturns}>{tx.cancelamento}</SelectItem>
                  <SelectItem value="erro" disabled={hasReturns}>{tx.erro}</SelectItem>
                  <SelectItem value="outro" disabled={hasReturns}>{tx.outro}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isRefund && (
              <div>
                <Label htmlFor="refund-qty">{tx.quantity}</Label>
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
                <Label htmlFor="restock" className="text-sm cursor-pointer">{tx.restock}</Label>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {hasReturns && !isRefund ? tx.hasReturns : isRefund ? tx.hintRefund : tx.hintRemove}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={busy}>{tx.back}</Button>
              <Button
                disabled={!canConfirm}
                onClick={() => onConfirm({
                  reason,
                  restock: !!sale.productId && restock,
                  quantity: isRefund ? qty : total,
                })}
              >
                {isRefund ? <Undo2 className="w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {isRefund ? tx.confirmRefund : tx.confirmRemove}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}