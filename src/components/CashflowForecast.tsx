import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, Lock } from 'lucide-react';
import { FUNCTIONS, callFunction } from '@/integrations/firebase/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useT, useI18n } from '@/lib/i18n';
import { getCurrentSubscription, hasProSubscription } from '@/lib/billing';
import UpgradeModal from '@/components/UpgradeModal';

interface Forecast {
  previsao_7_dias: number;
  previsao_30_dias: number;
  risco: 'baixo' | 'medio' | 'alto';
  alerta: string;
  recomendacao: string;
  generated_at: string;
}

const SIX_HOURS = 6 * 60 * 60 * 1000;
const PRO_ONLY_MESSAGE = 'A Previsão de Caixa com Inteligência Artificial é exclusiva para assinantes Biztrivo.';
const TRIAL_LIMIT_MESSAGE = 'Você atingiu o limite de previsões de caixa do período de teste.';

const CashflowForecast = () => {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const cacheKey = user ? `biztrivo:forecast:${user.uid}` : '';
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState<string | null>(null);
  const [trialUsage, setTrialUsage] = useState<{ used: number; remaining: number; limit: number } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState(PRO_ONLY_MESSAGE);
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) { setIsPro(false); return; }
    setIsPro(null);
    getCurrentSubscription(user.uid)
      .then(sub => { if (active) setIsPro(hasProSubscription(sub)); })
      .catch(() => { /* se falhar, o backend continua validando */ });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!cacheKey) return;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setForecast(JSON.parse(cached)); } catch {}
    }
  }, [cacheKey]);

  const canRefresh = () => {
    if (!forecast) return true;
    return Date.now() - new Date(forecast.generated_at).getTime() > SIX_HOURS;
  };

  const handleForecastClick = async () => {
    let allowed = isPro;
    if (allowed === null && user) {
      try {
        const sub = await getCurrentSubscription(user.uid);
        allowed = hasProSubscription(sub);
        setIsPro(allowed);
      } catch {
        allowed = true; 
      }
    }
    if (!allowed) {
      setUpgradeReason(PRO_ONLY_MESSAGE);
      setShowUpgrade(true);
      return;
    }
    fetchForecast();
  };

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    setInsufficient(null);
    try {
      const data = await callFunction<Forecast & {
        insufficient_data?: boolean;
        message?: string;
        error?: string;
        trialUsage?: { used: number; remaining: number; limit: number } | null;
      }>(FUNCTIONS.forecastCashflow, {});
      if (data?.insufficient_data) {
        setInsufficient(data.message);
      } else if (data?.error) {
        setError(data.error);
      } else {
        setForecast(data);
        if (data.trialUsage) setTrialUsage(data.trialUsage);
        if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (e: any) {
      if ((e as any)?.status === 403 && (e as any)?.code === 'UPGRADE_REQUIRED') {
        setUpgradeReason(PRO_ONLY_MESSAGE);
        setShowUpgrade(true);
      } else {
        setError(e?.message || t('cashflow_forecast.generic_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


  const riskColor = forecast?.risco === 'alto' ? 'border-l-destructive bg-destructive/5'
    : forecast?.risco === 'medio' ? 'border-l-warning bg-warning/5'
    : 'border-l-secondary bg-secondary/5';

  return (
    <>
    <Card className={`p-6 border-none shadow-md border-l-4 ${forecast ? riskColor : 'border-l-primary bg-primary/5'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold font-heading">{t('cashflow_forecast.ai_title')}</h2>
        </div>
        <button
          onClick={handleForecastClick}
          disabled={loading || (isPro !== false && forecast !== null && !canRefresh())}
          className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition"
          title={
            isPro === false
              ? 'Recurso exclusivo para assinantes Biztrivo'
              : !canRefresh() ? t('cashflow_forecast.refresh_tooltip') : t('cashflow_forecast.generate_tooltip')
          }
        >
          {isPro === false
            ? <Lock className="w-3.5 h-3.5" />
            : <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          }
          {forecast ? t('cashflow_forecast.refresh_button') : t('cashflow_forecast.generate_button')}
          {isPro === false && <span className="ml-1 px-1.5 py-0.5 rounded bg-primary-foreground/20 text-[9px] font-bold">PRO</span>}
        </button>
      </div>

      {insufficient && (
        <p className="text-sm text-muted-foreground">{insufficient}</p>
      )}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</p>
      )}

      {!forecast && !insufficient && !error && !loading && (
        <p className="text-sm text-muted-foreground">{t('cashflow_forecast.empty_state')}</p>
      )}

      {forecast && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('cashflow_forecast.next_7_days')}</p>
              <p className={`text-xl font-bold font-heading ${forecast.previsao_7_dias >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                {fmt(forecast.previsao_7_dias)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('cashflow_forecast.next_30_days')}</p>
              <p className={`text-xl font-bold font-heading ${forecast.previsao_30_dias >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                {fmt(forecast.previsao_30_dias)}
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-3 space-y-1.5">
            <p className="text-sm font-medium flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${forecast.risco === 'alto' ? 'text-destructive' : forecast.risco === 'medio' ? 'text-warning' : 'text-secondary'}`} />
              <span>{forecast.alerta}</span>
            </p>
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <TrendingUp className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span>{forecast.recomendacao}</span>
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground text-right">
            {t('cashflow_forecast.generated_by_ai', { date: new Date(forecast.generated_at).toLocaleString(lang) })}
          </p>
          {trialUsage && (
            <p className="text-[10px] text-muted-foreground text-right">
              Previsões este mês: <strong>{trialUsage.used}/{trialUsage.limit}</strong> — <strong>{trialUsage.remaining}</strong> restantes
            </p>
          )}
        </div>
      )}
    </Card>
<UpgradeModal
      open={showUpgrade}
      onClose={() => setShowUpgrade(false)}
      reason={upgradeReason}
    />
  </>
);
};

export default CashflowForecast;