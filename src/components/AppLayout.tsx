import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Store, GraduationCap, BarChart3, Calculator, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/contexts/StoreContext';
import { Toaster } from "sonner";

const MERCADO_PAGO_LINK = 'https://www.mercadopago.com.br/subscriptions';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/caixa', label: 'Financeiro', icon: Wallet },
  { path: '/vitrine', label: 'Minha Vitrine', icon: Store },
  { path: '/calculadora', label: 'Calculadora', icon: Calculator },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { path: '/academy', label: 'Academy', icon: GraduationCap },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Se der erro no useStore (caso não tenha configurado contexto ainda), 
  // pode comentar a linha abaixo e usar const config = { userPlan: 'gratuito' };
  const { config } = useStore(); 

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6">
  <img src="/logo.png" alt="Biztrivo" className="h-11 w-auto object-contain" />
</div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const isProItem = item.label === 'Calculadora';

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                  active
                    ? "gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                
                {/* --- AQUI ESTÁ A ETIQUETA PRO --- */}
                {isProItem && (
                  <span className="ml-auto text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                    PRO
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Banner de Upgrade no Rodapé da Sidebar */}
        {config?.userPlan === 'gratuito' && (
          <div className="p-4 m-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-foreground">Plano Gratuito</p>
            <p className="text-xs text-muted-foreground mt-1">Desbloqueie tudo por R$ 19,90</p>
            <a
              href={MERCADO_PAGO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full py-2 rounded-lg text-xs font-semibold gradient-primary text-primary-foreground shadow-glow block text-center transition-transform hover:scale-105"
            >
              Seja PRO
            </a>
          </div>
        )}
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm">
        <img src="/logo.png" alt="Biztrivo" className="h-10 w-auto object-contain" />
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-muted">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-card border-r border-border pt-16 animate-slide-in" onClick={e => e.stopPropagation()}>
            <nav className="px-3 space-y-1">
              {navItems.map(item => {
                const active = location.pathname === item.path;
                const isProItem = item.label === 'Calculadora';

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      active
                        ? "gradient-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isProItem && (
                      <span className="ml-auto text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                        PRO
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 md:p-8 p-4 pt-16 md:pt-8 overflow-auto">
        <div className="max-w-5xl mx-auto animate-fade-in pb-10">
          {children}
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default AppLayout;