import { Card } from '@/components/ui/card';
import { BookOpen, Download } from 'lucide-react';

// --- LISTA EM PORTUGUÊS ---
const resourcesPT = [
  {
    title: 'Como Precificar seus Produtos',
    desc: 'Checklist completo para não errar no preço',
    file: '/guides/guia1_precificacao.html',
  },
  {
    title: 'Guia de Fotos para Catálogo',
    desc: 'Tire fotos profissionais com o celular',
    file: '/guides/guia2_fotos_catalogo.html',
  },
  {
    title: 'Planilha de Controle de Estoque',
    desc: 'Template pronto para usar',
    file: '/guides/guia3_controle_estoque.html',
  },
  {
    title: 'Script de Vendas no WhatsApp',
    desc: 'Mensagens prontas que convertem',
    file: '/guides/guia4_script_whatsapp.html',
  },
  {
    title: 'Como Criar Promoções Inteligentes',
    desc: 'Estratégias para aumentar suas vendas',
    file: '/guides/guia5_promocoes_inteligentes.html',
  },
  {
    title: 'Como Fidelizar Clientes e Gerar Recompra',
    desc: 'Faça o cliente comprar de novo sempre',
    file: '/guides/guia6_fidelizar_clientes.html',
  },
  {
    title: 'Como Definir seu Público-Alvo',
    desc: 'Pare de vender pra todo mundo',
    file: '/guides/guia7_publico_alvo.html',
  },
  {
    title: 'Como Atender Reclamações',
    desc: 'Reverta clientes insatisfeitos e fidelize',
    file: '/guides/guia8_reclamacoes.html',
  },
];

// --- LISTA EM INGLÊS ---
const resourcesEN = [
  {
    title: 'How to Price Your Products',
    desc: 'Complete checklist to set the right price',
    file: '/guides/en_guide1_pricing.html',
  },
  {
    title: 'Catalog Photo Guide',
    desc: 'Take professional photos using your phone',
    file: '/guides/en_guide2_photos.html',
  },
  {
    title: 'Inventory Control Spreadsheet',
    desc: 'Ready to use template',
    file: '/guides/en_guide3_inventory.html',
  },
  {
    title: 'WhatsApp Sales Script',
    desc: 'Ready to use messages that convert',
    file: '/guides/en_guide4_sales_script.html',
  },
  {
    title: 'How to Create Smart Promotions',
    desc: 'Strategies to increase your sales',
    file: '/guides/en_guide5_promotions.html',
  },
  {
    title: 'Customer Loyalty and Retention',
    desc: 'Get customers to keep coming back',
    file: '/guides/en_guide6_retention.html',
  },
  {
    title: 'How to Define Your Target Audience',
    desc: 'Stop trying to sell to everyone',
    file: '/guides/en_guide7_target_audience.html',
  },
  {
    title: 'Handling Customer Complaints',
    desc: 'Turn unhappy customers into loyal fans',
    file: '/guides/en_guide8_complaints.html',
  },
];

const Academy = () => {
  const isBrazilian = navigator.language === 'pt-BR' || navigator.languages.includes('pt-BR');
  
  const resources = isBrazilian ? resourcesPT : resourcesEN;
  const title = isBrazilian ? "Academy" : "Academy"; 
  const subtitle = isBrazilian ? "Aprenda a vender mais e melhor" : "Learn how to sell more and better";
  const downloadText = isBrazilian ? "Baixar" : "Download";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <div className="space-y-3">
        {resources.map((r, i) => (
          <Card key={i} className="p-5 border-none shadow-md flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            </div>
            <a
              href={r.file}
              download
              className="px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-sm font-medium flex items-center gap-2 hover:bg-secondary/20 transition-colors"
            >
              <Download className="w-4 h-4" /> {downloadText}
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Academy;