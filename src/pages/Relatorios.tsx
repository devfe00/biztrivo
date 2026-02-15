import { useMemo, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, TrendingUp, Wallet } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'Reposição': 'hsl(217, 91%, 60%)',
  'Embalagem': 'hsl(38, 92%, 50%)',
  'Frete': 'hsl(280, 60%, 55%)',
  'Pessoal': 'hsl(0, 84%, 60%)',
  'Outros': 'hsl(215, 16%, 47%)',
};

const periods = [
  { label: 'Hoje', value: 'today' },
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
] as const;

const Relatorios = () => {
  const { config } = useStore();
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('30d');

  const now = new Date();

  const filteredTransactions = useMemo(() => {
    return config.transactions.filter(t => {
      const d = new Date(t.date);
      if (period === 'today') {
        return d.toISOString().split('T')[0] === now.toISOString().split('T')[0];
      }
      if (period === '7d') {
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    });
  }, [config.transactions, period]);

  const entradas = filteredTransactions.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
  const saidasBusiness = filteredTransactions
    .filter(t => t.type === 'saida' && ['Reposição', 'Embalagem', 'Frete'].includes(t.category))
    .reduce((s, t) => s + t.value, 0);
  const personalTotal = filteredTransactions.filter(t => t.isPersonal).reduce((s, t) => s + t.value, 0);

  const margem = entradas > 0 ? ((entradas - saidasBusiness) / entradas) * 100 : 0;
  const personalPercent = entradas > 0 ? (personalTotal / entradas) * 100 : 0;

  // Pie chart data - only expenses by category
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'saida')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.value;
      });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Outros'],
    }));
  }, [filteredTransactions]);

  const totalSaidas = categoryData.reduce((s, d) => s + d.value, 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Análise financeira do seu negócio</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === p.value
                  ? 'gradient-primary text-primary-foreground shadow-glow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Margin Card */}
      <Card className="p-6 border-none shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold font-heading">Margem de Lucro Real</h2>
            <p className="text-xs text-muted-foreground">Exclui gastos pessoais do cálculo</p>
          </div>
        </div>
        <div className="flex items-end gap-4 mb-4">
          <p className={`text-4xl font-bold font-heading ${margem >= 50 ? 'text-secondary' : margem >= 20 ? 'text-warning' : 'text-destructive'}`}>
            {margem.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground pb-1">
            {formatCurrency(entradas)} entradas — {formatCurrency(saidasBusiness)} custos operacionais
          </p>
        </div>
        <Progress value={Math.min(margem, 100)} className="h-3" />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="p-6 border-none shadow-md">
          <h2 className="text-lg font-semibold font-heading mb-4">Distribuição de Gastos</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem saídas no período</p>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                {categoryData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold">{totalSaidas > 0 ? ((d.value / totalSaidas) * 100).toFixed(0) : 0}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Personal Withdrawal Monitor */}
        <Card className={`p-6 border-none shadow-md ${personalPercent > 30 ? 'border-l-4 border-l-warning' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-warning" />
            </div>
            <h2 className="text-lg font-semibold font-heading">Monitor de Sangria</h2>
          </div>
          <p className="text-4xl font-bold font-heading text-warning mb-2">
            {formatCurrency(personalTotal)}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            retirado para uso pessoal neste período
          </p>
          {personalPercent > 30 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-warning">
                Cuidado, você já tirou {formatCurrency(personalTotal)} do lucro da loja este mês. Suas retiradas pessoais representam {personalPercent.toFixed(0)}% das entradas.
              </p>
            </div>
          )}
          {personalPercent <= 30 && personalTotal > 0 && (
            <p className="text-sm text-muted-foreground">
              ✅ Suas retiradas representam {personalPercent.toFixed(0)}% das entradas — dentro do saudável.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
