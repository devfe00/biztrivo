import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { productStock, type ProductVariant } from '@/lib/inventory';
import { useInventoryT } from '@/lib/inventory-i18n';

interface Props {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  threshold: number;
  onThresholdChange: (threshold: number) => void;
}

export default function ProductVariantsEditor({ variants, onChange, threshold, onThresholdChange }: Props) {
  const t = useInventoryT();
  const update = (id: string, partial: Partial<ProductVariant>) => onChange(variants.map(v => v.id === id ? { ...v, ...partial } : v));
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">{t('variants')}</h3>
      {variants.map(v => (
        <div key={v.id} className="grid grid-cols-[1fr_1fr_80px_36px] gap-2 items-end">
          <div className="min-w-0"><Label htmlFor={`size-${v.id}`}>{t('size')}</Label><Input id={`size-${v.id}`} maxLength={40} value={v.size} onChange={e => update(v.id, { size: e.target.value })} /></div>
          <div className="min-w-0"><Label htmlFor={`color-${v.id}`}>{t('color')}</Label><Input id={`color-${v.id}`} maxLength={40} value={v.color} onChange={e => update(v.id, { color: e.target.value })} /></div>
          <div><Label htmlFor={`stock-${v.id}`}>{t('stock')}</Label><Input id={`stock-${v.id}`} type="number" min={0} step={1} value={Number.isNaN(v.stock) ? '' : v.stock} onChange={e => update(v.id, { stock: e.target.value === '' ? NaN : Number(e.target.value) })} /></div>
          <Button variant="ghost" size="icon" className="w-9" title={t('remove')} aria-label={t('remove')} onClick={() => onChange(variants.filter(item => item.id !== v.id))}><Trash2 /></Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Button variant="outline" size="sm" disabled={variants.length >= 100} onClick={() => onChange([...variants, { id: crypto.randomUUID(), size: '', color: '', stock: 0 }])}><Plus />{t('add')}</Button>
        {variants.length > 0 && <p className="text-sm font-medium">{t('total')}: {productStock({ stock: 0, variants }) || 0}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={`threshold-${variants[0]?.id ?? 'simple'}`}>{t('threshold')}</Label>
        <Input id={`threshold-${variants[0]?.id ?? 'simple'}`} aria-label={t('threshold')} className="w-20" type="number" min={0} step={1} value={Number.isNaN(threshold) ? '' : threshold} onChange={e => onThresholdChange(e.target.value === '' ? NaN : Number(e.target.value))} />
        <span className="text-sm text-muted-foreground">{t('units')}</span>
      </div>
    </section>
  );
}