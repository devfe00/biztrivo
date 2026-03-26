import { useMemo, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, Wallet, Download, Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
  const { isPro } = useAuth();
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('30d');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const now = new Date();

  const handlePeriodChange = (newPeriod: 'today' | '7d' | '30d') => {
    if (!isPro && newPeriod !== 'today') {
      setShowUpgradeModal(true);
      return;
    }
    setPeriod(newPeriod);
  };

  const filteredTransactions = useMemo(() => {
    return config.transactions.filter(t => {
      const d = new Date(t.date);
      if (period === 'today') return d.toISOString().split('T')[0] === now.toISOString().split('T')[0];
      if (period === '7d') return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 30;
    });
  }, [config.transactions, period, now]);

  const performanceSummary = useMemo(() => {
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonthTx = config.transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthTx = config.transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; });
    const currentRevenue = currentMonthTx.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
    const lastRevenue = lastMonthTx.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
    const percentChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    return { currentRevenue, lastRevenue, percentChange, isPositive: percentChange >= 0 };
  }, [config.transactions, now]);

  const last3MonthsData = useMemo(() => {
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const name = target.toLocaleDateString('pt-BR', { month: 'short' });
      const txs = config.transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear(); });
      months.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        Entradas: txs.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0),
        'Saídas': txs.filter(t => t.type === 'saida').reduce((s, t) => s + t.value, 0),
      });
    }
    return months;
  }, [config.transactions, now]);

  const entradas = filteredTransactions.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
  const saidasBusiness = filteredTransactions.filter(t => t.type === 'saida' && ['Reposição', 'Embalagem', 'Frete'].includes(t.category)).reduce((s, t) => s + t.value, 0);
  const personalTotal = filteredTransactions.filter(t => t.isPersonal).reduce((s, t) => s + t.value, 0);
  const margem = entradas > 0 ? ((entradas - saidasBusiness) / entradas) * 100 : 0;
  const personalPercent = entradas > 0 ? (personalTotal / entradas) * 100 : 0;

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'saida').forEach(t => { map[t.category] = (map[t.category] || 0) + t.value; });
    return Object.entries(map).map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Outros'] }));
  }, [filteredTransactions]);

  const totalSaidas = categoryData.reduce((s, d) => s + d.value, 0);
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const exportToCSV = () => {
    if (!isPro) { setShowUpgradeModal(true); return; }
    if (filteredTransactions.length === 0) { alert('Sem transações.'); return; }
    const rows = filteredTransactions.map(t => [new Date(t.date).toLocaleDateString('pt-BR'), t.type === 'entrada' ? 'Entrada' : 'Saída', t.category, t.description, t.value.toFixed(2).replace('.', ','), t.isPersonal ? 'Sim' : 'Não']);
    const csv = ['Data;Tipo;Categoria;Descrição;Valor;Pessoal', ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    if (filteredTransactions.length === 0) { alert('Sem transações.'); return; }
    const periodLabel = period === 'today' ? 'Hoje' : period === '7d' ? '7 dias' : '30 dias';
    const totalE = filteredTransactions.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
    const totalS = filteredTransactions.filter(t => t.type === 'saida').reduce((s, t) => s + t.value, 0);
    let rows = '';
    filteredTransactions.forEach(t => {
      const color = t.type === 'entrada' ? '#22c55e' : t.isPersonal ? '#f59e0b' : '#ef4444';
      rows += `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${new Date(t.date).toLocaleDateString('pt-BR')}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${color};font-weight:600;">${t.type === 'entrada' ? 'Entrada' : 'Saída'}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${t.category}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${t.description}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;color:${color};">${formatCurrency(t.value)}</td></tr>`;
    });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório</title><style>body{font-family:system-ui;padding:40px;color:#1a1a2e;}table{width:100%;border-collapse:collapse;}th{text-align:left;padding:10px 8px;border-bottom:2px solid #3b82f6;color:#64748b;font-size:13px;}.footer{margin-top:40px;text-align:center;color:#94a3b8;font-size:12px;}</style></head><body><h1>📊 Relatório — ${periodLabel}</h1><p>Entradas: ${formatCurrency(totalE)} | Saídas: ${formatCurrency(totalS)} | Saldo: ${formatCurrency(totalE - totalS)} | Margem: ${margem.toFixed(1)}%</p><table><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th style="text-align:right;">Valor</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">Biztrivo</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Análise financeira do seu negócio</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-all font-medium shadow-glow">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all font-medium shadow-sm">
            <Download className="w-4 h-4" /> CSV
          </button>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {periods.map(p => (
              <button key={p.value} onClick={() => handlePeriodChange(p.value)}
                disabled={!isPro && p.value !== 'today'}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${period === p.value ? 'gradient-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:text-foreground'} ${!isPro && p.value !== 'today' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {p.label}
                {!isPro && p.value !== 'today' && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-warning" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {performanceSummary.lastRevenue > 0 && (
        <Card className="p-4 border-none shadow-md bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${performanceSummary.isPositive ? 'bg-secondary/20' : 'bg-destructive/20'}`}>
              {performanceSummary.isPositive ? <ArrowUpRight className="w-5 h-5 text-secondary" /> : <ArrowDownRight className="w-5 h-5 text-destructive" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Performance do Mês</p>
              <p className="text-lg font-semibold font-heading">
                <span className={performanceSummary.isPositive ? 'text-secondary' : 'text-destructive'}>
                  Faturamento {Math.abs(performanceSummary.percentChange).toFixed(1)}% {performanceSummary.isPositive ? 'maior' : 'menor'} que o mês passado
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Este mês</p>
              <p className="text-lg font-bold">{formatCurrency(performanceSummary.currentRevenue)}</p>
            </div>
          </div>
        </Card>
      )}

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
          <p className={`text-4xl font-bold font-heading ${margem >= 50 ? 'text-secondary' : margem >= 20 ? 'text-warning' : 'text-destructive'}`}>{margem.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground pb-1">{formatCurrency(entradas)} entradas — {formatCurrency(saidasBusiness)} custos</p>
        </div>
        <Progress value={Math.min(margem, 100)} className="h-3" />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-none shadow-md">
          <h2 className="text-lg font-semibold font-heading mb-4">Distribuição de Gastos</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem saídas no período</p>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
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

        <Card className={`p-6 border-none shadow-md ${personalPercent > 30 ? 'border-l-4 border-l-warning' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-warning" />
            </div>
            <h2 className="text-lg font-semibold font-heading">Monitor de Sangria</h2>
          </div>
          <p className="text-4xl font-bold font-heading text-warning mb-2">{formatCurrency(personalTotal)}</p>
          <p className="text-sm text-muted-foreground mb-4">retirado para uso pessoal</p>
          {personalPercent > 30 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-warning">Cuidado, suas retiradas representam {personalPercent.toFixed(0)}% das entradas.</p>
            </div>
          )}
          {personalPercent <= 30 && personalTotal > 0 && (
            <p className="text-sm text-muted-foreground">✅ Retiradas em {personalPercent.toFixed(0)}% — saudável.</p>
          )}
        </Card>
      </div>

      <Card className="p-6 border-none shadow-md">
        <h2 className="text-lg font-semibold font-heading mb-4">Entradas vs Saídas - 3 Meses</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last3MonthsData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--background))' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Bar dataKey="Entradas" fill="hsl(142, 76%, 36%)" radius={[8, 8, 0, 0]} maxBarSize={60} />
              <Bar dataKey="Saídas" fill="hsl(0, 84%, 60%)" radius={[8, 8, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 border-none shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Lock className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading">Recurso Pro</h3>
                <p className="text-sm text-muted-foreground">Desbloqueie análises avançadas</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">Relatórios de 7 e 30 dias são exclusivos do plano Pro.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-all font-medium">Cancelar</button>
              <button onClick={() => { setShowUpgradeModal(false); window.location.href = '/configuracoes'; }} className="flex-1 px-4 py-2 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-all font-medium shadow-glow">Fazer Upgrade</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
