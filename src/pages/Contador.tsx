import { useMemo, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
  Target,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const LIMITE_MEI_ANUAL = 81000;
const DAS_MEI_MENSAL = 76.9; // fixo 2026 — atualizar quando o governo alterar

//mapeamento de categorias do caixa para linhas da DRE
const CATEGORIA_DRE: Record<string, 'receita' | 'cmv' | 'despesa_op' | 'prolabore' | 'ignorar'> = {
  Venda:      'receita',
  Reposição:  'cmv',
  Embalagem:  'despesa_op',
  Frete:      'despesa_op',
  Pessoal:    'prolabore',
  Outros:     'despesa_op',
};

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

type Aba = 'dre' | 'score' | 'impostos';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${v.toFixed(1)}%`;

function localDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const Contador = () => {
  const { config } = useStore();
  const [aba, setAba] = useState<Aba>('dre');

  const now = new Date();
  const mesAtual = now.getMonth();
  const anoAtual = now.getFullYear();

  // DRE por competência (mês corrente) 
  const dre = useMemo(() => {
    const txMes = config.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });

    let receita = 0, cmv = 0, despesaOp = 0, prolabore = 0;

    for (const t of txMes) {
      if (t.type === 'entrada') {
        receita += t.value;
        continue;
      }
      const linha = CATEGORIA_DRE[t.category] ?? 'despesa_op';
      if (linha === 'cmv')        cmv        += t.value;
      else if (linha === 'despesa_op') despesaOp += t.value;
      else if (linha === 'prolabore')  prolabore += t.value;
    }

    const lucroBruto   = receita - cmv;
    const ebitda       = lucroBruto - despesaOp;
    const lucroLiquido = ebitda - prolabore - DAS_MEI_MENSAL;
    const margemBruta  = receita > 0 ? (lucroBruto / receita) * 100 : 0;
    const margemLiq    = receita > 0 ? (lucroLiquido / receita) * 100 : 0;

    return { receita, cmv, lucroBruto, despesaOp, ebitda, prolabore, lucroLiquido, margemBruta, margemLiq };
  }, [config.transactions, mesAtual, anoAtual]);

  // histórico 6 meses para tendência 
  const historico6m = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const target = new Date(anoAtual, mesAtual - (5 - i), 1);
      const m = target.getMonth();
      const a = target.getFullYear();
      const txs = config.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === a;
      });
      const receita  = txs.filter(t => t.type === 'entrada').reduce((s, t) => s + t.value, 0);
      const despesas = txs.filter(t => t.type === 'saida').reduce((s, t) => s + t.value, 0);
      return { mes: MESES[m], receita, despesas, saldo: receita - despesas };
    });
  }, [config.transactions, mesAtual, anoAtual]);

  // score de saúde 0-100 
  const score = useMemo(() => {
    const { margemBruta, receita } = dre;
    const pessoal = config.transactions
      .filter(t => t.isPersonal && new Date(t.date).getMonth() === mesAtual && new Date(t.date).getFullYear() === anoAtual)
      .reduce((s, t) => s + t.value, 0);

    // Componente 1: Margem bruta (peso 30)
    const scoreMargemBruta = margemBruta >= 50 ? 30 : margemBruta >= 40 ? 24 : margemBruta >= 25 ? 15 : margemBruta > 0 ? 6 : 0;

    // Componente 2: Retiradas pessoais (peso 25)
    const pctPessoal = receita > 0 ? (pessoal / receita) * 100 : 100;
    const scorePessoal = pctPessoal <= 15 ? 25 : pctPessoal <= 25 ? 20 : pctPessoal <= 35 ? 10 : 0;

    // Componente 3: Consistência de receita 6 meses (peso 20)
    const mesesComReceita = historico6m.filter(m => m.receita > 0).length;
    const scoreConsistencia = mesesComReceita >= 5 ? 20 : mesesComReceita >= 3 ? 12 : mesesComReceita >= 1 ? 6 : 0;

    // Componente 4: Saldo positivo (peso 15)
    const scoreSaldo = dre.lucroLiquido > 0 ? 15 : dre.lucroLiquido === 0 ? 7 : 0;

    // Componente 5: Limite MEI (peso 10)
    const receitaAnual = config.transactions
      .filter(t => t.type === 'entrada' && !t.isPersonal && new Date(t.date).getFullYear() === anoAtual)
      .reduce((s, t) => s + t.value, 0);
    const pctMei = (receitaAnual / LIMITE_MEI_ANUAL) * 100;
    const scoreMei = pctMei < 70 ? 10 : pctMei < 90 ? 6 : 0;

    const total = scoreMargemBruta + scorePessoal + scoreConsistencia + scoreSaldo + scoreMei;

    return {
      total,
      componentes: [
        { label: 'Margem bruta', valor: scoreMargemBruta, max: 30, detalhe: `${pct(margemBruta)} de margem` },
        { label: 'Retiradas pessoais', valor: scorePessoal, max: 25, detalhe: `${pct(pctPessoal)} das entradas` },
        { label: 'Consistência de receita', valor: scoreConsistencia, max: 20, detalhe: `${mesesComReceita}/6 meses com receita` },
        { label: 'Resultado líquido', valor: scoreSaldo, max: 15, detalhe: dre.lucroLiquido > 0 ? 'Positivo' : dre.lucroLiquido === 0 ? 'Neutro' : 'Negativo' },
        { label: 'Limite MEI', valor: scoreMei, max: 10, detalhe: `${pctMei.toFixed(0)}% do limite usado` },
      ],
      nivel: total >= 75 ? 'Saudável' : total >= 50 ? 'Atenção' : 'Crítico',
      cor: total >= 75 ? 'text-secondary' : total >= 50 ? 'text-warning' : 'text-destructive',
      bgCor: total >= 75 ? 'bg-secondary/10' : total >= 50 ? 'bg-warning/10' : 'bg-destructive/10',
    };
  }, [dre, config.transactions, mesAtual, anoAtual, historico6m]);

  // painel de impostos 
  const impostos = useMemo(() => {
    const receitaAnual = config.transactions
      .filter(t => t.type === 'entrada' && !t.isPersonal && new Date(t.date).getFullYear() === anoAtual)
      .reduce((s, t) => s + t.value, 0);

    const pctLimite = (receitaAnual / LIMITE_MEI_ANUAL) * 100;
    const mesesDecorridos = mesAtual + 1;
    const ritmaMensal = mesesDecorridos > 0 ? receitaAnual / mesesDecorridos : 0;
    const projecaoAnual = ritmaMensal * 12;

    //mês previsto de estouro do limite
    let mesEstouro: string | null = null;
    if (projecaoAnual > LIMITE_MEI_ANUAL && ritmaMensal > 0) {
      const mesesRestantes = Math.ceil((LIMITE_MEI_ANUAL - receitaAnual) / ritmaMensal);
      const mesIndex = (mesAtual + mesesRestantes) % 12;
      mesEstouro = MESES[mesIndex];
    }

    //ponto de equilíbrio mensal
    const custoFixoMensal = dre.despesaOp + dre.prolabore + DAS_MEI_MENSAL;
    const margemContrib = dre.receita > 0 ? (dre.lucroBruto / dre.receita) : 0;
    const pontoEquilibrio = margemContrib > 0 ? custoFixoMensal / margemContrib : 0;

    // DAS mensal (CNPJ MEI ativo)
    const dasTotal = (mesAtual + 1) * DAS_MEI_MENSAL;

    return { receitaAnual, pctLimite, projecaoAnual, mesEstouro, pontoEquilibrio, custoFixoMensal, dasTotal };
  }, [config.transactions, mesAtual, anoAtual, dre]);

  // exportar relatório contábil 
  const exportarContabil = () => {
    const doc = new jsPDF();
    const mesLabel = `${MESES[mesAtual]}/${anoAtual}`;

    doc.setFontSize(16);
    doc.text(`Relatório Contábil — ${mesLabel}`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${config.storeName} · Gerado em ${new Date().toLocaleDateString('pt-BR')} · Score de saúde: ${score.total}/100`, 14, 25);

    // DRE
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Demonstrativo de Resultado (DRE)', 14, 36);

    autoTable(doc, {
      startY: 40,
      head: [['Linha', 'Valor', '% Receita']],
      body: [
        ['(+) Receita operacional', fmt(dre.receita), '100%'],
        ['(−) Custo das mercadorias (CMV)', fmt(dre.cmv), pct(dre.receita > 0 ? (dre.cmv/dre.receita)*100 : 0)],
        ['= Lucro bruto', fmt(dre.lucroBruto), pct(dre.margemBruta)],
        ['(−) Despesas operacionais', fmt(dre.despesaOp), pct(dre.receita > 0 ? (dre.despesaOp/dre.receita)*100 : 0)],
        ['(−) Pró-labore / retiradas pessoais', fmt(dre.prolabore), pct(dre.receita > 0 ? (dre.prolabore/dre.receita)*100 : 0)],
        ['(−) DAS MEI (estimado)', fmt(DAS_MEI_MENSAL), '—'],
        ['= Resultado líquido', fmt(dre.lucroLiquido), pct(dre.margemLiq)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      bodyStyles: { textColor: 0 },
      didParseCell: (data) => {
        if (data.row.index === 2 || data.row.index === 6) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const y1 = (doc as any).lastAutoTable.finalY + 10;

    // Impostos
    doc.setFontSize(12);
    doc.text('Situação Fiscal', 14, y1);

    autoTable(doc, {
      startY: y1 + 4,
      head: [['Item', 'Valor']],
      body: [
        ['Receita bruta acumulada no ano', fmt(impostos.receitaAnual)],
        [`Limite MEI utilizado (${pct(impostos.pctLimite)})`, fmt(LIMITE_MEI_ANUAL)],
        ['Projeção receita anual (ritmo atual)', fmt(impostos.projecaoAnual)],
        ['DAS MEI acumulado no ano (estimado)', fmt(impostos.dasTotal)],
        ['Ponto de equilíbrio mensal', fmt(impostos.pontoEquilibrio)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 116, 139] },
    });

    const y2 = (doc as any).lastAutoTable.finalY + 10;

    // Score
    doc.setFontSize(12);
    doc.text(`Score de Saúde Financeira: ${score.total}/100 (${score.nivel})`, 14, y2);

    autoTable(doc, {
      startY: y2 + 4,
      head: [['Componente', 'Pontos', 'Máx', 'Detalhe']],
      body: score.componentes.map(c => [c.label, c.valor, c.max, c.detalhe]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 116, 139] },
    });

    const y3 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Este relatório é auxiliar. A declaração fiscal oficial deve ser feita em gov.br/mei.', 14, y3);

    doc.save(`Contador_${mesLabel.replace('/', '_')}_${config.storeName.replace(/\s+/g, '_')}.pdf`);
    toast.success('Relatório contábil exportado');
  };

  const maxHistorico = Math.max(...historico6m.map(m => m.receita), 1);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Modo Contador</h1>
          <p className="text-muted-foreground mt-1">
            Visão contábil por competência · {MESES[mesAtual]}/{anoAtual}
          </p>
        </div>
        <button
          onClick={exportarContabil}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium shadow-glow"
        >
          <Download className="w-4 h-4" /> Exportar para contador
        </button>
      </div>

      <Card className="p-4 border-none shadow-md border-l-4 border-l-primary bg-primary/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">
            Os dados são lidos automaticamente do seu <strong>Caixa</strong>.
            Nenhum lançamento duplicado a DRE reflete exatamente o que você já registrou,
            reorganizado por linha contábil.
          </p>
        </div>
      </Card>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-none shadow-md">
          <p className="text-xs text-muted-foreground">Receita</p>
          <p className="text-xl font-bold font-heading text-secondary mt-1">{fmt(dre.receita)}</p>
        </Card>
        <Card className="p-4 border-none shadow-md">
          <p className="text-xs text-muted-foreground">Lucro bruto</p>
          <p className="text-xl font-bold font-heading text-primary mt-1">{fmt(dre.lucroBruto)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Margem {pct(dre.margemBruta)}</p>
        </Card>
        <Card className="p-4 border-none shadow-md">
          <p className="text-xs text-muted-foreground">Resultado líquido</p>
          <p className={`text-xl font-bold font-heading mt-1 ${dre.lucroLiquido >= 0 ? 'text-secondary' : 'text-destructive'}`}>
            {fmt(dre.lucroLiquido)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Margem {pct(dre.margemLiq)}</p>
        </Card>
        <Card className={`p-4 border-none shadow-md ${score.bgCor}`}>
          <p className="text-xs text-muted-foreground">Score de saúde</p>
          <p className={`text-xl font-bold font-heading mt-1 ${score.cor}`}>{score.total}<span className="text-sm font-normal">/100</span></p>
          <p className={`text-xs font-medium mt-0.5 ${score.cor}`}>{score.nivel}</p>
        </Card>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {([
          { value: 'dre', label: 'DRE', icon: FileSpreadsheet },
          { value: 'score', label: 'Saúde', icon: Activity },
          { value: 'impostos', label: 'Impostos', icon: Calculator },
        ] as { value: Aba; label: string; icon: React.ElementType }[]).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setAba(value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              aba === value ? 'gradient-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── ABA: DRE ─────────────────────────────────────────────────────────── */}
      {aba === 'dre' && (
        <div className="space-y-6">

          <Card className="p-6 border-none shadow-md">
            <h2 className="text-lg font-semibold font-heading mb-5 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              DRE — {MESES[mesAtual]}/{anoAtual}
            </h2>

            <div className="space-y-0">
              {/* Receita */}
              <DRERow
                label="(+) Receita operacional"
                valor={dre.receita}
                pctReceita={100}
                cor="text-secondary"
                destaque
              />
              <DRERow
                label="(−) Custo das mercadorias (CMV)"
                valor={dre.cmv}
                pctReceita={dre.receita > 0 ? (dre.cmv / dre.receita) * 100 : 0}
                cor="text-destructive"
                sub="Categoria Reposição"
              />

              {/* Lucro bruto */}
              <DRERow
                label="= Lucro bruto"
                valor={dre.lucroBruto}
                pctReceita={dre.margemBruta}
                cor={dre.lucroBruto >= 0 ? 'text-primary' : 'text-destructive'}
                destaque
                separador
              />

              <DRERow
                label="(−) Despesas operacionais"
                valor={dre.despesaOp}
                pctReceita={dre.receita > 0 ? (dre.despesaOp / dre.receita) * 100 : 0}
                cor="text-destructive"
                sub="Embalagem, Frete, Outros"
              />
              <DRERow
                label="(−) Pró-labore / retiradas pessoais"
                valor={dre.prolabore}
                pctReceita={dre.receita > 0 ? (dre.prolabore / dre.receita) * 100 : 0}
                cor="text-warning"
                sub="Categoria Pessoal"
              />
              <DRERow
                label="(−) DAS MEI (estimado)"
                valor={DAS_MEI_MENSAL}
                pctReceita={dre.receita > 0 ? (DAS_MEI_MENSAL / dre.receita) * 100 : 0}
                cor="text-muted-foreground"
                sub="Valor fixo 2026"
              />

              {/* Resultado */}
              <DRERow
                label="= Resultado líquido"
                valor={dre.lucroLiquido}
                pctReceita={dre.margemLiq}
                cor={dre.lucroLiquido >= 0 ? 'text-secondary' : 'text-destructive'}
                destaque
                separador
              />
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              💡 CMV = Reposição de estoque. Despesas operacionais = Embalagem, Frete, Outros. Pró-labore = lançamentos marcados como Pessoal.
              O DAS MEI é estimado pelo valor fixo, confirme no gov.br/mei.
            </p>
          </Card>

          <Card className="p-6 border-none shadow-md">
            <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Tendência de receita — 6 meses
            </h2>
            <div className="space-y-3">
              {historico6m.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8 shrink-0">{m.mes}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-secondary transition-all"
                      style={{ width: `${(m.receita / maxHistorico) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-24 text-right shrink-0">{fmt(m.receita)}</span>
                  <span className={`text-xs w-20 text-right shrink-0 ${m.saldo >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {m.saldo >= 0 ? '+' : ''}{fmt(m.saldo)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Barra = receita · Valor à direita = resultado (receita − despesas) do mês
            </p>
          </Card>
        </div>
      )}

      {aba === 'score' && (
        <div className="space-y-6">

          <Card className={`p-6 border-none shadow-md ${score.bgCor}`}>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" strokeWidth="10" fill="none" className="text-muted" stroke="currentColor" />
                  <circle
                    cx="50" cy="50" r="42" strokeWidth="10" fill="none"
                    stroke={score.total >= 75 ? 'hsl(142,76%,36%)' : score.total >= 50 ? 'hsl(38,92%,50%)' : 'hsl(0,84%,60%)'}
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - score.total / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold font-heading ${score.cor}`}>{score.total}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
              <div>
                <p className={`text-xl font-bold font-heading ${score.cor}`}>{score.nivel}</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {score.total >= 75
                    ? 'Seu negócio está financeiramente equilibrado. Continue monitorando.'
                    : score.total >= 50
                    ? 'Há pontos de atenção. Veja os componentes abaixo para melhorar.'
                    : 'Situação crítica. Revise margens, retiradas e consistência de receita.'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-md">
            <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Composição do score
            </h2>
            <div className="space-y-5">
              {score.componentes.map((c, i) => {
                const pctComp = (c.valor / c.max) * 100;
                const corBarra = pctComp >= 80 ? 'bg-secondary' : pctComp >= 50 ? 'bg-warning' : 'bg-destructive';
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{c.label}</span>
                      <span className="text-muted-foreground">
                        <span className="font-bold text-foreground">{c.valor}</span>/{c.max} pts · {c.detalhe}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${corBarra} transition-all`} style={{ width: `${pctComp}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 border-none shadow-md">
            <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Como melhorar seu score
            </h2>
            <div className="space-y-3">
              {score.componentes.filter(c => c.valor < c.max).map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">{c.label}</p>
                    <p className="text-muted-foreground mt-0.5">{dica(c.label)}</p>
                  </div>
                </div>
              ))}
              {score.componentes.every(c => c.valor === c.max) && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <p className="text-sm text-secondary font-medium">Todos os indicadores estão no máximo. Excelente gestão!</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {aba === 'impostos' && (
        <div className="space-y-6">

          {/* Limite MEI */}
          <Card className="p-6 border-none shadow-md">
            <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" /> Limite MEI — {anoAtual}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Receita acumulada</span>
                <span className="font-bold">{fmt(impostos.receitaAnual)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Limite anual</span>
                <span>{fmt(LIMITE_MEI_ANUAL)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    impostos.pctLimite >= 90 ? 'bg-destructive' : impostos.pctLimite >= 70 ? 'bg-warning' : 'bg-secondary'
                  }`}
                  style={{ width: `${Math.min(impostos.pctLimite, 100)}%` }}
                />
              </div>
              <p className="text-sm font-medium">
                {impostos.pctLimite.toFixed(1)}% utilizado
                {impostos.mesEstouro && (
                  <span className="text-destructive ml-2">· Previsão de estouro: {impostos.mesEstouro}/{anoAtual}</span>
                )}
              </p>

              {impostos.pctLimite >= 70 && (
                <Card className="p-4 border-none bg-warning/10 border-l-4 border-l-warning">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-warning">Atenção ao limite</p>
                      <p className="text-muted-foreground mt-1">
                        No ritmo atual, sua receita projetada é de <strong>{fmt(impostos.projecaoAnual)}</strong> este ano.
                        {impostos.projecaoAnual > LIMITE_MEI_ANUAL * 1.2
                          ? ' Avalie migrar para ME ou ME-EPP com seu contador.'
                          : ' Monitore mensalmente para evitar obrigações adicionais.'}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Card>

          {/* DAS e Ponto de equilíbrio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 border-none shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-warning" />
                <h3 className="font-semibold font-heading">DAS MEI</h3>
              </div>
              <p className="text-2xl font-bold font-heading text-warning">{fmt(DAS_MEI_MENSAL)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              <p className="text-sm text-muted-foreground mt-1">Acumulado {anoAtual}: <strong>{fmt(impostos.dasTotal)}</strong></p>
              <p className="text-xs text-muted-foreground mt-3">
                Valor fixo 2026. Vence todo dia 20 do mês seguinte. Pague em{' '}
                <a href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" target="_blank" rel="noopener noreferrer" className="underline text-primary">gov.br/mei</a>.
              </p>
            </Card>

            <Card className="p-5 border-none shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-semibold font-heading">Ponto de equilíbrio</h3>
              </div>
              <p className="text-2xl font-bold font-heading text-primary">{fmt(impostos.pontoEquilibrio)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              <p className="text-sm text-muted-foreground mt-1">
                Receita mínima para cobrir todos os custos fixos
              </p>
              {dre.receita > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Receita atual</span>
                    <span>{dre.receita >= impostos.pontoEquilibrio ? '✅ Acima' : '⚠️ Abaixo'}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dre.receita >= impostos.pontoEquilibrio ? 'bg-secondary' : 'bg-destructive'}`}
                      style={{ width: `${Math.min((dre.receita / Math.max(impostos.pontoEquilibrio, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Custos fixos: {fmt(impostos.custoFixoMensal)} (desp. op. + pró-labore + DAS)
              </p>
            </Card>
          </div>

          <Card className="p-5 border-none shadow-md bg-muted/50">
            <h3 className="font-semibold font-heading text-sm mb-2">📋 Checklist fiscal mensal</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Pagar o DAS MEI até dia 20 do mês seguinte em gov.br/mei</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Guardar notas fiscais e comprovantes de compra</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Entregar a DASN-SIMEI anual até 31 de maio do ano seguinte</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> Monitorar o limite anual mensalmente nesta tela</li>
            </ul>
          </Card>
        </div>
      )}

    </div>
  );
};

interface DRERowProps {
  label: string;
  valor: number;
  pctReceita: number;
  cor: string;
  destaque?: boolean;
  separador?: boolean;
  sub?: string;
}

const DRERow = ({ label, valor, pctReceita, cor, destaque, separador, sub }: DRERowProps) => (
  <>
    {separador && <div className="border-t border-border my-1" />}
    <div className={`flex items-center justify-between py-3 ${separador ? 'pt-4' : ''} ${destaque ? 'border-b border-border' : 'border-b border-border/40'}`}>
      <div>
        <p className={`text-sm ${destaque ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold font-heading ${cor}`}>{fmt(valor)}</p>
        <p className="text-xs text-muted-foreground">{pct(pctReceita)} receita</p>
      </div>
    </div>
  </>
);

function dica(label: string): string {
  switch (label) {
    case 'Margem bruta':
      return 'Revise o preço de venda com a Calculadora de Preço. Margens abaixo de 40% não cobrem despesas operacionais.';
    case 'Retiradas pessoais':
      return 'Tente manter retiradas pessoais abaixo de 25% das entradas. Marque todos os gastos pessoais como "Pessoal" no Caixa.';
    case 'Consistência de receita':
      return 'Receita irregular aumenta risco de fluxo de caixa negativo. Use a Vitrine e Posts IA para manter vendas constantes.';
    case 'Resultado líquido':
      return 'Resultado negativo indica que despesas superam receitas. Revise a DRE para identificar onde cortar.';
    case 'Limite MEI':
      return 'Você está próximo do limite anual. Considere conversar com um contador sobre migrar para ME.';
    default:
      return 'Monitore este indicador mensalmente para manter a saúde financeira do negócio.';
  }
}

export default Contador;