import { useMemo, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Wallet, Download, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2, Calendar, BarChart2, Target, Clock } from 'lucide-react';
import { LineChart, Line, ReferenceLine } from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  'Reposição': 'hsl(217, 91%, 60%)',
  'Embalagem': 'hsl(38, 92%, 50%)',
  'Frete': 'hsl(280, 60%, 55%)',
  'Pessoal': 'hsl(0, 84%, 60%)',
  'Funcionário': 'hsl(162, 63%, 41%)',
  'Outros': 'hsl(215, 16%, 47%)',
};

const periods = [
  { label: 'Hoje', value: 'today' },
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: '12 meses', value: '12m' },
] as const;

type Period = 'today' | '7d' | '30d' | '12m';

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const Relatorios = () => {
  const { config } = useStore();
  const [period, setPeriod] = useState<Period>('30d');
  const [anoComparacao, setAnoComparacao] = useState<number>(new Date().getFullYear());

  const now = new Date();
  const anoAtual = now.getFullYear();

  const filteredTransactions = useMemo(() => {
    return config.transactions.filter(t => {
      const d = new Date(t.date);
      if (period === 'today') return d.toISOString().split('T')[0] === now.toISOString().split('T')[0];
      if (period === '7d') return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
      if (period === '12m') return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 365;
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

  //dados dos últimos 12 meses (para o gráfico anual)
  const last12MonthsData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const target = new Date(anoAtual, now.getMonth() - (11 - i), 1);
      const m = target.getMonth();
      const a = target.getFullYear();
      const txs = config.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === a;
      });
      return {
        name: MESES_PT[m],
        Entradas: txs.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0),
        Saídas: txs.filter(t => t.type === 'saida').reduce((s, t) => s + t.value, 0),
      };
    });
  }, [config.transactions, anoAtual, now]);

  //comparativo anual — ano selecionado vs ano anterior
  const comparativoAnual = useMemo(() => {
    const anoAnt = anoComparacao - 1;
    return Array.from({ length: 12 }, (_, i) => {
      const txAtual = config.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === i && d.getFullYear() === anoComparacao;
      });
      const txAnt = config.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === i && d.getFullYear() === anoAnt;
      });
      const recAtual = txAtual.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
      const recAnt   = txAnt.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
      return {
        name: MESES_PT[i],
        [String(anoComparacao)]: recAtual,
        [String(anoAnt)]: recAnt,
      };
    });
  }, [config.transactions, anoComparacao]);

  //totais anuais para o card de comparação
  const totaisAnuais = useMemo(() => {
    const anoAnt = anoComparacao - 1;
    const somaAno = (ano: number) => config.transactions
      .filter(t => t.type === 'entrada' && new Date(t.date).getFullYear() === ano)
      .reduce((s, t) => s + t.value, 0);
    const atual = somaAno(anoComparacao);
    const anterior = somaAno(anoAnt);
    const diff = anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
    return { atual, anterior, diff, anoAnt };
  }, [config.transactions, anoComparacao]);

  //saldo diário acumulado nos últimos 30 dias (curva de caixa)
  const saldoDiario = useMemo(() => {
    const days: { dia: string; saldo: number }[] = [];
    let saldoAcum = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const txsDia = config.transactions.filter(t => t.date.startsWith(dStr));
      txsDia.forEach(t => { saldoAcum += t.type === 'entrada' ? t.value : -t.value; });
      days.push({ dia: `${d.getDate()}/${d.getMonth() + 1}`, saldo: saldoAcum });
    }
    return days;
  }, [config.transactions, now]);

  //ticket médio e dias sem receita
  const insights = useMemo(() => {
    const entradasPeriodo = filteredTransactions.filter(t => t.type === 'entrada');
    const diasComVenda = new Set(entradasPeriodo.map(t => t.date.split('T')[0])).size;
    const totalEntradas = entradasPeriodo.reduce((s, t) => s + t.value, 0);
    const ticketMedio = diasComVenda > 0 ? totalEntradas / diasComVenda : 0;

    //dias sem receita no período
    let diasNoPeriodo = period === 'today' ? 1 : period === '7d' ? 7 : period === '12m' ? 365 : 30;
    const diasSemReceita = diasNoPeriodo - diasComVenda;

    //meta diária
    const metaDiaria = config.dailyGoal ?? 0;
    const diasBatiuMeta = metaDiaria > 0
      ? [...new Set(entradasPeriodo.map(t => t.date.split('T')[0]))].filter(dia => {
          const totalDia = entradasPeriodo.filter(t => t.date.startsWith(dia)).reduce((s, t) => s + t.value, 0);
          return totalDia >= metaDiaria;
        }).length
      : 0;

    //projeção do mês
    const diasDecorridos = now.getDate();
    const receitaMes = config.transactions
      .filter(t => t.type === 'entrada' && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === anoAtual)
      .reduce((s, t) => s + t.value, 0);
    const diasNoMes = new Date(anoAtual, now.getMonth() + 1, 0).getDate();
    const projecaoMes = diasDecorridos > 0 ? (receitaMes / diasDecorridos) * diasNoMes : 0;

    //ranking de gastos por categoria
    const rankingGastos: { categoria: string; total: number; pct: number }[] = [];
    const mapGastos: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'saida').forEach(t => {
      mapGastos[t.category] = (mapGastos[t.category] || 0) + t.value;
    });
    const totalGastos = Object.values(mapGastos).reduce((s, v) => s + v, 0);
    Object.entries(mapGastos)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, total]) => rankingGastos.push({ categoria: cat, total, pct: totalGastos > 0 ? (total / totalGastos) * 100 : 0 }));

    return { ticketMedio, diasComVenda, diasSemReceita, diasBatiuMeta, metaDiaria, projecaoMes, receitaMes, diasDecorridos, diasNoMes, rankingGastos };
  }, [filteredTransactions, period, config.dailyGoal, config.transactions, now, anoAtual]);

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
  const topProdutos = useMemo(() => {
    const map = new Map<string, { total: number; qty: number }>();
    filteredTransactions
      .filter(t => t.type === 'entrada')
      .forEach(t => {
        const key = t.description.trim();
        const prev = map.get(key) ?? { total: 0, qty: 0 };
        map.set(key, { total: prev.total + t.value, qty: prev.qty + 1 });
      });
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredTransactions]);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const exportToCSV = () => {
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
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório</title><style>body{font-family:system-ui;padding:40px;color:#1a1a2e;}table{width:100%;border-collapse:collapse;}th{text-align:left;padding:10px 8px;border-bottom:2px solid #3b82f6;color:#64748b;font-size:13px;}.footer{margin-top:40px;text-align:center;color:#94a3b8;font-size:12px;}</style></head><body><h1>Relatório — ${periodLabel}</h1><p>Entradas: ${formatCurrency(totalE)} | Saídas: ${formatCurrency(totalS)} | Saldo: ${formatCurrency(totalE - totalS)} | Margem: ${margem.toFixed(1)}%</p><table><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th style="text-align:right;">Valor</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">Biztrivo</div></body></html>`;
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
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === p.value ? 'gradient-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:text-foreground'}`}>
                {p.label}
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

{/*cards insights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-none shadow-md">
          <div className="flex items-center gap-2 mb-2">
<Target className="w-4 h-4 text-primary" />
<p className="text-xs text-muted-foreground">Ticket médio/dia</p>
          </div>
          <p className="text-xl font-bold font-heading text-primary">{formatCurrency(insights.ticketMedio)}</p>
          <p className="text-xs text-muted-foreground mt-1">{insights.diasComVenda} dias com venda</p>
        </Card>
        <Card className="p-4 border-none shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-warning" />
            <p className="text-xs text-muted-foreground">Dias sem receita</p>
          </div>
          <p className={`text-xl font-bold font-heading ${insights.diasSemReceita > 10 ? 'text-destructive' : insights.diasSemReceita > 5 ? 'text-warning' : 'text-secondary'}`}>
            {insights.diasSemReceita}
          </p>
          <p className="text-xs text-muted-foreground mt-1">no período selecionado</p>
        </Card>
        <Card className="p-4 border-none shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <p className="text-xs text-muted-foreground">Projeção do mês</p>
          </div>
          <p className="text-xl font-bold font-heading text-secondary">{formatCurrency(insights.projecaoMes)}</p>
          <p className="text-xs text-muted-foreground mt-1">base: {insights.diasDecorridos}/{insights.diasNoMes} dias</p>
        </Card>
        {insights.metaDiaria > 0 ? (
          <Card className="p-4 border-none shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Meta diária</p>
            </div>
            <p className="text-xl font-bold font-heading text-primary">{insights.diasBatiuMeta} dias</p>
            <p className="text-xs text-muted-foreground mt-1">bateu {formatCurrency(insights.metaDiaria)}/dia</p>
          </Card>
        ) : (
          <Card className="p-4 border-none shadow-md opacity-50">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Meta diária</p>
            </div>
            <p className="text-sm text-muted-foreground">Configure em Painel</p>
          </Card>
        )}
      </div>

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
              <div className="space-y-2 mt-4">
                {insights.rankingGastos.map(d => (
                  <div key={d.categoria} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[d.categoria] || CATEGORY_COLORS['Outros'] }} />
                    <span className="text-xs text-muted-foreground flex-1">{d.categoria}</span>
                    <span className="text-xs font-semibold">{formatCurrency(d.total)}</span>
                    <span className="text-xs text-muted-foreground w-10 text-right">{d.pct.toFixed(0)}%</span>
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
            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Retiradas em {personalPercent.toFixed(0)}% — saudável.</p>
          )}
        </Card>
      </div>

{/*curva de saldo acumulado */}
      <Card className="p-6 border-none shadow-md">
        <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Curva de Caixa — 30 dias
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={saldoDiario}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="dia" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} interval={4} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(l) => `Dia ${l}`} contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--background))' }} />
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="saldo" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} name="Saldo acumulado" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Linha vermelha tracejada = zero. Abaixo dela indica saldo negativo acumulado.</p>
      </Card>

      <Card className="p-6 border-none shadow-md">
        <h2 className="text-lg font-semibold font-heading mb-4">
          {period === '12m' ? 'Entradas vs Saídas — 12 Meses' : 'Entradas vs Saídas — 3 Meses'}
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={period === '12m' ? last12MonthsData : last3MonthsData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: period === '12m' ? 10 : 12 }} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--background))' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Bar dataKey="Entradas" fill="hsl(142, 76%, 36%)" radius={[8, 8, 0, 0]} maxBarSize={60} />
              <Bar dataKey="Saídas" fill="hsl(0, 84%, 60%)" radius={[8, 8, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Comparativo anual */}
      <Card className="p-6 border-none shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Comparativo Anual
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ano:</span>
            <select
              value={anoComparacao}
              onChange={e => setAnoComparacao(Number(e.target.value))}
              className="h-8 px-2 rounded-md border border-input bg-background text-sm"
            >
              {[anoAtual, anoAtual - 1, anoAtual - 2].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

{/*card resumo */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-muted/40 text-center">
            <p className="text-xs text-muted-foreground mb-1">{totaisAnuais.anoAnt}</p>
            <p className="text-lg font-bold font-heading">{formatCurrency(totaisAnuais.anterior)}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/5 text-center">
            <p className="text-xs text-muted-foreground mb-1">Variação</p>
            <p className={`text-lg font-bold font-heading ${totaisAnuais.diff >= 0 ? 'text-secondary' : 'text-destructive'}`}>
              {totaisAnuais.diff >= 0 ? '+' : ''}{totaisAnuais.diff.toFixed(1)}%
            </p>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 text-center">
            <p className="text-xs text-muted-foreground mb-1">{anoComparacao}</p>
            <p className="text-lg font-bold font-heading">{formatCurrency(totaisAnuais.atual)}</p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparativoAnual}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--background))' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Bar dataKey={String(totaisAnuais.anoAnt)} fill="hsl(215, 16%, 47%)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Bar dataKey={String(anoComparacao)} fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {topProdutos.length > 0 && (
        <Card className="p-6 border-none shadow-md">
          <h2 className="text-lg font-semibold font-heading mb-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Top Produtos por Receita
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Baseado nas descrições dos lançamentos no período selecionado.</p>
          <div className="space-y-3">
            {topProdutos.map((p, i) => {
              const maxVal = topProdutos[0].total;
              const pct = (p.total / maxVal) * 100;
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                      <span className="text-sm font-medium truncate max-w-[200px]">{p.name}</span>
                      <span className="text-xs text-muted-foreground">({p.qty}x)</span>
                    </div>
                    <span className="text-sm font-bold text-secondary">{formatCurrency(p.total)}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Relatorios;
