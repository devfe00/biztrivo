import { useEffect, useMemo, useRef, useState } from 'react';
import { Package, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useInventoryT } from '@/lib/inventory-i18n';
import { normalizeSearch, productStock, type InventoryProduct } from '@/lib/inventory';

export interface PickerProduct extends InventoryProduct {
  id: string;
  name: string;
}

interface Props {
  products: PickerProduct[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  inStockLabel: string;
  disabled?: boolean;
}

export default function ProductPicker({ products, value, onChange, placeholder, inStockLabel, disabled }: Props) {
  const it = useInventoryT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = products.find(p => p.id === value);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const matches = useMemo(() => {
    const q = normalizeSearch(query);
    return products.filter(p => productStock(p) > 0 && (!q || normalizeSearch(p.name).includes(q)));
  }, [products, query]);

  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className="relative mt-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        value={open ? query : selected?.name ?? ''}
        placeholder={open ? it('searchProduct') : placeholder}
        disabled={disabled}
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        className="pl-9 pr-9"
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === 'Escape') { setOpen(false); setQuery(''); }
          if (e.key === 'Enter' && open && matches.length > 0) { e.preventDefault(); choose(matches[0].id); }
        }}
      />
      {value && !open && !disabled && (
        <button
          type="button"
          aria-label={it('clearProduct')}
          title={it('clearProduct')}
          onClick={() => choose('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {open && (
        <ul role="listbox" className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{it('noProduct')}</li>
          ) : matches.map(p => (
            <li key={p.id} role="option" aria-selected={p.id === value}>
              <button
                type="button"
                onClick={() => choose(p.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
              >
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span className="min-w-0 break-words">{p.name} · {productStock(p)} {inStockLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}