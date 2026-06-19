import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Download, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { formatCNPJ } from '@/lib/cnpj';
import { callFunction, FUNCTIONS } from '@/integrations/firebase/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const LIMITE_MEI_ANUAL = 81000;

const COMERCIO_INDUSTRIA = new Set([
  'vendas', 'venda', 'produtos', 'produto', 'mercadoria', 'comércio', 'comercio',
  'revenda', 'fabricação', 'fabricacao', 'indústria', 'industria',
]);
const SERVICOS = new Set([
  'serviço', 'servico', 'serviços', 'servicos', 'consultoria', 'manutenção',
  'manutencao', 'aula', 'aulas', 'frete', 'entrega',
]);

const classify = (cat: string): 'comercio' | 'servicos' | 'desconhecido' => {
  const c = (cat || '').toLowerCase().trim();
  if (COMERCIO_INDUSTRIA.has(c)) return 'comercio';
  if (SERVICOS.has(c)) return 'servicos';
  return 'desconhecido';
};

const MEI = () => {
  const { config, updateConfig } = useStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [cnpjInput, setCnpjInput] = useState('');
  const [checkingCnpj, setCheckingCnpj] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);

  const report = useMemo(() => {
    const start = new Date(`${year}-01-01T00:00:00`);
    const end = new Date(`${year + 1}-01-01T00:00:00`);

    const entradas = config.transactions.filter(t => {
      if (t.type !== 'entrada' || t.isPersonal) return false;
      const d = new Date(t.date);
      return d >= start && d < end;
    });

    const months = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      total: 0,
      comercio: 0,
      servicos: 0,
      desconhecido: 0,
      qtd: 0,
    }));

    let totalAno = 0;
    let totalComercio = 0;
    let totalServicos = 0;
    let totalDesconhecido = 0;

    for (const t of entradas) {
      const m = new Date(t.date).getMonth();
      const tipo = classify(t.category);
      const v = Number(t.value) || 0;
      months[m].total += v;
      months[m][tipo] += v;
      months[m].qtd += 1;
      totalAno += v;
      if (tipo === 'comercio') totalComercio += v;
      else if (tipo === 'servicos') totalServicos += v;
      else totalDesconhecido += v;
    }

    const mesesSemReceita = months.filter(m => m.qtd === 0 && m.mes <= new Date().getMonth() + 1 && year === new Date().getFullYear()).map(m => m.mes);
    const acimaLimite = totalAno > LIMITE_MEI_ANUAL;
    const percentLimite = (totalAno / LIMITE_MEI_ANUAL) * 100;

    return {
      months, totalAno, totalComercio, totalServicos, totalDesconhecido,
      mesesSemReceita, acimaLimite, percentLimite, qtdTransacoes: entradas.length,
    };
  }, [config.transactions, year]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const handleActivarMei = async () => {
    setCnpjError(null);
    if (!cnpjInput.trim()) { setCnpjError('Informe o CNPJ.'); return; }
    setCheckingCnpj(true);
    try {
      await callFunction(FUNCTIONS.activateMei, { cnpj: cnpjInput });
      await updateConfig({ isMei: true, cnpj: cnpjInput });
      toast.success('MEI ativado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível validar o CNPJ.';
      setCnpjError(msg);
    } finally {
      setCheckingCnpj(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Relatório Anual MEI — ${year}`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${config.storeName} • Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(`Receita Bruta Total: ${fmt(report.totalAno)}`, 14, 36);
    doc.text(`Comércio/Indústria: ${fmt(report.totalComercio)}`, 14, 43);
    doc.text(`Serviços: ${fmt(report.totalServicos)}`, 14, 50);
    if (report.totalDesconhecido > 0) {
      doc.setTextColor(180, 100, 0);
      doc.text(`Não classificadas: ${fmt(report.totalDesconhecido)} (revisar)`, 14, 57);
      doc.setTextColor(0);
    }
    autoTable(doc, {
      startY: 65,
      head: [['Mês', 'Comércio/Indústria', 'Serviços', 'Não classif.', 'Total Mês']],
      body: report.months.map((m, i) => [meses[i], fmt(m.comercio), fmt(m.servicos), fmt(m.desconhecido), fmt(m.total)]),
      foot: [['Total', fmt(report.totalComercio), fmt(report.totalServicos), fmt(report.totalDesconhecido), fmt(report.totalAno)]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Este relatório consolida os seus dados registrados no Biztrivo.', 14, finalY);
    doc.text('A DASN-SIMEI oficial deve ser feita em gov.br/mei até 31/maio do ano seguinte.', 14, finalY + 5);
    doc.save(`MEI_${year}_${config.storeName.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF gerado');
  };

  if (!config.isMei) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-heading">Declaração MEI</h1>
          <p className="text-muted-foreground mt-1">Consolidação anual da sua receita bruta para a DASN-SIMEI.</p>
        </div>
        <Card className="p-10 border-none shadow-md flex flex-col items-center text-center gap-5">
          <FileText className="w-14 h-14 text-muted-foreground/30" />
          <div>
            <p className="text-lg font-semibold font-heading">Esta área é para MEI</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Informe seu CNPJ para validarmos a situação cadastral na Receita Federal antes de liberar esta área.
            </p>
          </div>
          <div className="w-full max-w-xs space-y-2">
            <input
              type="text"
              value={cnpjInput}
              onChange={e => setCnpjInput(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-center"
            />
            {cnpjError && <p className="text-xs text-destructive">{cnpjError}</p>}
          </div>
          <button
            onClick={handleActivarMei}
            disabled={checkingCnpj}
            className="px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {checkingCnpj ? 'Verificando CNPJ...' : 'Sim, sou MEI — Ativar'}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Declaração MEI</h1>
          <p className="text-muted-foreground mt-1">Consolidação anual da sua receita bruta para a DASN-SIMEI.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Ano:</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="h-9 px-3 rounded-md border border-input bg-background text-sm">
            {[year + 0, year - 1, year - 2].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium shadow-glow">
            <Download className="w-4 h-4" /> Baixar PDF
          </button>
        </div>
      </div>

      <Card className="p-4 border-none shadow-md border-l-4 border-l-primary bg-primary/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">
            Este relatório é uma <strong>consolidação dos seus dados</strong> no Biztrivo. A declaração oficial deve ser entregue em
            {' '}<a href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" target="_blank" rel="noopener noreferrer" className="underline text-primary">gov.br/mei</a>{' '}
            até 31/maio do ano seguinte. Limite MEI: {fmt(LIMITE_MEI_ANUAL)}/ano.
          </p>
        </div>
      </Card>

      {report.acimaLimite && (
        <Card className="p-4 border-none shadow-md border-l-4 border-l-destructive bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-destructive">Você ultrapassou o limite anual do MEI ({report.percentLimite.toFixed(0)}%).</p>
              <p className="text-muted-foreground mt-1">Se passou em até 20% (até R$ 97.200), você pode continuar como MEI mas pagará DAS adicional. Acima disso é obrigatório migrar para ME.</p>
            </div>
          </div>
        </Card>
      )}

      {report.totalDesconhecido > 0 && (
        <Card className="p-4 border-none shadow-md border-l-4 border-l-warning bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong>{fmt(report.totalDesconhecido)}</strong> em entradas com categoria não classificada. Revise na aba Caixa e use categorias como "Vendas", "Serviço", "Mercadoria" para classificar corretamente.
            </p>
          </div>
        </Card>
      )}

      {report.mesesSemReceita.length > 0 && (
        <Card className="p-4 border-none shadow-md border-l-4 border-l-warning bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm">
              Sem nenhum registro nos meses: <strong>{report.mesesSemReceita.map(m => meses[m-1]).join(', ')}</strong>. Verifique se faltam lançamentos.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-none shadow-md">
          <p className="text-sm text-muted-foreground">Receita Bruta {year}</p>
          <p className="text-2xl font-bold font-heading mt-1">{fmt(report.totalAno)}</p>
          <p className="text-xs text-muted-foreground mt-1">{report.qtdTransacoes} lançamento(s)</p>
        </Card>
        <Card className="p-5 border-none shadow-md">
          <p className="text-sm text-muted-foreground">Comércio / Indústria</p>
          <p className="text-2xl font-bold font-heading mt-1 text-secondary">{fmt(report.totalComercio)}</p>
        </Card>
        <Card className="p-5 border-none shadow-md">
          <p className="text-sm text-muted-foreground">Serviços</p>
          <p className="text-2xl font-bold font-heading mt-1 text-primary">{fmt(report.totalServicos)}</p>
        </Card>
      </div>

      <Card className="p-6 border-none shadow-md">
        <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Detalhamento mensal
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Mês</th>
                <th className="py-2 px-2 text-right">Comércio</th>
                <th className="py-2 px-2 text-right">Serviços</th>
                <th className="py-2 px-2 text-right">Não classif.</th>
                <th className="py-2 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {report.months.map((m, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">{meses[i]}</td>
                  <td className="py-2 px-2 text-right">{fmt(m.comercio)}</td>
                  <td className="py-2 px-2 text-right">{fmt(m.servicos)}</td>
                  <td className={`py-2 px-2 text-right ${m.desconhecido > 0 ? 'text-warning' : ''}`}>{fmt(m.desconhecido)}</td>
                  <td className="py-2 px-2 text-right font-semibold">{fmt(m.total)}</td>
                </tr>
              ))}
              <tr className="font-bold bg-muted/30">
                <td className="py-2 px-2">Total</td>
                <td className="py-2 px-2 text-right">{fmt(report.totalComercio)}</td>
                <td className="py-2 px-2 text-right">{fmt(report.totalServicos)}</td>
                <td className="py-2 px-2 text-right">{fmt(report.totalDesconhecido)}</td>
                <td className="py-2 px-2 text-right">{fmt(report.totalAno)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6 border-none shadow-md border-l-4 border-l-secondary bg-secondary/5">
        <h2 className="text-lg font-semibold font-heading mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-secondary" /> Campos prontos para o portal gov.br
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-background">
            <p className="text-xs text-muted-foreground">Receita com comércio, indústria e transporte</p>
            <p className="text-lg font-bold font-heading">{fmt(report.totalComercio)}</p>
            <p className="text-[10px] text-muted-foreground">(apenas categorias classificadas)</p>
          </div>
          <div className="p-3 rounded-lg bg-background">
            <p className="text-xs text-muted-foreground">Receita com serviços</p>
            <p className="text-lg font-bold font-heading">{fmt(report.totalServicos)}</p>
          </div>
          <div className="p-3 rounded-lg bg-background sm:col-span-2">
            <p className="text-xs text-muted-foreground">Receita Bruta Total</p>
            <p className="text-xl font-bold font-heading text-primary">{fmt(report.totalAno)}</p>
          </div>
        </div>
      </Card>

      <button
        onClick={() => updateConfig({ isMei: false, cnpj: '' })}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors mx-auto block"
      >
        Não sou mais MEI — desativar esta área
      </button>
    </div>
  );
};

export default MEI;
