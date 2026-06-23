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

//BRASIL
const BR_LIMITE_MEI_ANUAL = 81_000;
const BR_DAS_MEI_MENSAL = 76.9; // fixo 2026

//ESPANHA
const ES_CUOTA_SS_MINIMA = 230;   // €/mês — tramo mínimo 2024
const ES_CUOTA_SS_MAXIMA = 542;   // €/mês — tramo máximo 2024
const ES_IRPF_FRACIONADO = 0.20;  // 20% sobre rend. líquido — Modelo 130

//FRANÇA
const FR_LIMITE_CA_COMERCIO  = 188_700; // € — comércio
const FR_LIMITE_CA_SERVICOS  = 77_700;  // € — serviços BIC/BNC
const FR_LIMITE_TVA_COMERCIO = 91_900;  // € — franquia TVA comércio
const FR_LIMITE_TVA_SERVICOS = 36_800;  // € — franquia TVA serviços
const FR_COTISATIONS_COMERCIO = 0.123;  // 12.3%
const FR_COTISATIONS_SERVICOS = 0.212;  // 21.2%
const FR_COTISATIONS_LIBERAL  = 0.211;  // 21.1%
const FR_CFE_ANUAL = 200;               // € — estimativa mínima CFE

//EUA
const US_SE_TAX_RATE = 0.153;             // 15.3%
const US_SE_TAX_FACTOR = 0.9235;         // base de cálculo (92.35%)
const US_SE_DEDUCTIBLE_HALF = 0.5;
const US_STANDARD_DEDUCTION = 14_600;    // $ — single filer 2024
const US_FED_BRACKETS = [
  { max: 11_600,   rate: 0.10 },
  { max: 47_150,   rate: 0.12 },
  { max: 100_525,  rate: 0.22 },
  { max: 191_950,  rate: 0.24 },
  { max: 243_725,  rate: 0.32 },
  { max: 609_350,  rate: 0.35 },
  { max: Infinity, rate: 0.37 },
];
const US_QUARTERLY = [
  { label: 'Q1 (Jan–Mar)', due: 'Apr 15', months: [0, 1, 2] },
  { label: 'Q2 (Apr–May)', due: 'Jun 16', months: [3, 4] },
  { label: 'Q3 (Jun–Aug)', due: 'Sep 15', months: [5, 6, 7] },
  { label: 'Q4 (Sep–Dec)', due: 'Jan 15', months: [8, 9, 10, 11] },
];

//GERAL
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

type Pais = 'BR' | 'ES' | 'FR' | 'US';
type Aba  = 'dre' | 'score' | 'impostos';
type FrAtividade = 'comercio' | 'servicos' | 'liberal';

const pct = (v: number) => `${v.toFixed(1)}%`;

function fmtMoeda(v: number, pais: Pais): string {
  const locales:    Record<Pais, string> = { BR: 'pt-BR', ES: 'es-ES', FR: 'fr-FR', US: 'en-US' };
  const currencies: Record<Pais, string> = { BR: 'BRL',   ES: 'EUR',   FR: 'EUR',   US: 'USD'   };
  return v.toLocaleString(locales[pais], { style: 'currency', currency: currencies[pais], maximumFractionDigits: 2 });
}

