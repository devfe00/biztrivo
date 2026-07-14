// src/components/LanguageSwitcher.tsx
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/contexts/I18nContext';
import type { Lang } from '@/i18n';

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: 'pt', flag: '🇧🇷', label: 'PT' },
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
];

interface LanguageSwitcherProps {
  /** Quando true, mostra o label de texto ao lado da bandeira (modo sidebar) */
  showLabel?: boolean;
  className?: string;
}

const LanguageSwitcher = ({ showLabel = false, className }: LanguageSwitcherProps) => {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find(l => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (code: Lang) => {
    setOpen(false);
    await setLang(code);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium',
          'text-muted-foreground hover:text-foreground hover:bg-muted transition-all'
        )}
        aria-label="Selecionar idioma"
      >
        <span className="text-base leading-none">{current.flag}</span>
        {showLabel && <span>{current.label}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-lg shadow-lg py-1 z-50 animate-fade-in">
          {LANGS.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                l.code === lang
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
