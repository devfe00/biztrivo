import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Crown, Zap, BarChart3, Store, GraduationCap, Calculator, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const features = [
  { icon: Wallet, label: 'Controle financeiro completo' },
  { icon: Store, label: 'Vitrine online com QR Code' },
  { icon: BarChart3, label: 'Relatórios com exportação PDF/CSV' },
  { icon: Calculator, label: 'Calculadora de precificação' },
  { icon: GraduationCap, label: 'Academy completa' },
  { icon: Zap, label: 'Suporte prioritário' },
];

const Planos = () => {
  const { signOut, isPro } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = () => {
    toast.info('Pagamento será habilitado em breve!', {
      description: 'Estamos finalizando a integração com Stripe.',
    });
  };

  useEffect(() => {
    if (isPro) {
      navigate('/', { replace: true });
    }
  }, [isPro, navigate]);

  if (isPro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Biztrivo" className="h-14 w-auto object-contain mx-auto mb-4 drop-shadow-xl" />
          <h1 className="text-3xl font-bold text-white mb-2">Falta pouco!</h1>
          <p className="text-white/90">Escolha seu plano para começar a usar o Biztrivo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-blue-800 p-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-white text-sm font-medium mb-3">
              <Crown size={16} />
              Plano PRO
            </div>
            <div className="flex items-baseline justify-center gap-1 text-white">
              <span className="text-lg">R$</span>
              <span className="text-5xl font-bold">19</span>
              <span className="text-2xl font-bold">,90</span>
              <span className="text-white/80 text-sm ml-1">/mês</span>
            </div>
            <p className="text-white/80 text-sm mt-2">Cancele quando quiser</p>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">Tudo incluso:</p>
            {features.map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <feat.icon size={16} className="text-green-600" />
                </div>
                <span className="text-sm text-gray-700">{feat.label}</span>
                <Check size={16} className="text-green-500 ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>

          <div className="p-6 pt-2 space-y-3">
            <button
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:from-green-500 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Crown size={20} />
              Assinar Agora
            </button>

            <button
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
            >
              Sair da conta
            </button>
          </div>
        </div>

        <p className="text-center text-white/70 text-xs mt-6">
          Pagamento seguro via Stripe. Você pode cancelar a qualquer momento.
        </p>
      </div>
    </div>
  );
};

export default Planos;