function lsGet(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

//IMPOSTOS EUA (helpers)
function calcFedTaxAnual(netAnual: number): number {
  const seTaxAnual      = netAnual * US_SE_TAX_FACTOR * US_SE_TAX_RATE;
  const deducaoSE       = seTaxAnual * US_SE_DEDUCTIBLE_HALF;
  const tributavel      = Math.max(0, netAnual - deducaoSE - US_STANDARD_DEDUCTION);
  let fedTax = 0;
  let prev   = 0;
  for (const b of US_FED_BRACKETS) {
    const slice = Math.min(Math.max(0, tributavel - prev), b.max - prev);
    fedTax += slice * b.rate;
    prev    = b.max;
    if (prev >= tributavel) break;
  }
  return fedTax;
}

//DICAS 
function dica(label: string, pais: Pais): string {
  const map: Record<string, Record<Pais, string>> = {
    'score_margem': {
      BR: 'Revise o preço de venda com a Calculadora de Preço. Margens abaixo de 40% não cobrem despesas operacionais.',
      ES: 'Revisa el precio de venta. Márgenes por debajo del 40% no cubren los gastos operativos ni las cuotas.',
      FR: 'Revoyez votre tarification. Une marge en dessous de 40% ne couvre pas les charges fixes et les cotisations.',
      US: 'Review your pricing. Margins below 40% don\'t cover operating expenses and self-employment taxes.',
    },
    'score_pessoal': {
      BR: 'Tente manter retiradas pessoais abaixo de 25% das entradas. Marque todos os gastos pessoais como "Pessoal" no Caixa.',
      ES: 'Mantén el retiro personal por debajo del 25% de los ingresos. Registra todos los gastos personales correctamente.',
      FR: 'Maintenez les prélèvements personnels sous 25% du CA. Séparez bien dépenses professionnelles et personnelles.',
      US: 'Keep owner\'s draws below 25% of revenue. Track all personal expenses separately for tax purposes.',
    },
    'score_consistencia': {
      BR: 'Receita irregular aumenta risco de fluxo de caixa negativo. Use a Vitrine e Posts IA para manter vendas constantes.',
      ES: 'Usa las redes sociales y el escaparate digital para mantener ventas constantes mes a mes.',
      FR: 'Un CA irrégulier augmente le risque de trésorerie négative. Utilisez la vitrine et les outils marketing.',
      US: 'Irregular income increases cash flow risk. Use the storefront and marketing tools to maintain steady sales.',
    },
    'score_saldo': {
      BR: 'Resultado negativo indica que despesas superam receitas. Revise a DRE para identificar onde cortar.',
      ES: 'Resultado negativo: los gastos superan los ingresos. Revisa la cuenta de resultados para identificar dónde recortar.',
      FR: 'Résultat négatif: les charges dépassent le CA. Analysez le compte de résultat pour réduire les postes.',
      US: 'Negative net income: expenses exceed revenue. Review your P&L to identify where to cut costs.',
    },
    'score_limite': {
      BR: 'Você está próximo do limite anual. Considere conversar com um contador sobre migrar para ME.',
      ES: 'Alta carga fiscal. Revisa si puedes deducir más gastos como autónomo o cambiar de epígrafe IAE.',
      FR: 'Vous approchez du plafond. Renseignez-vous sur le passage au régime réel auprès d\'un expert-comptable.',
      US: 'Consider maximizing deductible expenses (home office, equipment, health insurance) on Schedule C.',
    },
  };
  return map[label]?.[pais] ?? 'Monitore este indicador mensalmente para manter a saúde financeira.';
}

//TEXTOS I18N 
const I18N: Record<Pais, {
  titulo: string; subtitulo: (m: string, a: number) => string; exportar: string;
  infoBanner: string; k1: string; k2: string; k3: string;
  tabs: [string, string, string]; dreTitle: (m: string, a: number) => string;
  trendTitle: string; dreNote: string;
  scoreNivel: [string, string, string]; scoreMsg: [string, string, string];
  dreRows: {
    receita: string; cmv: string; cmvSub: string; lucroBruto: string;
    despesaOp: string; despesaOpSub: string; prolabore: string; prolaoreSub: string;
    resultado: string;
  };
  rodapePDF: string;
}> = {
  BR: {
    titulo: 'Modo Contador',
    subtitulo: (m, a) => `Visão contábil por competência · ${m}/${a}`,
    exportar: 'Exportar para contador',
    infoBanner: 'Os dados são lidos automaticamente do seu Caixa. Nenhum lançamento duplicado, a DRE reflete exatamente o que você já registrou, reorganizado por linha contábil.',
    k1: 'Receita', k2: 'Lucro bruto', k3: 'Resultado líquido',
    tabs: ['DRE', 'Saúde', 'Impostos'],
    dreTitle: (m, a) => `DRE — ${m}/${a}`,
    trendTitle: 'Tendência de receita — 6 meses',
    dreNote: '💡 CMV = Reposição de estoque. Despesas operacionais = Embalagem, Frete, Outros. Pró-labore = lançamentos marcados como Pessoal. O DAS MEI é estimado pelo valor fixo, confirme no gov.br/mei.',
    scoreNivel: ['Saudável', 'Atenção', 'Crítico'],
    scoreMsg: [
      'Seu negócio está financeiramente equilibrado. Continue monitorando.',
      'Há pontos de atenção. Veja os componentes abaixo para melhorar.',
      'Situação crítica. Revise margens, retiradas e consistência de receita.',
    ],
    dreRows: {
      receita: '(+) Receita operacional', cmv: '(−) Custo das mercadorias (CMV)', cmvSub: 'Categoria Reposição',
      lucroBruto: '= Lucro bruto', despesaOp: '(−) Despesas operacionais', despesaOpSub: 'Embalagem, Frete, Outros',
      prolabore: '(−) Pró-labore / retiradas pessoais', prolaoreSub: 'Categoria Pessoal', resultado: '= Resultado líquido',
    },
    rodapePDF: 'Este relatório é auxiliar. A declaração fiscal oficial deve ser feita em gov.br/mei.',
  },
  ES: {
    titulo: 'Modo Contador',
    subtitulo: (m, a) => `Visión contable mensual · ${m}/${a}`,
    exportar: 'Exportar para el gestor',
    infoBanner: 'Los datos se leen automáticamente de tu Caja. La cuenta de resultados refleja exactamente lo que ya registraste, reorganizado por línea contable.',
    k1: 'Ingresos', k2: 'Beneficio bruto', k3: 'Resultado neto',
    tabs: ['Cuenta de Resultados', 'Salud', 'Impuestos'],
    dreTitle: (m, a) => `Cuenta de Resultados — ${m}/${a}`,
    trendTitle: 'Tendencia de ingresos — 6 meses',
    dreNote: '💡 Coste de ventas = categoría Reposición. Gastos operativos = Embalaje, Flete, Otros. La cuota SS y el IRPF son estimaciones — consulta a tu gestor para tu tramo exacto.',
    scoreNivel: ['Saludable', 'Atención', 'Crítico'],
    scoreMsg: [
      'Tu negocio está financieramente equilibrado. Sigue monitorizando.',
      'Hay puntos de atención. Revisa los componentes para mejorar.',
      'Situación crítica. Revisa márgenes, retiros y consistencia de ingresos.',
    ],
    dreRows: {
      receita: '(+) Ingresos operacionales', cmv: '(−) Coste de ventas (CMV)', cmvSub: 'Categoría Reposición',
      lucroBruto: '= Beneficio bruto', despesaOp: '(−) Gastos operativos', despesaOpSub: 'Embalaje, Flete, Otros',
      prolabore: '(−) Retiro personal', prolaoreSub: 'Categoría Personal', resultado: '= Resultado neto',
    },
    rodapePDF: 'Informe auxiliar. Consulta a tu gestor/asesor fiscal para la declaración oficial.',
  },
  FR: {
    titulo: 'Mode Comptable',
    subtitulo: (m, a) => `Vue comptable mensuelle · ${m}/${a}`,
    exportar: 'Exporter pour le comptable',
    infoBanner: 'Les données sont lues automatiquement de votre Caisse. Le compte de résultat reflète exactement ce que vous avez déjà enregistré, réorganisé par ligne comptable.',
    k1: 'Chiffre d\'affaires', k2: 'Résultat brut', k3: 'Résultat net',
    tabs: ['Compte de résultat', 'Santé', 'Impôts'],
    dreTitle: (m, a) => `Compte de résultat — ${m}/${a}`,
    trendTitle: 'Tendance du chiffre d\'affaires — 6 mois',
    dreNote: '💡 Coût des marchandises = catégorie Réapprovisionnement. Les cotisations sont calculées sur votre CA brut. La CFE est une estimation annuelle ÷ 12. Vérifiez sur autoentrepreneur.urssaf.fr.',
    scoreNivel: ['En bonne santé', 'Attention', 'Critique'],
    scoreMsg: [
      'Votre activité est financièrement équilibrée. Continuez à surveiller.',
      'Il y a des points d\'attention. Consultez les composants pour améliorer.',
      'Situation critique. Révisez les marges, prélèvements et régularité du CA.',
    ],
    dreRows: {
      receita: '(+) Chiffre d\'affaires', cmv: '(−) Coût des marchandises', cmvSub: 'Catégorie Réapprovisionnement',
      lucroBruto: '= Résultat brut', despesaOp: '(−) Charges d\'exploitation', despesaOpSub: 'Emballage, Fret, Autres',
      prolabore: '(−) Rémunération dirigeant', prolaoreSub: 'Catégorie Personnel', resultado: '= Résultat net',
    },
    rodapePDF: 'Rapport auxiliaire. Consultez votre expert-comptable pour la déclaration officielle.',
  },
  US: {
    titulo: 'Accountant Mode',
    subtitulo: (m, a) => `Monthly accounting view · ${m}/${a}`,
    exportar: 'Export for CPA',
    infoBanner: 'Data is read automatically from your Cash Flow. The P&L reflects exactly what you already recorded, reorganized by accounting line.',
    k1: 'Revenue', k2: 'Gross profit', k3: 'Net income',
    tabs: ['P&L Statement', 'Health', 'Taxes'],
    dreTitle: (m, a) => `P&L Statement — ${m}/${a}`,
    trendTitle: 'Revenue trend — last 6 months',
    dreNote: '💡 COGS = Restock category. Operating expenses = Packaging, Shipping, Others. SE Tax is 15.3% on 92.35% of net earnings. Federal Tax estimated using 2024 brackets. Consult a CPA for your actual liability.',
    scoreNivel: ['Healthy', 'Warning', 'Critical'],
    scoreMsg: [
      'Your business is financially balanced. Keep monitoring.',
      'There are warning signs. Check the components below to improve.',
      'Critical situation. Review margins, draws, and revenue consistency.',
    ],
    dreRows: {
      receita: '(+) Revenue', cmv: '(−) Cost of goods sold (COGS)', cmvSub: 'Restock category',
      lucroBruto: '= Gross profit', despesaOp: '(−) Operating expenses', despesaOpSub: 'Packaging, Shipping, Others',
      prolabore: '(−) Owner\'s draw', prolaoreSub: 'Personal category', resultado: '= Net income',
    },
    rodapePDF: 'Auxiliary report. Consult a CPA for your official tax filings.',
  },
};

//COMPONENTE DRERow 
interface DRERowProps {
  label: string; valor: number; pctReceita: number; cor: string;
  destaque?: boolean; separador?: boolean; sub?: string; pais: Pais;
}
const DRERow = ({ label, valor, pctReceita, cor, destaque, separador, sub, pais }: DRERowProps) => (
  <>
    {separador && <div className="border-t border-border my-1" />}
    <div className={`flex items-center justify-between py-3 ${separador ? 'pt-4' : ''} ${destaque ? 'border-b border-border' : 'border-b border-border/40'}`}>
      <div>
        <p className={`text-sm ${destaque ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold font-heading ${cor}`}>{fmtMoeda(valor, pais)}</p>
        <p className="text-xs text-muted-foreground">{pct(pctReceita)} receita</p>
      </div>
    </div>
  </>
);
const Contador = () => {
  const { config } = useStore();

  const [pais, setPais] = useState<Pais>(() => lsGet('biztrivo_contador_pais', 'BR') as Pais);
  const [aba,  setAba]  = useState<Aba>('dre');
  const [frAtividade, setFrAtividade] = useState<FrAtividade>(
    () => lsGet('biztrivo_fr_atividade', 'comercio') as FrAtividade
  );
  const [us1099Clients, setUs1099Clients] = useState<{ name: string; amount: number }[]>(() => {
    try { return JSON.parse(lsGet('biztrivo_us_1099', '[]')); } catch { return []; }
  });
  const [us1099Name,   setUs1099Name]   = useState('');
  const [us1099Amount, setUs1099Amount] = useState('');

  const now      = new Date();
  const mesAtual = now.getMonth();
  const anoAtual = now.getFullYear();
  const t        = I18N[pais];

  const handlePais = (p: Pais) => { setPais(p); setAba('dre'); lsSet('biztrivo_contador_pais', p); };
  const handleFrAtiv = (a: FrAtividade) => { setFrAtividade(a); lsSet('biztrivo_fr_atividade', a); };

  //DRE base (igual para todos os países) 
  const dreBase = useMemo(() => {
    const txMes = config.transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
    let receita = 0, cmv = 0, despesaOp = 0, prolabore = 0;
    for (const tx of txMes) {
      if (tx.type === 'entrada') { receita += tx.value; continue; }
      const cat = tx.category ?? '';
      if (cat === 'Reposição')                             cmv        += tx.value;
      else if (cat === 'Pessoal')                          prolabore  += tx.value;
      else if (['Embalagem','Frete','Outros'].includes(cat)) despesaOp += tx.value;
      else                                                 despesaOp  += tx.value;
    }
    const lucroBruto  = receita - cmv;
    const ebitda      = lucroBruto - despesaOp;
    const margemBruta = receita > 0 ? (lucroBruto / receita) * 100 : 0;
    return { receita, cmv, lucroBruto, despesaOp, ebitda, prolabore, margemBruta };
  }, [config.transactions, mesAtual, anoAtual]);

  //impostos por país
  const impostosMensais = useMemo(() => {
    const { ebitda, prolabore, receita, lucroBruto } = dreBase;
    const lucroAntesImposto = ebitda - prolabore;

    if (pais === 'BR') {
      return { br_das: BR_DAS_MEI_MENSAL, total: BR_DAS_MEI_MENSAL };
    }
    if (pais === 'ES') {
      const rend = lucroAntesImposto;
      const cuotaSS =
        rend <= 1_166 ? ES_CUOTA_SS_MINIMA :
        rend <= 1_300 ? 260 :
        rend <= 1_500 ? 275 :
        rend <= 1_700 ? 291 :
                        ES_CUOTA_SS_MAXIMA;
      const irpfMensal = Math.max(0, (lucroAntesImposto - cuotaSS) * ES_IRPF_FRACIONADO / 3);
      return { es_cuotaSS: cuotaSS, es_irpf: irpfMensal, total: cuotaSS + irpfMensal };
    }
    if (pais === 'FR') {
      const taxaCot =
        frAtividade === 'comercio'  ? FR_COTISATIONS_COMERCIO :
        frAtividade === 'servicos'  ? FR_COTISATIONS_SERVICOS :
                                      FR_COTISATIONS_LIBERAL;
      const cotisations = receita * taxaCot;
      const cfeMensal   = FR_CFE_ANUAL / 12;
      return { fr_cotisations: cotisations, fr_cfe: cfeMensal, total: cotisations + cfeMensal };
    }
    // US
    const netAnual    = lucroAntesImposto * 12;
    const seTaxAnual  = netAnual * US_SE_TAX_FACTOR * US_SE_TAX_RATE;
    const fedTaxAnual = calcFedTaxAnual(netAnual);
    return {
      us_seTaxMensal:  seTaxAnual  / 12,
      us_fedTaxMensal: fedTaxAnual / 12,
      seTaxAnual,
      fedTaxAnual,
      us_seTaxSS:  (netAnual * US_SE_TAX_FACTOR * 0.124) / 12,
      us_seTaxMed: (netAnual * US_SE_TAX_FACTOR * 0.029) / 12,
      total: (seTaxAnual + fedTaxAnual) / 12,
    };
  }, [dreBase, pais, frAtividade]);

  //DRE final (com imposto do país) 
  const dre = useMemo(() => {
    const { receita, cmv, lucroBruto, despesaOp, ebitda, prolabore, margemBruta } = dreBase;
    const lucroLiquido = ebitda - prolabore - impostosMensais.total;
    const margemLiq    = receita > 0 ? (lucroLiquido / receita) * 100 : 0;
    return { receita, cmv, lucroBruto, despesaOp, ebitda, prolabore, lucroLiquido, margemBruta, margemLiq };
  }, [dreBase, impostosMensais]);

  //histórico 6 meses 
  const historico6m = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const target = new Date(anoAtual, mesAtual - (5 - i), 1);
      const m = target.getMonth();
      const a = target.getFullYear();
      const txs = config.transactions.filter(tx => {
        const d = new Date(tx.date);
        return d.getMonth() === m && d.getFullYear() === a;
      });
      const rec = txs.filter(tx => tx.type === 'entrada').reduce((s, tx) => s + tx.value, 0);
      const dep = txs.filter(tx => tx.type === 'saida').reduce((s, tx) => s + tx.value, 0);
      return { mes: MESES[m], receita: rec, despesas: dep, saldo: rec - dep };
    });
  }, [config.transactions, mesAtual, anoAtual]);

  //score de saúde 
  const score = useMemo(() => {
    const { margemBruta, receita } = dre;
    const pessoal = config.transactions
      .filter(tx => tx.isPersonal && new Date(tx.date).getMonth() === mesAtual && new Date(tx.date).getFullYear() === anoAtual)
      .reduce((s, tx) => s + tx.value, 0);

    const s1 = margemBruta >= 50 ? 30 : margemBruta >= 40 ? 24 : margemBruta >= 25 ? 15 : margemBruta > 0 ? 6 : 0;

    const pctPessoal = receita > 0 ? (pessoal / receita) * 100 : 100;
    const s2 = pctPessoal <= 15 ? 25 : pctPessoal <= 25 ? 20 : pctPessoal <= 35 ? 10 : 0;

    const mesesComReceita = historico6m.filter(m => m.receita > 0).length;
    const s3 = mesesComReceita >= 5 ? 20 : mesesComReceita >= 3 ? 12 : mesesComReceita >= 1 ? 6 : 0;

    const s4 = dre.lucroLiquido > 0 ? 15 : dre.lucroLiquido === 0 ? 7 : 0;

    // Componente 5 varia por país
    const receitaAnual = config.transactions
      .filter(tx => tx.type === 'entrada' && !tx.isPersonal && new Date(tx.date).getFullYear() === anoAtual)
      .reduce((s, tx) => s + tx.value, 0);

    let s5 = 0;
    let limiteLabel = '';
    let limiteDetalhe = '';

    if (pais === 'BR') {
      const pctMei = (receitaAnual / BR_LIMITE_MEI_ANUAL) * 100;
      s5 = pctMei < 70 ? 10 : pctMei < 90 ? 6 : 0;
      limiteLabel   = 'Limite MEI';
      limiteDetalhe = `${pctMei.toFixed(0)}% do limite usado`;
    } else if (pais === 'ES') {
      const pctImposto = receita > 0 ? (impostosMensais.total / receita) * 100 : 0;
      s5 = pctImposto < 30 ? 10 : pctImposto < 40 ? 6 : 0;
      limiteLabel   = 'Carga fiscal';
      limiteDetalhe = `${pctImposto.toFixed(1)}% de los ingresos en impuestos`;
    } else if (pais === 'FR') {
      const limite = frAtividade === 'comercio' ? FR_LIMITE_CA_COMERCIO : FR_LIMITE_CA_SERVICOS;
      const pctLimite = (receitaAnual / limite) * 100;
      s5 = pctLimite < 70 ? 10 : pctLimite < 90 ? 6 : 0;
      limiteLabel   = 'Plafond micro-entrepreneur';
      limiteDetalhe = `${pctLimite.toFixed(0)}% du plafond utilisé`;
    } else {
      const totalTaxAnual = (impostosMensais.seTaxAnual ?? 0) + (impostosMensais.fedTaxAnual ?? 0);
      const grossAnual    = dre.receita * 12;
      const effectiveRate = grossAnual > 0 ? (totalTaxAnual / grossAnual) * 100 : 0;
      s5 = effectiveRate < 25 ? 10 : effectiveRate < 35 ? 6 : 0;
      limiteLabel   = 'Effective tax rate';
      limiteDetalhe = `${effectiveRate.toFixed(1)}% of gross going to taxes`;
    }

    const total = s1 + s2 + s3 + s4 + s5;
    const idx   = total >= 75 ? 0 : total >= 50 ? 1 : 2;

    return {
      total,
      componentes: [
        { label: 'score_margem',      labelDisplay: t.tabs[1] === 'Saúde' ? 'Margem bruta'            : t.tabs[1] === 'Salud' ? 'Margen bruto'         : t.tabs[1] === 'Santé' ? 'Marge brute'    : 'Gross margin',          valor: s1, max: 30, detalhe: `${pct(margemBruta)} de margem` },
        { label: 'score_pessoal',     labelDisplay: t.tabs[1] === 'Saúde' ? 'Retiradas pessoais'      : t.tabs[1] === 'Salud' ? 'Retiro personal'      : t.tabs[1] === 'Santé' ? 'Prélèvements'   : 'Owner\'s draw',          valor: s2, max: 25, detalhe: `${pct(pctPessoal)} das entradas` },
        { label: 'score_consistencia',labelDisplay: t.tabs[1] === 'Saúde' ? 'Consistência de receita' : t.tabs[1] === 'Salud' ? 'Consistencia ingresos' : t.tabs[1] === 'Santé' ? 'Régularité CA'  : 'Revenue consistency',    valor: s3, max: 20, detalhe: `${mesesComReceita}/6 meses com receita` },
        { label: 'score_saldo',       labelDisplay: t.tabs[1] === 'Saúde' ? 'Resultado líquido'       : t.tabs[1] === 'Salud' ? 'Resultado neto'        : t.tabs[1] === 'Santé' ? 'Résultat net'   : 'Net income',             valor: s4, max: 15, detalhe: dre.lucroLiquido > 0 ? 'Positivo' : dre.lucroLiquido === 0 ? 'Neutro' : 'Negativo' },
        { label: 'score_limite',      labelDisplay: limiteLabel,                                                                                                                                                                    valor: s5, max: 10, detalhe: limiteDetalhe },
      ],
      nivel:  t.scoreNivel[idx],
      cor:    total >= 75 ? 'text-secondary' : total >= 50 ? 'text-warning' : 'text-destructive',
      bgCor:  total >= 75 ? 'bg-secondary/10' : total >= 50 ? 'bg-warning/10' : 'bg-destructive/10',
      strokeColor: total >= 75 ? 'hsl(142,76%,36%)' : total >= 50 ? 'hsl(38,92%,50%)' : 'hsl(0,84%,60%)',
      msg:    t.scoreMsg[idx],
    };
  }, [dre, config.transactions, mesAtual, anoAtual, historico6m, pais, frAtividade, impostosMensais, t]);

  //painel de impostos BR 
  const impostoBR = useMemo(() => {
    const receitaAnual = config.transactions
      .filter(tx => tx.type === 'entrada' && !tx.isPersonal && new Date(tx.date).getFullYear() === anoAtual)
      .reduce((s, tx) => s + tx.value, 0);
    const pctLimite   = (receitaAnual / BR_LIMITE_MEI_ANUAL) * 100;
    const ritmo       = receitaAnual / (mesAtual + 1);
    const projecao    = ritmo * 12;
    let mesEstouro: string | null = null;
    if (projecao > BR_LIMITE_MEI_ANUAL && ritmo > 0) {
      const restantes = Math.ceil((BR_LIMITE_MEI_ANUAL - receitaAnual) / ritmo);
      mesEstouro      = MESES[(mesAtual + restantes) % 12];
    }
    const custoFixo        = dre.despesaOp + dre.prolabore + BR_DAS_MEI_MENSAL;
    const margemContrib    = dre.receita > 0 ? dre.lucroBruto / dre.receita : 0;
    const pontoEquilibrio  = margemContrib > 0 ? custoFixo / margemContrib : 0;
    const dasTotal         = (mesAtual + 1) * BR_DAS_MEI_MENSAL;
    return { receitaAnual, pctLimite, projecao, mesEstouro, pontoEquilibrio, custoFixo, dasTotal };
  }, [config.transactions, mesAtual, anoAtual, dre]);

  // ── Painel de impostos FR ─────────────────────────────────────────────────
  const impostosFR = useMemo(() => {
    const receitaAnual = config.transactions
      .filter(tx => tx.type === 'entrada' && !tx.isPersonal && new Date(tx.date).getFullYear() === anoAtual)
      .reduce((s, tx) => s + tx.value, 0);
    const limiteCA  = frAtividade === 'comercio' ? FR_LIMITE_CA_COMERCIO  : FR_LIMITE_CA_SERVICOS;
    const limiteTVA = frAtividade === 'comercio' ? FR_LIMITE_TVA_COMERCIO : FR_LIMITE_TVA_SERVICOS;
    return { receitaAnual, limiteCA, limiteTVA, pctCA: (receitaAnual / limiteCA) * 100, pctTVA: (receitaAnual / limiteTVA) * 100 };
  }, [config.transactions, anoAtual, frAtividade]);

  //exportar PDF 
  const exportarContabil = () => {
    const doc = new jsPDF();
    const mesLabel = `${MESES[mesAtual]}/${anoAtual}`;
    const paisLabel = { BR: 'BR', ES: 'ES', FR: 'FR', US: 'US' }[pais];
    const titulosPDF: Record<Pais, string> = {
      BR: `Relatório Contábil — ${mesLabel}`,
      ES: `Informe Contable — ${mesLabel}`,
      FR: `Rapport Comptable — ${mesLabel}`,
      US: `Financial Report — ${mesLabel}`,
    };
    const secFiscal: Record<Pais, string> = {
      BR: 'Situação Fiscal', ES: 'Situación Fiscal', FR: 'Situation Fiscale', US: 'Tax Summary',
    };
    const dreLabel = { BR: 'Demonstrativo de Resultado (DRE)', ES: 'Cuenta de Resultados', FR: 'Compte de résultat', US: 'P&L Statement' }[pais];
    const scoreLabel = { BR: 'Score de Saúde Financeira', ES: 'Score de Salud Financiera', FR: 'Score de Santé Financière', US: 'Financial Health Score' }[pais];

    doc.setFontSize(16);
    doc.text(titulosPDF[pais], 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${config.storeName} · ${new Date().toLocaleDateString('pt-BR')} · Score: ${score.total}/100`, 14, 25);
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(dreLabel, 14, 36);

    const dreBody: string[][] = [
      [t.dreRows.receita,    fmtMoeda(dre.receita,    pais), '100%'],
      [t.dreRows.cmv,        fmtMoeda(dre.cmv,        pais), pct(dre.receita > 0 ? (dre.cmv / dre.receita) * 100 : 0)],
      [t.dreRows.lucroBruto, fmtMoeda(dre.lucroBruto, pais), pct(dre.margemBruta)],
      [t.dreRows.despesaOp,  fmtMoeda(dre.despesaOp,  pais), pct(dre.receita > 0 ? (dre.despesaOp / dre.receita) * 100 : 0)],
      [t.dreRows.prolabore,  fmtMoeda(dre.prolabore,  pais), pct(dre.receita > 0 ? (dre.prolabore / dre.receita) * 100 : 0)],
    ];
    if (pais === 'BR') dreBody.push(['(−) DAS MEI (estimado)', fmtMoeda(BR_DAS_MEI_MENSAL, pais), '—']);
    if (pais === 'ES') {
      dreBody.push(['(−) Cuota S. Social (est.)', fmtMoeda(impostosMensais.es_cuotaSS ?? 0, pais), '—']);
      dreBody.push(['(−) IRPF Mod. 130 (est.)',   fmtMoeda(impostosMensais.es_irpf ?? 0,    pais), '—']);
    }
    if (pais === 'FR') {
      dreBody.push(['(−) Cotisations sociales', fmtMoeda(impostosMensais.fr_cotisations ?? 0, pais), '—']);
      dreBody.push(['(−) CFE (provisionada)',   fmtMoeda(impostosMensais.fr_cfe ?? 0,         pais), '—']);
    }
    if (pais === 'US') {
      dreBody.push(['(−) Self-Employment Tax', fmtMoeda(impostosMensais.us_seTaxMensal ?? 0,  pais), '—']);
      dreBody.push(['(−) Federal Income Tax',  fmtMoeda(impostosMensais.us_fedTaxMensal ?? 0, pais), '—']);
    }
    dreBody.push([t.dreRows.resultado, fmtMoeda(dre.lucroLiquido, pais), pct(dre.margemLiq)]);

    autoTable(doc, {
      startY: 40, head: [['Linha', 'Valor', '% Receita']], body: dreBody,
      styles: { fontSize: 9 }, headStyles: { fillColor: [59, 130, 246] }, bodyStyles: { textColor: 0 },
      didParseCell: (data) => {
        if ([2, dreBody.length - 1].includes(data.row.index)) data.cell.styles.fontStyle = 'bold';
      },
    });

    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(secFiscal[pais], 14, y1);
    const fiscalBody: string[][] = [];
    if (pais === 'BR') {
      fiscalBody.push(
        ['Receita bruta acumulada no ano', fmtMoeda(impostoBR.receitaAnual, pais)],
        [`Limite MEI utilizado (${pct(impostoBR.pctLimite)})`, fmtMoeda(BR_LIMITE_MEI_ANUAL, pais)],
        ['Projeção receita anual', fmtMoeda(impostoBR.projecao, pais)],
        ['DAS MEI acumulado (est.)', fmtMoeda(impostoBR.dasTotal, pais)],
        ['Ponto de equilíbrio mensal', fmtMoeda(impostoBR.pontoEquilibrio, pais)],
      );
    } else if (pais === 'ES') {
      fiscalBody.push(
        ['Cuota SS mensual (est.)',   fmtMoeda(impostosMensais.es_cuotaSS ?? 0, pais)],
        ['IRPF trimestral (est.)',    fmtMoeda((impostosMensais.es_irpf ?? 0) * 3, pais)],
        ['Total impostos/mês (est.)', fmtMoeda(impostosMensais.total, pais)],
      );
    } else if (pais === 'FR') {
      fiscalBody.push(
        ['Cotisations sociales/mois', fmtMoeda(impostosMensais.fr_cotisations ?? 0, pais)],
        ['CFE provisionada/mois',     fmtMoeda(impostosMensais.fr_cfe ?? 0,         pais)],
        ['CA annuel accumulé',        fmtMoeda(impostosFF.receitaAnual,              pais)],
      );
    } else {
      fiscalBody.push(
        ['SE Tax/month (est.)',       fmtMoeda(impostosMensais.us_seTaxMensal ?? 0,  pais)],
        ['Federal Income Tax/month',  fmtMoeda(impostosMensais.us_fedTaxMensal ?? 0, pais)],
        ['Annual SE Tax (est.)',      fmtMoeda(impostosMensais.seTaxAnual ?? 0,    pais)],
        ['Annual Federal Tax (est.)', fmtMoeda(impostosMensais.fedTaxAnual ?? 0,   pais)],
      );
    }
    autoTable(doc, {
      startY: y1 + 4, head: [['Item', 'Valor']], body: fiscalBody,
      styles: { fontSize: 9 }, headStyles: { fillColor: [100, 116, 139] },
    });

    const y2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`${scoreLabel}: ${score.total}/100 (${score.nivel})`, 14, y2);
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Componente', 'Pontos', 'Máx', 'Detalhe']],
      body: score.componentes.map(c => [c.labelDisplay, c.valor, c.max, c.detalhe]),
      styles: { fontSize: 9 }, headStyles: { fillColor: [100, 116, 139] },
    });

    const y3 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(t.rodapePDF, 14, y3);
    doc.save(`Contador_${paisLabel}_${mesLabel.replace('/', '_')}_${config.storeName.replace(/\s+/g, '_')}.pdf`);
    toast.success(pais === 'BR' ? 'Relatório contábil exportado' : pais === 'ES' ? 'Informe exportado' : pais === 'FR' ? 'Rapport exporté' : 'Report exported');
  };

  //para o painel FR (mesmo objeto, nome mais curto no JSX)
  const impostosFF = impostosFR;

  const maxHistorico = Math.max(...historico6m.map(m => m.receita), 1);

  //RENDER
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">{t.titulo}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitulo(MESES[mesAtual], anoAtual)}</p>
        </div>
        <button
          onClick={exportarContabil}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium shadow-glow"
        >
          <Download className="w-4 h-4" /> {t.exportar}
        </button>
      </div>

      {/*seletor de país */}
      <Card className="p-4 border-none shadow-md">
        <p className="text-sm font-medium text-muted-foreground mb-3">
          {pais === 'BR' ? 'Selecione seu país' : pais === 'ES' ? 'Selecciona tu país' : pais === 'FR' ? 'Sélectionnez votre pays' : 'Select your country'}
        </p>
        <div className="flex gap-3 flex-wrap">
          {(['BR', 'ES', 'FR', 'US'] as Pais[]).map(p => (
            <button
              key={p}
              onClick={() => handlePais(p)}
              className={`flex flex-col items-center gap-1 min-w-[76px] px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                pais === p
                  ? 'gradient-primary text-primary-foreground shadow-glow'
                  : 'border border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              <span className="text-2xl">{ p === 'BR' ? '🇧🇷' : p === 'ES' ? '🇪🇸' : p === 'FR' ? '🇫🇷' : '🇺🇸' }</span>
              <span>{ p === 'BR' ? 'Brasil' : p === 'ES' ? 'España' : p === 'FR' ? 'France' : 'USA' }</span>
            </button>
          ))}
        </div>
      </Card>
      {/*banner info */}
      <Card className="p-4 border-none shadow-md border-l-4 border-l-primary bg-primary/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">{t.infoBanner}</p>
        </div>
      </Card>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-none shadow-md">
          <p className="text-xs text-muted-foreground">{t.k1}</p>
          <p className="text-xl font-bold font-heading text-secondary mt-1">{fmtMoeda(dre.receita, pais)}</p>
        </Card>
        <Card className="p-4 border-none shadow-md">
          <p className="text-xs text-muted-foreground">{t.k2}</p>
          <p className="text-xl font-bold font-heading text-primary mt-1">{fmtMoeda(dre.lucroBruto, pais)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Margem {pct(dre.margemBruta)}</p>
        </Card>
        <Card className="p-4 border-none shadow-md">
          <p className="text-xs text-muted-foreground">{t.k3}</p>
          <p className={`text-xl font-bold font-heading mt-1 ${dre.lucroLiquido >= 0 ? 'text-secondary' : 'text-destructive'}`}>
            {fmtMoeda(dre.lucroLiquido, pais)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Margem {pct(dre.margemLiq)}</p>
        </Card>
        <Card className={`p-4 border-none shadow-md ${score.bgCor}`}>
          <p className="text-xs text-muted-foreground">{ pais === 'BR' ? 'Score de saúde' : pais === 'ES' ? 'Score de salud' : pais === 'FR' ? 'Score de santé' : 'Health score' }</p>
          <p className={`text-xl font-bold font-heading mt-1 ${score.cor}`}>{score.total}<span className="text-sm font-normal">/100</span></p>
          <p className={`text-xs font-medium mt-0.5 ${score.cor}`}>{score.nivel}</p>
        </Card>
      </div>
      {/*tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {([
          { value: 'dre' as Aba,      label: t.tabs[0], icon: FileSpreadsheet },
          { value: 'score' as Aba,    label: t.tabs[1], icon: Activity },
          { value: 'impostos' as Aba, label: t.tabs[2], icon: Calculator },
        ]).map(({ value, label, icon: Icon }) => (
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
      {/*ABA: DRE*/}
      {aba === 'dre' && (
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-md">
            <h2 className="text-lg font-semibold font-heading mb-5 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              {t.dreTitle(MESES[mesAtual], anoAtual)}
            </h2>
            <div className="space-y-0">
              <DRERow label={t.dreRows.receita}    valor={dre.receita}    pctReceita={100}                                                       cor="text-secondary"   destaque pais={pais} />
              <DRERow label={t.dreRows.cmv}        valor={dre.cmv}        pctReceita={dre.receita > 0 ? (dre.cmv / dre.receita) * 100 : 0}       cor="text-destructive" sub={t.dreRows.cmvSub} pais={pais} />
              <DRERow label={t.dreRows.lucroBruto} valor={dre.lucroBruto} pctReceita={dre.margemBruta}                                           cor={dre.lucroBruto >= 0 ? 'text-primary' : 'text-destructive'} destaque separador pais={pais} />
              <DRERow label={t.dreRows.despesaOp}  valor={dre.despesaOp}  pctReceita={dre.receita > 0 ? (dre.despesaOp / dre.receita) * 100 : 0} cor="text-destructive" sub={t.dreRows.despesaOpSub} pais={pais} />
              <DRERow label={t.dreRows.prolabore}  valor={dre.prolabore}  pctReceita={dre.receita > 0 ? (dre.prolabore / dre.receita) * 100 : 0} cor="text-warning"     sub={t.dreRows.prolaoreSub} pais={pais} />

              {/*linha de imposto — varia por país */}
              {pais === 'BR' && (
                <DRERow label="(−) DAS MEI (estimado)" valor={BR_DAS_MEI_MENSAL} pctReceita={dre.receita > 0 ? (BR_DAS_MEI_MENSAL / dre.receita) * 100 : 0} cor="text-muted-foreground" sub="Valor fixo 2026 — confirme em gov.br/mei" pais={pais} />
              )}
              {pais === 'ES' && (<>
                <DRERow label="(−) Cuota S. Social (est.)" valor={impostosMensais.es_cuotaSS ?? 0} pctReceita={dre.receita > 0 ? ((impostosMensais.es_cuotaSS ?? 0) / dre.receita) * 100 : 0} cor="text-destructive" sub="Estimativa pelo tramo de rendimento — ajuste com seu gestor" pais={pais} />
                <DRERow label="(−) IRPF pago fraccionado" valor={impostosMensais.es_irpf ?? 0}    pctReceita={dre.receita > 0 ? ((impostosMensais.es_irpf ?? 0) / dre.receita) * 100 : 0}    cor="text-destructive" sub="20% del rendimiento neto — mensualizado del Modelo 130" pais={pais} />
              </>)}
              {pais === 'FR' && (<>
                <DRERow label="(−) Cotisations sociales" valor={impostosMensais.fr_cotisations ?? 0} pctReceita={dre.receita > 0 ? ((impostosMensais.fr_cotisations ?? 0) / dre.receita) * 100 : 0} cor="text-destructive" sub={`${frAtividade === 'comercio' ? '12,3' : frAtividade === 'servicos' ? '21,2' : '21,1'}% du CA brut`} pais={pais} />
                <DRERow label="(−) CFE (provisionnée)"  valor={impostosMensais.fr_cfe ?? 0}          pctReceita={dre.receita > 0 ? ((impostosMensais.fr_cfe ?? 0) / dre.receita) * 100 : 0}          cor="text-muted-foreground" sub="Cotisation Foncière des Entreprises — estimative annuelle ÷ 12" pais={pais} />
              </>)}
              {pais === 'US' && (<>
                <DRERow label="(−) Self-Employment Tax" valor={impostosMensais.us_seTaxMensal ?? 0}  pctReceita={dre.receita > 0 ? ((impostosMensais.us_seTaxMensal ?? 0) / dre.receita) * 100 : 0}  cor="text-destructive" sub="15.3% on 92.35% of net earnings (Social Security + Medicare)" pais={pais} />
                <DRERow label="(−) Federal Income Tax"  valor={impostosMensais.us_fedTaxMensal ?? 0} pctReceita={dre.receita > 0 ? ((impostosMensais.us_fedTaxMensal ?? 0) / dre.receita) * 100 : 0} cor="text-destructive" sub="Estimated — 2024 single-filer brackets + standard deduction" pais={pais} />
              </>)}

              <DRERow label={t.dreRows.resultado} valor={dre.lucroLiquido} pctReceita={dre.margemLiq} cor={dre.lucroLiquido >= 0 ? 'text-secondary' : 'text-destructive'} destaque separador pais={pais} />
            </div>
            <p className="text-xs text-muted-foreground mt-4">{t.dreNote}</p>
          </Card>

          <Card className="p-6 border-none shadow-md">
            <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> {t.trendTitle}
            </h2>
            <div className="space-y-3">
              {historico6m.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8 shrink-0">{m.mes}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${(m.receita / maxHistorico) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium w-24 text-right shrink-0">{fmtMoeda(m.receita, pais)}</span>
                  <span className={`text-xs w-20 text-right shrink-0 ${m.saldo >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {m.saldo >= 0 ? '+' : ''}{fmtMoeda(m.saldo, pais)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              { pais === 'BR' ? 'Barra = receita · Valor à direita = resultado (receita − despesas) do mês'
              : pais === 'ES' ? 'Barra = ingresos · Valor derecha = resultado (ingresos − gastos) del mes'
              : pais === 'FR' ? 'Barre = CA · Valeur droite = résultat (CA − charges) du mois'
              :                  'Bar = revenue · Right value = result (revenue − expenses) for the month' }
            </p>
          </Card>
        </div>
      )}

      {/*ABA: SCORE */}
      {aba === 'score' && (
        <div className="space-y-6">
          <Card className={`p-6 border-none shadow-md ${score.bgCor}`}>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" strokeWidth="10" fill="none" className="text-muted" stroke="currentColor" />
                  <circle cx="50" cy="50" r="42" strokeWidth="10" fill="none"
                    stroke={score.strokeColor}
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
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{score.msg}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-md">
            <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              { pais === 'BR' ? 'Composição do score' : pais === 'ES' ? 'Composición del score' : pais === 'FR' ? 'Composition du score' : 'Score breakdown' }
            </h2>
            <div className="space-y-5">
              {score.componentes.map((c, i) => {
                const pctComp = (c.valor / c.max) * 100;
                const corBarra = pctComp >= 80 ? 'bg-secondary' : pctComp >= 50 ? 'bg-warning' : 'bg-destructive';
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{c.labelDisplay}</span>
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
              <Target className="w-5 h-5 text-primary" />
              { pais === 'BR' ? 'Como melhorar seu score' : pais === 'ES' ? 'Cómo mejorar tu score' : pais === 'FR' ? 'Comment améliorer votre score' : 'How to improve your score' }
            </h2>
            <div className="space-y-3">
              {score.componentes.filter(c => c.valor < c.max).map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">{c.labelDisplay}</p>
                    <p className="text-muted-foreground mt-0.5">{dica(c.label, pais)}</p>
                  </div>
                </div>
              ))}
              {score.componentes.every(c => c.valor === c.max) && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <p className="text-sm text-secondary font-medium">
                    { pais === 'BR' ? 'Todos os indicadores estão no máximo. Excelente gestão!'
                    : pais === 'ES' ? '¡Todos los indicadores al máximo. ¡Excelente gestión!'
                    : pais === 'FR' ? 'Tous les indicateurs au maximum. Excellente gestion !'
                    :                 'All indicators at maximum. Excellent management!' }
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/*ABA: IMPOSTOS */}
      {aba === 'impostos' && (
        <div className="space-y-6">

          {/*BRASIL*/}
          {pais === 'BR' && (<>
            <Card className="p-6 border-none shadow-md">
              <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" /> Limite MEI — {anoAtual}
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receita acumulada</span>
                  <span className="font-bold">{fmtMoeda(impostoBR.receitaAnual, 'BR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Limite anual</span>
                  <span>{fmtMoeda(BR_LIMITE_MEI_ANUAL, 'BR')}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${impostoBR.pctLimite >= 90 ? 'bg-destructive' : impostoBR.pctLimite >= 70 ? 'bg-warning' : 'bg-secondary'}`}
                    style={{ width: `${Math.min(impostoBR.pctLimite, 100)}%` }} />
                </div>
                <p className="text-sm font-medium">
                  {impostoBR.pctLimite.toFixed(1)}% utilizado
                  {impostoBR.mesEstouro && <span className="text-destructive ml-2">· Previsão de estouro: {impostoBR.mesEstouro}/{anoAtual}</span>}
                </p>
                {impostoBR.pctLimite >= 70 && (
                  <Card className="p-4 border-none bg-warning/10 border-l-4 border-l-warning">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-warning">Atenção ao limite</p>
                        <p className="text-muted-foreground mt-1">
                          No ritmo atual, sua receita projetada é de <strong>{fmtMoeda(impostoBR.projecao, 'BR')}</strong> este ano.
                          {impostoBR.projecao > BR_LIMITE_MEI_ANUAL * 1.2 ? ' Avalie migrar para ME ou ME-EPP com seu contador.' : ' Monitore mensalmente para evitar obrigações adicionais.'}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 border-none shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-warning" />
                  <h3 className="font-semibold font-heading">DAS MEI</h3>
                </div>
                <p className="text-2xl font-bold font-heading text-warning">{fmtMoeda(BR_DAS_MEI_MENSAL, 'BR')}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <p className="text-sm text-muted-foreground mt-1">Acumulado {anoAtual}: <strong>{fmtMoeda(impostoBR.dasTotal, 'BR')}</strong></p>
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
                <p className="text-2xl font-bold font-heading text-primary">{fmtMoeda(impostoBR.pontoEquilibrio, 'BR')}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <p className="text-sm text-muted-foreground mt-1">Receita mínima para cobrir todos os custos fixos</p>
                {dre.receita > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Receita atual</span>
                      <span>{dre.receita >= impostoBR.pontoEquilibrio ? '✅ Acima' : '⚠️ Abaixo'}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${dre.receita >= impostoBR.pontoEquilibrio ? 'bg-secondary' : 'bg-destructive'}`}
                        style={{ width: `${Math.min((dre.receita / Math.max(impostoBR.pontoEquilibrio, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Custos fixos: {fmtMoeda(impostoBR.custoFixo, 'BR')} (desp. op. + pró-labore + DAS)</p>
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
          </>)}

          {/*ESPANHA*/}
          {pais === 'ES' && (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 border-none shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-warning" />
                  <h3 className="font-semibold font-heading">Seguridad Social</h3>
                </div>
                <p className="text-2xl font-bold font-heading text-warning">{fmtMoeda(impostosMensais.es_cuotaSS ?? 0, 'ES')}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                <p className="text-sm text-muted-foreground mt-1">Acumulado {anoAtual}: <strong>{fmtMoeda((impostosMensais.es_cuotaSS ?? 0) * (mesAtual + 1), 'ES')}</strong></p>
                <p className="text-xs text-muted-foreground mt-3">Vence día 20 de cada mes · <a href="https://sede.seg-social.gob.es" target="_blank" rel="noopener noreferrer" className="underline text-primary">sede.seg-social.gob.es</a></p>
              </Card>
              <Card className="p-5 border-none shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold font-heading">IRPF — Modelo 130</h3>
                </div>
                <p className="text-2xl font-bold font-heading text-primary">{fmtMoeda((impostosMensais.es_irpf ?? 0) * 3, 'ES')}<span className="text-sm font-normal text-muted-foreground">/trim.</span></p>
                <p className="text-sm text-muted-foreground mt-1">
                  Próxima entrega: <strong>
                    {mesAtual < 3 ? '20 Abr' : mesAtual < 6 ? '20 Jul' : mesAtual < 9 ? '20 Oct' : '30 Ene'}
                  </strong>
                </p>
                <p className="text-xs text-muted-foreground mt-3">Declara en <a href="https://agenciatributaria.gob.es" target="_blank" rel="noopener noreferrer" className="underline text-primary">agenciatributaria.gob.es</a></p>
              </Card>
            </div>

            <Card className="p-6 border-none shadow-md">
              <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" /> IVA — Modelo 303
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[['21%','General','Servicios generales, productos no esenciales'],
                  ['10%','Reducido','Hostelería, transporte, alimentos elaborados'],
                  ['4%','Superreducido','Alimentos básicos, medicamentos']].map(([rate, name, desc]) => (
                  <div key={rate} className="p-3 rounded-xl bg-muted/40 text-center">
                    <p className="text-2xl font-bold font-heading text-primary">{rate}</p>
                    <p className="text-xs font-medium mt-1">{name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">El Modelo 303 se presenta trimestralmente. Los autónomos en módulos pueden estar exentos — consulta a tu gestor.</p>
            </Card>

            <Card className="p-6 border-none shadow-md">
              <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Calendario fiscal — Autónomo
              </h2>
              <div className="space-y-2">
                {[
                  { label: 'T1 (Ene–Mar)', due: 'hasta 20 Abr', q: 0 },
                  { label: 'T2 (Abr–Jun)', due: 'hasta 20 Jul', q: 1 },
                  { label: 'T3 (Jul–Sep)', due: 'hasta 20 Oct', q: 2 },
                  { label: 'T4 (Oct–Dic)', due: 'hasta 30 Ene', q: 3 },
                ].map(({ label, due, q }) => {
                  const trimAtual = Math.floor(mesAtual / 3);
                  const isActive  = q === trimAtual;
                  return (
                    <div key={q} className={`flex items-center justify-between p-3 rounded-xl ${isActive ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}>
                      <span className="text-sm font-medium">{label} · Modelo 130 + 303</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{due}</span>
                        {isActive && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Próximo</span>}
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm font-medium">Anual — IRPF (Renta)</span>
                  <span className="text-sm text-muted-foreground">Abr–Jun año siguiente</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-none shadow-md bg-muted/50">
              <h3 className="font-semibold font-heading text-sm mb-2">📋 Checklist fiscal mensual</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Pagar cuota SS hasta día 20 del mes</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Guardar todas las facturas emitidas y recibidas</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Preparar Modelo 130 trimestralmente</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> Preparar Modelo 303 si estás registrado en IVA</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> Verificar tramo de rendimiento en Seguridad Social anualmente</li>
              </ul>
            </Card>
          </>)}
 {/*FRANÇA*/}
          {pais === 'FR' && (<>
            <Card className="p-5 border-none shadow-md">
              <h3 className="font-semibold font-heading mb-3">Mon activité principale</h3>
              <div className="flex gap-2 flex-wrap mb-3">
                {([['comercio','🛍️ Commerce'],['servicos','🛠️ Services BIC'],['liberal','🎓 Libéral BNC']] as [FrAtividade, string][]).map(([val, label]) => (
                  <button key={val} onClick={() => handleFrAtiv(val)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${frAtividade === val ? 'gradient-primary text-primary-foreground shadow-glow' : 'border border-border text-muted-foreground hover:bg-muted'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Taux de cotisations : <strong className="text-foreground">
                  {frAtividade === 'comercio' ? '12,3%' : frAtividade === 'servicos' ? '21,2%' : '21,1%'} du CA brut
                </strong>
              </p>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 border-none shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold font-heading">Cotisations URSSAF</h3>
                </div>
                <p className="text-2xl font-bold font-heading text-destructive">{fmtMoeda(impostosMensais.fr_cotisations ?? 0, 'FR')}<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
                <p className="text-sm text-muted-foreground mt-1">
                  {frAtividade === 'comercio' ? '12,3%' : frAtividade === 'servicos' ? '21,2%' : '21,1%'} de votre CA brut mensuel
                </p>
                <p className="text-xs text-muted-foreground mt-3">Déclaration sur <a href="https://autoentrepreneur.urssaf.fr" target="_blank" rel="noopener noreferrer" className="underline text-primary">autoentrepreneur.urssaf.fr</a></p>
              </Card>
              <Card className="p-5 border-none shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold font-heading">CFE annuelle</h3>
                </div>
                <p className="text-2xl font-bold font-heading text-primary">{fmtMoeda(FR_CFE_ANUAL, 'FR')}<span className="text-sm font-normal text-muted-foreground">/an</span></p>
                <p className="text-sm text-muted-foreground mt-1">Provision mensuelle : <strong>{fmtMoeda(FR_CFE_ANUAL / 12, 'FR')}</strong></p>
                <p className="text-xs text-muted-foreground mt-3">Payable en décembre. Exonération la 1ère année d'activité.</p>
              </Card>
            </div>
  <Card className="p-6 border-none shadow-md">
              <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" /> Plafond micro-entrepreneur
              </h2>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Plafond du régime ({frAtividade === 'comercio' ? 'Commerce' : 'Services'})</span>
                    <span className="font-bold">{fmtMoeda(impostosFF.receitaAnual, 'FR')} / {fmtMoeda(impostosFF.limiteCA, 'FR')}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${impostosFF.pctCA >= 90 ? 'bg-destructive' : impostosFF.pctCA >= 70 ? 'bg-warning' : 'bg-secondary'}`}
                      style={{ width: `${Math.min(impostosFF.pctCA, 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{impostosFF.pctCA.toFixed(1)}% du plafond · Au-dessus : sortie du régime micro</p>
                </div>
                <div> <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Franchise en base TVA</span>
                    <span className="font-bold">{fmtMoeda(impostosFF.receitaAnual, 'FR')} / {fmtMoeda(impostosFF.limiteTVA, 'FR')}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${impostosFF.pctTVA >= 100 ? 'bg-destructive' : impostosFF.pctTVA >= 70 ? 'bg-warning' : 'bg-secondary'}`}
                      style={{ width: `${Math.min(impostosFF.pctTVA, 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{impostosFF.pctTVA.toFixed(1)}% du seuil TVA</p>
                  {impostosFF.pctTVA >= 100 && (
                    <Card className="p-3 border-none bg-destructive/10 border-l-4 border-l-destructive mt-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive">Vous avez dépassé le seuil de franchise TVA. Vous devez désormais facturer la TVA à vos clients.</p>
                      </div>
                    </Card>
                  )}
                </div> </div> </Card>
            <Card className="p-5 border-none shadow-md">
              <h3 className="font-semibold font-heading mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> ACRE — Aide à la Création
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[['Année 1','50% de réduction'],['Année 2','25% de réduction'],['Année 3','Taux plein']].map(([a, d]) => (
                  <div key={a} className="p-3 rounded-xl bg-muted/40 text-center">
                    <p className="text-sm font-semibold">{a}</p>
                    <p className="text-xs text-muted-foreground mt-1">{d}</p>
                  </div>
                ))}
              </div>
             <p className="text-xs text-muted-foreground mt-3">Vérifiez votre éligibilité sur pole-emploi.fr ou urssaf.fr</p>
            </Card>
            <Card className="p-5 border-none shadow-md bg-muted/50">
              <h3 className="font-semibold font-heading text-sm mb-2">📋 Checklist fiscal mensuel</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Déclarer et payer les cotisations URSSAF</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Conserver toutes les factures et justificatifs</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Tenir le livre des recettes à jour</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> Déclarer votre CA annuel (mai de l'année suivante)</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> Vérifier l'évolution de vos plafonds chaque trimestre</li>
              </ul>
            </Card>
          </>)}
          {/*EUA*/}
          {pais === 'US' && (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 border-none shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold font-heading">Self-Employment Tax</h3>
                </div>
                <p className="text-2xl font-bold font-heading text-destructive">{fmtMoeda(impostosMensais.us_seTaxMensal ?? 0, 'US')}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Social Security (12.4%)</span>
                    <span className="font-medium text-foreground">{fmtMoeda(impostosMensais.us_seTaxSS ?? 0, 'US')}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medicare (2.9%)</span>
                    <span className="font-medium text-foreground">{fmtMoeda(impostosMensais.us_seTaxMed ?? 0, 'US')}/mo</span>
                  </div>  </div>
                <p className="text-xs text-muted-foreground mt-3">Half of SE Tax ({fmtMoeda((impostosMensais.seTaxAnual ?? 0) / 2, 'US')}/yr) is deductible from gross income.</p>
              </Card>
              <Card className="p-5 border-none shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold font-heading">Federal Income Tax</h3>
                </div>
                <p className="text-2xl font-bold font-heading text-primary">{fmtMoeda(impostosMensais.us_fedTaxMensal ?? 0, 'US')}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between border-b border-border/40 pb-1">
                    <span>Standard deduction</span>
                    <span className="font-medium text-foreground">{fmtMoeda(US_STANDARD_DEDUCTION, 'US')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual est. (2024 brackets)</span>
                    <span className="font-medium text-foreground">{fmtMoeda(impostosMensais.fedTaxAnual ?? 0, 'US')}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">State taxes not included. Consult a CPA for your full liability.</p>
              </Card>  </div>
            <Card className="p-6 border-none shadow-md">
              <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Quarterly Estimated Taxes
              </h2>
              <div className="space-y-2">
                {US_QUARTERLY.map((q, i) => {
                  const trimAtual = q.months.includes(mesAtual);
                  const passed    = mesAtual > Math.max(...q.months);
                  const totalTaxAnual = (impostosMensais.seTaxAnual ?? 0) + (impostosMensais.fedTaxAnual ?? 0);
                  const qValue    = totalTaxAnual * (q.months.length / 12);
                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${trimAtual ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}>
                      <div>
                        <span className="text-sm font-medium">{q.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">Due {q.due}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">{fmtMoeda(qValue, 'US')}</span>
                        {trimAtual && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Due soon</span>}
                        {passed && <CheckCircle2 className="w-4 h-4 text-secondary" />}
                      </div> </div>
                  ); })}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                💡 Save <strong className="text-foreground">{fmtMoeda(((impostosMensais.seTaxAnual ?? 0) + (impostosMensais.fedTaxAnual ?? 0)) / 12, 'US')}/month</strong> to cover quarterly payments.
              </p>
            </Card>
            <Card className="p-6 border-none shadow-md">
              <h2 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" /> Common Deductions — Schedule C
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {['📦 Cost of goods sold','🏠 Home office (proportional)','🚗 Business mileage ($.67/mi)','📱 Phone & internet (biz %)','💻 Equipment & software','🏥 Health insurance premiums','✈️ Business travel','📚 Education & training','📢 Advertising & marketing','🔧 Tools & supplies'].map(d => (
                  <div key={d} className="text-xs p-2 rounded-lg bg-muted/40">{d}</div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Keep receipts for every deduction. Use IRS Free File or consult a CPA.</p>
            </Card>
            <Card className="p-6 border-none shadow-md">
              <h2 className="text-lg font-semibold font-heading mb-3 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" /> 1099-NEC Income Tracker
              </h2>
              <p className="text-xs text-muted-foreground mb-3">Clients who pay you $600+ must send a 1099 by Jan 31. Track them here.</p>
              {us1099Clients.length > 0 && (
                <div className="space-y-1 mb-3">
                  {us1099Clients.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/40">
                      <span>{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{fmtMoeda(c.amount, 'US')}</span>
                        <button onClick={() => {
                          const updated = us1099Clients.filter((_, j) => j !== i);
                          setUs1099Clients(updated);
                          lsSet('biztrivo_us_1099', JSON.stringify(updated));
                        }} className="text-destructive text-xs hover:underline">✕</button>
                      </div> </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border">
                    <span>Total</span>
                    <span>{fmtMoeda(us1099Clients.reduce((s, c) => s + c.amount, 0), 'US')}</span>
                  </div>  </div>
              )}
              <div className="flex gap-2">
                <input value={us1099Name} onChange={e => setUs1099Name(e.target.value)} placeholder="Client name"
                  className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm" />
                <input value={us1099Amount} onChange={e => setUs1099Amount(e.target.value)} placeholder="Amount $"
                  type="number" className="w-28 h-9 px-3 rounded-md border border-input bg-background text-sm" />
                <button onClick={() => {
                  const amt = parseFloat(us1099Amount);
                  if (!us1099Name.trim() || isNaN(amt)) return;
                  const updated = [...us1099Clients, { name: us1099Name.trim(), amount: amt }];
                  setUs1099Clients(updated);
                  lsSet('biztrivo_us_1099', JSON.stringify(updated));
                  setUs1099Name(''); setUs1099Amount('');
                }} className="px-3 h-9 rounded-md gradient-primary text-primary-foreground text-sm font-medium shadow-glow">
                  + Add
                </button>
              </div> </Card>
            <Card className="p-5 border-none shadow-md bg-muted/50">
              <h3 className="font-semibold font-heading text-sm mb-2">📋 Tax checklist</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Pay quarterly estimated taxes on time (Apr, Jun, Sep, Jan)</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Keep all business receipts and invoices</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Track business mileage ($.67/mile in 2024)</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> Separate business and personal bank accounts</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> File Schedule C with Form 1040 by April 15</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> Send 1099-NEC to contractors paid $600+ by Jan 31</li>
              </ul>
            </Card>
          </>)}  </div>  )} </div>
  );
};
export default Contador;