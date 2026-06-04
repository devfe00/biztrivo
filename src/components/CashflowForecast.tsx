import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Forecast {
  previsao_7_dias: number;
  previsao_30_dias: number;
  risco: 'baixo' | 'medio' | 'alto';
  alerta: string;
  recomendacao: string;
  generated_at: string;
}

const SIX_HOURS = 6 * 60 * 60 * 1000;

const CashflowForecast = () => {
  const { user } = useAuth();
  const cacheKey = user ? `biztrivo:forecast:${user.id}` : '';
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState<string | null>(null);

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

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    setInsufficient(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('forecast-cashflow', { body: {} });
      if (fnErr) throw fnErr;
      if (data?.insufficient_data) {
        setInsufficient(data.message);
      } else if (data?.error) {
        setError(data.error);
      } else {
        setForecast(data);
        if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao gerar previsão');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const riskColor = forecast?.risco === 'alto' ? 'border-l-destructive bg-destructive/5'
    : forecast?.risco === 'medio' ? 'border-l-warning bg-warning/5'
    : 'border-l-secondary bg-secondary/5';

  return (
    <Card className={`p-6 border-none shadow-md border-l-4 ${forecast ? riskColor : 'border-l-primary bg-primary/5'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold font-heading">Previsão de Caixa (IA)</h2>
        </div>
        <button
          onClick={fetchForecast}
          disabled={loading || (forecast !== null && !canRefresh())}
          className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition"
          title={!canRefresh() ? 'Atualize novamente em algumas horas' : 'Gerar previsão'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {forecast ? 'Atualizar' : 'Gerar previsão'}
        </button>
      </div>

      {insufficient && (
        <p className="text-sm text-muted-foreground">{insufficient}</p>
      )}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</p>
      )}

      {!forecast && !insufficient && !error && !loading && (
        <p className="text-sm text-muted-foreground">Clique em "Gerar previsão" para analisar seus últimos 60 dias e ver projeção dos próximos 7 e 30 dias.</p>
      )}

      {forecast && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
              <p className={`text-xl font-bold font-heading ${forecast.previsao_7_dias >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                {fmt(forecast.previsao_7_dias)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
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
            Gerado por IA • {new Date(forecast.generated_at).toLocaleString('pt-BR')} • Estimativa, não garantia
          </p>
        </div>
      )}
    </Card>
  );
};

export default CashflowForecast;