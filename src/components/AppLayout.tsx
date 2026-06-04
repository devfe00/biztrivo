import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Store, GraduationCap, BarChart3, Calculator, Menu, X, User, Settings, LogOut, ChevronDown, WifiOff, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from "sonner";
import Footer from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { path: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { path: '/caixa', label: 'Caixa', icon: Wallet },
  { path: '/vitrine', label: 'Vitrine', icon: Store },
  { path: '/offline', label: 'Modo Offline', icon: WifiOff },
  { path: '/calculadora', label: 'Preço', icon: Calculator },
  { path: '/relatorios', label: 'Relatório', icon: BarChart3 },
  { path: '/mei', label: 'MEI', icon: FileText },
  { path: '/academy', label: 'Academy', icon: GraduationCap },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { config } = useStore();
  const { signOut } = useAuth();

  const storeName = config.storeName || 'Minha Loja';
  const profileImage = config.profileImage || '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await signOut();
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-4">
          <img src="/logo.png" alt="Biztrivo" className="h-7 w-auto object-contain" />
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative group',
                  active
                    ? 'gradient-primary text-primary-foreground shadow-glow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ThemeToggle no rodapé da sidebar desktop */}
        <div className="p-3 border-t border-border">
          <ThemeToggle showLabel className="w-full justify-start" />
        </div>
      </aside>

      {/* ── Topbar mobile ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-card border-b border-border shadow-sm">
        <img src="/logo.png" alt="Biztrivo" className="h-6 w-auto object-contain" />
        <div className="flex items-center gap-1">
          {/* ThemeToggle visível na topbar mobile (só ícone) */}
          <ThemeToggle />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-muted">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Drawer mobile ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-64 h-full bg-card border-r border-border pt-16 animate-slide-in flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <nav className="px-3 space-y-1 flex-1">
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all',
                      active
                        ? 'gradient-primary text-primary-foreground shadow-glow'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border p-3 space-y-2">
              <Link
                to="/configuracoes"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {profileImage
                    ? <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
                    : <User className="text-white" size={16} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{storeName}</p>
                  <p className="text-xs text-muted-foreground">Ver perfil</p>
                </div>
                <Settings size={16} className="text-muted-foreground" />
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut size={18} /><span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Área principal ── */}
      <main className="flex-1 flex flex-col overflow-auto">
        {/* Header desktop */}
        <header className="hidden md:flex items-center justify-end px-8 py-4 border-b border-border bg-card gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {profileImage
                  ? <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
                  : <User className="text-white" size={20} />
                }
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{storeName}</p>
                <p className="text-xs text-muted-foreground">Ver perfil</p>
              </div>
              <ChevronDown
                size={16}
                className={cn('text-muted-foreground transition-transform', profileOpen && 'rotate-180')}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50 animate-fade-in">
                <Link
                  to="/configuracoes"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings size={18} /><span>Configurações</span>
                </Link>
                <hr className="my-2 border-border" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} /><span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 md:p-8 p-4 pt-16 md:pt-8">
          <div className="max-w-5xl mx-auto animate-fade-in">
            {children}
            <Footer />
          </div>
        </div>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
};

export default AppLayout;