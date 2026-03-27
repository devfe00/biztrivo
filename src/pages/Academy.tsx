import { Card } from '@/components/ui/card';
import { BookOpen, Download } from 'lucide-react';

const resources = [
  { title: 'Como Precificar seus Produtos', desc: 'Checklist completo para não errar no preço' },
  { title: 'Guia de Fotos para Catálogo', desc: 'Tire fotos profissionais com o celular' },
  { title: 'Planilha de Controle de Estoque', desc: 'Template pronto para usar' },
  { title: 'Script de Vendas no WhatsApp', desc: 'Mensagens prontas que convertem' },
  { title: 'Como Criar Promoções Inteligentes', desc: 'Estratégias para aumentar suas vendas' },
];

const Academy = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">Academy</h1>
        <p className="text-muted-foreground mt-1">Aprenda a vender mais e melhor</p>
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
            <button className="px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-sm font-medium flex items-center gap-2 hover:bg-secondary/20 transition-colors">
              <Download className="w-4 h-4" /> Baixar
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Academy;
