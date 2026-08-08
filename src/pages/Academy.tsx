import { Card } from '@/components/ui/card';
import { BookOpen, Download } from 'lucide-react';
import { useT, useI18n } from '@/lib/i18n';

const guideFiles = {
  pt: [
    '/guides/guia1_precificacao.html',
    '/guides/guia2_fotos_catalogo.html',
    '/guides/guia3_controle_estoque.html',
    '/guides/guia4_script_whatsapp.html',
    '/guides/guia5_promocoes_inteligentes.html',
    '/guides/guia6_fidelizar_clientes.html',
    '/guides/guia7_publico_alvo.html',
    '/guides/guia8_reclamacoes.html',
    '/guides/guia9_modo_contador.html',
    '/guides/guia10_mei.html',
    '/guides/guia11_posts_ia.html',
  ],
  en: [
    '/guides/en_guide1_pricing.html',
    '/guides/en_guide2_photos.html',
    '/guides/en_guide3_inventory.html',
    '/guides/en_guide4_sales_script.html',
    '/guides/en_guide5_promotions.html',
    '/guides/en_guide6_retention.html',
    '/guides/en_guide7_target_audience.html',
    '/guides/en_guide8_complaints.html',
    '/guides/en_guide9_accountant.html',
    '/guides/en_guide10_mei.html',
    '/guides/en_guide11_posts_ai.html',
  ],
};

const Academy = () => {
  const t = useT();
  const { lang } = useI18n();

  const files = lang === 'pt' ? guideFiles.pt : guideFiles.en;

  const resources = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => ({
    title: t(`academy.resource${n}_title`),
    desc: t(`academy.resource${n}_desc`),
    file: files[i],
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">{t('academy_shared.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('academy.subtitle')}</p>
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
              <Download className="w-4 h-4" /> {t('academy.download')}
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Academy;
