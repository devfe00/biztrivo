import { Sun, Moon, Stars } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark-space' | 'dark-midnight';
const THEMES: Theme[] = ['light', 'dark-space', 'dark-midnight'];

const config: Record<Theme, { icon: React.ReactNode; label: string }> = {
  'light':        { icon: <Sun size={16} />,   label: 'Claro'      },
  'dark-space':   { icon: <Stars size={16} />, label: 'Espaço'     },
  'dark-midnight':{ icon: <Moon size={16} />,  label: 'Meia-noite' },
};

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const current = (theme as Theme) ?? 'light';
    const idx = THEMES.indexOf(current);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  const current = config[(theme as Theme) ?? 'light'] ?? config['light'];

  return (
    <button
      onClick={cycleTheme}
      title={`Tema atual: ${current.label} — clique para alternar`}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium',
        'text-muted-foreground hover:text-foreground hover:bg-muted',
        'transition-colors duration-200',
        className
      )}
    >
      {current.icon}
      {showLabel && <span>{current.label}</span>}
    </button>
  );
}