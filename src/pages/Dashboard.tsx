import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/firebase';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Store, ExternalLink, Wallet, ShoppingBag, AlertTriangle, Trophy, Target, ShoppingCart, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Input } from '@/components/ui/input';
import CashflowForecast from '@/components/CashflowForecast';
import { useT } from '@/lib/i18n';

const QUICK_SALES_PER_PAGE = 8;
const QUICK_SALES_TTL = 48 * 60 * 60 * 1000; // 48h

// seen: quando o produto apareceu pela 1ª vez no card | dismissed: quando foi dispensado na lixeira
type QuickSalesState = {
  seen: Record<string, number>;
  dismissed: Record<string, number>;
};

const Dashboard = () => {
  const t = useT();
  const { config, updateConfig, addTransaction } = useStore();
  const { user } = useAuth();

  const [dailyGoal, setDailyGoal] = useState(config.dailyGoal);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalReached, setGoalReached] = useState(false);
  const [confirmedSaleId, setConfirmedSaleId] = useState<string | null>(null);

  const quickRef = useMemo(
    () => (user ? doc(db, 'users', user.uid, 'quickSales', 'state') : null),
    [user?.uid]
  );
  const [quickState, setQuickState] = useState<QuickSalesState>({ seen: {}, dismissed: {} });
  const [quickReady, setQuickReady] = useState(false);
  const [quickPage, setQuickPage] = useState(1);

  useEffect(() => {
    setDailyGoal(config.dailyGoal);
  }, [config.dailyGoal]);

  //sincronizado entre dispositivos
  useEffect(() => {
    let active = true;
    setQuickReady(false);
    if (!quickRef) return;
    getDoc(quickRef)
      .then(snap => {
        if (!active) return;
        const data = snap.exists() ? snap.data() : null;
        setQuickState({ seen: data?.seen ?? {}, dismissed: data?.dismissed ?? {} });
        setQuickReady(true);
      })
      // Sem estado confiável não mostramos o card (evita resetar o relógio de 48h por engano)
      .catch(err => console.error('quickSales load error:', err));
    return () => { active = false; };
  }, [quickRef]);

  // registra (uma única vez) quando cada produto apareceu pela primeira vez
  useEffect(() => {
    if (!quickReady || !quickRef) return;
    const missing = config.products.filter(p => quickState.seen[p.id] === undefined);
    if (missing.length === 0) return;
    const nowMs = Date.now();
    const newSeen: Record<string, number> = {};
    missing.forEach(p => { newSeen[p.id] = nowMs; });
    setQuickState(prev => ({ ...prev, seen: { ...newSeen, ...prev.seen } }));
    setDoc(quickRef, { seen: newSeen }, { merge: true })
      .catch(err => console.error('quickSales seen error:', err));
  }, [quickReady, quickRef, config.products, quickState.seen]);

  const quickSaleProducts = useMemo(() => {
    if (!quickReady) return [];
    const nowMs = Date.now();
    return config.products.filter(p => {
      if (p.stock === 0) return false;
      if (quickState.dismissed[p.id]) return false;
      const seenAt = quickState.seen[p.id];
      return seenAt === undefined || nowMs - seenAt < QUICK_SALES_TTL;
    });
  }, [config.products, quickState, quickReady]);

  const quickTotalPages = Math.max(1, Math.ceil(quickSaleProducts.length / QUICK_SALES_PER_PAGE));
  const pagedQuickSales = useMemo(() => {
    const start = (quickPage - 1) * QUICK_SALES_PER_PAGE;
    return quickSaleProducts.slice(start, start + QUICK_SALES_PER_PAGE);
  }, [quickSaleProducts, quickPage]);

  useEffect(() => {
    if (quickPage > quickTotalPages) setQuickPage(quickTotalPages);
  }, [quickPage, quickTotalPages]);

  const dismissQuickSale = (id: string) => {
    if (!quickRef) return;
    const ts = Date.now();
    setQuickState(prev => ({ ...prev, dismissed: { ...prev.dismissed, [id]: ts } }));
    setDoc(quickRef, { dismissed: { [id]: ts } }, { merge: true })
      .catch(err => console.error('quickSales dismiss error:', err));
  };

  //LOCAL date (not UTC) so transactions added late at night in BR (UTC-3)
  // are not bucketed into "tomorrow" and disappear from the dashboard.
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayTransactions = useMemo(() =>
    config.transactions.filter(t => {
      const d = new Date(t.date);
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return local === todayStr;
    }),
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
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
    if (todayEntradas < dailyGoal) setGoalReached(false);
  }, [todayEntradas, dailyGoal, goalReached]);

  const handleSaveGoal = () => {
    const value = parseFloat(goalInput.replace(',', '.'));
    if (value > 0) {
      setDailyGoal(value);
      updateConfig({ dailyGoal: value });
      setIsEditingGoal(false);
      setGoalInput('');
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">{t('ext.db_title')}</h1>
        <p className="text-muted-foreground mt-1">{t('ext.db_subtitle')}</p>
      </div>

      {todayEntradas > 0 && (
        <Card className={`p-4 border-none shadow-md ${personalPercent > 30 ? 'bg-warning/10 border-l-4 border-l-warning' : 'bg-secondary/10 border-l-4 border-l-secondary'}`}>
          {personalPercent > 30 ? (
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              <p className="text-sm font-medium text-warning flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {t('dashboard.alert_personal_high', { percent: personalPercent.toFixed(0) })}</p>
            </div>
          ) : todaySaldo >= 0 ? (
            <p className="text-sm font-medium text-secondary flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {t('dashboard.alert_positive', { amount: formatCurrency(todaySaldo) })}</p>
          ) : (
            <p className="text-sm font-medium text-destructive flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5" /> {t('dashboard.alert_negative')}</p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-tour="balance" className="p-5 border-none shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.balance_day')}</p>
              <p className={`text-2xl font-bold font-heading mt-1 ${todaySaldo >= 0 ? 'text-secondary' : 'text-destructive'}`}>{formatCurrency(todaySaldo)}</p>
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
                <p className="text-xs text-muted-foreground">{t('dashboard.goal_set')}</p>
                <button onClick={() => setIsEditingGoal(true)} className="mt-2 text-xs px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90">{t('dashboard.set_goal_btn')}</button>
              </div>
            ) : (
              <>
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(goalProgress, 100) / 100)}`}
                      className={goalProgress >= 100 ? 'text-secondary' : 'text-primary'}
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{Math.min(goalProgress, 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t('dashboard.goal_label', { amount: formatCurrency(dailyGoal) })}</p>
                <p className="text-sm font-semibold text-secondary">{formatCurrency(todayEntradas)}</p>
                {goalProgress >= 100 ? (
                  <p className="text-xs text-secondary mt-1 font-medium flex items-center gap-1"><Trophy className="w-3 h-3" /> {t('dashboard.goal_reached')}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.goal_missing', { amount: formatCurrency(dailyGoal - todayEntradas) })}</p>
                )}
                <button onClick={() => setIsEditingGoal(true)} className="mt-2 text-xs text-muted-foreground hover:text-foreground">{t('dashboard.adjust_goal')}</button>
              </>
            )}
          </div>
          {isEditingGoal && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="space-y-3 w-full">
                <p className="text-sm font-medium text-center">{t('dashboard.goal_modal_title')}</p>
                <Input type="text" placeholder={t('dashboard.goal_placeholder')} value={goalInput} onChange={e => setGoalInput(e.target.value)} className="text-center" autoFocus />
                <div className="flex gap-2">
                  <button onClick={handleSaveGoal} className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">{t('dashboard.goal_save')}</button>
                  <button onClick={() => { setIsEditingGoal(false); setGoalInput(''); }} className="flex-1 py-2 rounded-lg bg-muted text-sm font-medium">{t('ext.db_cancel')}</button>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Link to="/caixa?filter=saida" className="block">
          <Card className="p-5 border-none shadow-md hover:ring-2 hover:ring-destructive/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.exits_today')}</p>
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
              <p className="text-sm text-muted-foreground">{t('dashboard.personal_expense')}</p>
              <p className="text-2xl font-bold font-heading mt-1 text-warning">{formatCurrency(personalExpenses)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-warning" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-none shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-heading">{t('dashboard.my_vitrine')}</h2>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.status')}</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-1 ${config.vitrineActive ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'}`}>
                <span className={`w-2 h-2 rounded-full ${config.vitrineActive ? 'bg-secondary' : 'bg-muted-foreground'}`} />
                {config.vitrineActive ? t('common.active') : t('common.inactive')}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('dashboard.products')}</p>
              <p className="text-2xl font-bold font-heading">{config.products.length}</p>
            </div>
          </div>
          <Link to="/vitrine" className="flex items-center justify-center gap-2 w-full py-3 rounded-lg gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity">
            <ExternalLink className="w-4 h-4" /> {t('dashboard.manage_vitrine')}
          </Link>
        </Card>

        <Card className="p-6 border-none shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-heading">{t('dashboard.quick_cash')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t('dashboard.quick_cash_sub')}</p>
          <div data-tour="quick-cash" className="flex gap-3">
            <Link to="/caixa" className="flex-1 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm text-center hover:opacity-90 transition-opacity shadow-glow-green">{t('dashboard.income')}</Link>
            <Link to="/caixa" className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm text-center hover:opacity-90 transition-opacity">{t('dashboard.expense')}</Link>
          </div>
        </Card>
      </div>

      {quickSaleProducts.length > 0 && !config.vitrineOnlyMode && (
        <Card className="p-6 border-none shadow-md">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-heading">Confirmar venda recebida</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Recebeu o pagamento pelo WhatsApp ou PIX? Toque no produto para lançar no Caixa.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Produtos não confirmados ou descartados somem desta lista após 48 horas.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {pagedQuickSales.map(p => {
              const price = p.discountPrice > 0 ? p.discountPrice : p.originalPrice;
              const isConfirmed = confirmedSaleId === p.id;
              return (
                <div key={p.id} className="relative">
                  <button
                    disabled={isConfirmed}
                    onClick={async () => {
                      await addTransaction({
                        type: 'entrada',
                        value: price,
                        description: p.name,
                        category: 'Venda',
                        isPersonal: false,
                        date: new Date().toISOString(),
                      });
                      setConfirmedSaleId(p.id);
                      setTimeout(() => setConfirmedSaleId(null), 2000);
                    }}
                    className={`w-full h-full flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                      isConfirmed
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    {p.photo
                      ? <img src={p.photo} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                      : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-muted-foreground/40" /></div>
                    }
                    <div className="w-full">
                      <p className="text-xs font-medium line-clamp-2 leading-tight">{p.name}</p>
                      <p className="text-xs font-bold text-secondary mt-0.5">
                        {isConfirmed
                          ? <span className="flex items-center gap-1 text-secondary"><Check className="w-3 h-3" /> Lançado!</span>
                          : `R$ ${price.toFixed(2).replace('.', ',')}`
                        }
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissQuickSale(p.id)}
                    title="Não vendi — tirar desta lista (o produto continua na Vitrine)"
                    aria-label={`Tirar ${p.name} da lista de confirmação`}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {quickTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                disabled={quickPage <= 1}
                onClick={() => setQuickPage(p => Math.max(1, p - 1))}
                className="h-8 gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <span className="text-xs font-medium">
                Página {quickPage} de {quickTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={quickPage >= quickTotalPages}
                onClick={() => setQuickPage(p => Math.min(quickTotalPages, p + 1))}
                className="h-8 gap-1"
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      )}
      <CashflowForecast />
    </div>
  );
};

export default Dashboard;
