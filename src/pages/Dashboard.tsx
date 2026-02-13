import { useStore } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Store, ExternalLink, Wallet, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

const Dashboard = () => {
  const { config } = useStore();

  const todayStr = new Date().toISOString().split('T')[0];

  const todayTransactions = useMemo(() => 
    config.transactions.filter(t => t.date.startsWith(todayStr)),
    [config.transactions, todayStr]
  );

  const todayEntradas = todayTransactions.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
  const todaySaidas = todayTransactions.filter(t => t.type === 'saida').reduce((s, t) => s + t.value, 0);
  const todaySaldo = todayEntradas - todaySaidas;
  const personalExpenses = todayTransactions.filter(t => t.isPersonal).reduce((s, t) => s + t.value, 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-none shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo do Dia</p>
              <p className={`text-2xl font-bold font-heading mt-1 ${todaySaldo >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                {formatCurrency(todaySaldo)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Entradas Hoje</p>
              <p className="text-2xl font-bold font-heading mt-1 text-secondary">{formatCurrency(todayEntradas)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saídas Hoje</p>
              <p className="text-2xl font-bold font-heading mt-1 text-destructive">{formatCurrency(todaySaidas)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gasto Pessoal</p>
              <p className="text-2xl font-bold font-heading mt-1 text-warning">{formatCurrency(personalExpenses)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-warning" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vitrine Status */}
        <Card className="p-6 border-none shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-heading">Minha Vitrine</h2>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                config.vitrineActive
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <span className={`w-2 h-2 rounded-full ${config.vitrineActive ? 'bg-secondary' : 'bg-muted-foreground'}`} />
                {config.vitrineActive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Produtos</p>
              <p className="text-2xl font-bold font-heading">{config.products.length}</p>
            </div>
          </div>
          <Link
            to="/vitrine"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="w-4 h-4" />
            Gerenciar Vitrine
          </Link>
        </Card>

        {/* Quick Caixa */}
        <Card className="p-6 border-none shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-heading">Caixa Rápido</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Registre suas entradas e saídas do dia para manter o controle do seu negócio.
          </p>
          <div className="flex gap-3">
            <Link
              to="/caixa"
              className="flex-1 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm text-center hover:opacity-90 transition-opacity shadow-glow-green"
            >
              + Entrada
            </Link>
            <Link
              to="/caixa"
              className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm text-center hover:opacity-90 transition-opacity"
            >
              - Saída
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
