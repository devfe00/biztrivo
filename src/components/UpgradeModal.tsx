import { useAuth } from '@/contexts/AuthContext';
import { getStripeCheckoutUrl } from '@/lib/billing';
import { X, Zap } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

const UpgradeModal = ({ open, onClose, reason }: Props) => {
  const { user } = useAuth();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground">Recurso PRO</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {reason ?? 'Este recurso não está disponível no período de teste.'}
            </p>
          </div>
          <a
            href={getStripeCheckoutUrl(user?.email)}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold text-center hover:opacity-90 transition"
          >
            Assinar PRO e liberar tudo
          </a>

          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Continuar no período gratuito
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;