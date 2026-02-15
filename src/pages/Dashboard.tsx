import { useStore } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Store, ExternalLink, Wallet, ShoppingBag, AlertTriangle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Input } from '@/components/ui/input';

const MERCADO_PAGO_LINK = 'https://www.mercadopago.com.br/subscriptions';

const Dashboard = () => {

  const { config } = useStore();

const [dailyGoal, setDailyGoal] = useState(() => {
  const saved = localStorage.getItem('dailyGoal');
  return saved ? parseFloat(saved) : 0;
});
const [isEditingGoal, setIsEditingGoal] = useState(false);
const [goalInput, setGoalInput] = useState('');
const [goalReached, setGoalReached] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const todayTransactions = useMemo(() => 
    config.transactions.filter(t => t.date.startsWith(todayStr)),
    [config.transactions, todayStr]
  );

  const todayEntradas = todayTransactions.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
  const todaySaidas = todayTransactions.filter(t => t.type === 'saida').reduce((s, t) => s + t.value, 0);
  const todaySaldo = todayEntradas - todaySaidas;
  const personalExpenses = todayTransactions.filter(t => t.isPersonal).reduce((s, t) => s + t.value, 0);
  const personalPercent = todayEntradas > 0 ? (personalExpenses / todayEntradas) * 100 : 0;


const goalProgress = dailyGoal > 0 ? (todayEntradas / dailyGoal) * 100 : 0;

useEffect(() => {
  if (dailyGoal > 0 && todayEntradas >= dailyGoal && !goalReached) {
    setGoalReached(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  }
  if (todayEntradas < dailyGoal) {
    setGoalReached(false);
  }
}, [todayEntradas, dailyGoal, goalReached]);

const handleSaveGoal = () => {
  const value = parseFloat(goalInput.replace(',', '.'));
  if (value > 0) {
    setDailyGoal(value);
    localStorage.setItem('dailyGoal', value.toString());
    setIsEditingGoal(false);
    setGoalInput('');
  }
};

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Dynamic Welcome */}
      {todayEntradas > 0 && (
        <Card className={`p-4 border-none shadow-md ${personalPercent > 30 ? 'bg-warning/10 border-l-4 border-l-warning' : 'bg-secondary/10 border-l-4 border-l-secondary'}`}>
          {personalPercent > 30 ? (
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              <p className="text-sm font-medium text-warning">⚠️ Atenção: Suas retiradas pessoais estão altas este mês ({personalPercent.toFixed(0)}% das entradas).</p>
            </div>
          ) : todaySaldo >= 0 ? (
            <p className="text-sm font-medium text-secondary">💰 Ótimo trabalho! Seu lucro está crescendo. Saldo positivo de {formatCurrency(todaySaldo)} hoje.</p>
          ) : (
            <p className="text-sm font-medium text-destructive">📉 Atenção: Suas saídas superaram as entradas hoje.</p>
          )}
        </Card>
      )}

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

<Card className="p-5 border-none shadow-md relative overflow-hidden">
  <div className="flex flex-col items-center justify-center h-full">
    {dailyGoal === 0 ? (
      <div className="text-center">
        <Target className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Defina uma meta para hoje!</p>
        <button
          onClick={() => setIsEditingGoal(true)}
          className="mt-2 text-xs px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
        >
          🎯 Definir Meta
        </button>
      </div>
    ) : (
      <>
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(goalProgress, 100) / 100)}`}
              className={goalProgress >= 100 ? 'text-secondary' : 'text-primary'}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold">{Math.min(goalProgress, 100).toFixed(0)}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Meta: {formatCurrency(dailyGoal)}</p>
        <p className="text-sm font-semibold text-secondary">{formatCurrency(todayEntradas)}</p>
        {goalProgress >= 100 ? (
          <p className="text-xs text-secondary mt-1 font-medium">🏆 Meta batida! Dobrar? 🚀</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">Faltam {formatCurrency(dailyGoal - todayEntradas)}</p>
        )}
        <button
          onClick={() => setIsEditingGoal(true)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Ajustar meta
        </button>
      </>
    )}
  </div>
  
  {isEditingGoal && (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="space-y-3 w-full">
        <p className="text-sm font-medium text-center">Defina sua meta diária</p>
        <Input
          type="text"
          placeholder="Ex: 500,00"
          value={goalInput}
          onChange={e => setGoalInput(e.target.value)}
          className="text-center"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleSaveGoal}
            className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
          >
            Salvar
          </button>
          <button
            onClick={() => {
              setIsEditingGoal(false);
              setGoalInput('');
            }}
            className="flex-1 py-2 rounded-lg bg-muted text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )}
</Card>

        <Link to="/caixa?filter=saida" className="block">
          <Card className="p-5 border-none shadow-md hover:ring-2 hover:ring-destructive/30 transition-all cursor-pointer">
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
        </Link>

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
        <Card className="p-6 border-none shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-heading">Minha Vitrine</h2>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                config.vitrineActive ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'
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

      {/* Upgrade Banner */}
      {config.userPlan === 'gratuito' && (
        <Card className="p-5 border-none shadow-md gradient-primary text-primary-foreground">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-bold font-heading text-lg">Desbloqueie o potencial completo</p>
              <p className="text-sm opacity-90 mt-1">Relatórios avançados, Academy completa e mais por R$ 19,90/mês</p>
            </div>
            <a
              href={MERCADO_PAGO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-card text-foreground font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Fazer Upgrade — R$ 19,90/mês
            </a>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
