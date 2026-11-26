import { Copy, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useStore } from '@/contexts/StoreContext';
import { OFFICIAL_PORTALS } from '@/lib/fiscal';

export default function DasMei() {
  const { config } = useStore();
  const copyCnpj = async () => {
    try {
      await navigator.clipboard.writeText(config.cnpj);
      toast.success('CNPJ copiado');
    } catch {
      toast.error('Não foi possível copiar. Selecione e copie manualmente.');
    }
  };
  if(config.paisBase!=='BR') return <p className="text-muted-foreground">Disponível para operações no Brasil.</p>;
  return <div className="space-y-6"><h1 className="font-heading text-2xl font-bold flex gap-2 items-center"><FileText className="text-primary"/>DAS do MEI</h1>
    <p className="text-sm text-muted-foreground border-y border-border py-4">O DAS e seu Pix são gerados somente no PGMEI oficial. A Biztrivo não emite a guia, não calcula multas oficiais e não confirma pagamento.</p>
        <div className="flex flex-wrap items-center gap-3">
      <Button asChild>
        <a href={OFFICIAL_PORTALS.das} target="_blank" rel="noopener noreferrer"><ExternalLink />Abrir PGMEI oficial</a>
      </Button>
      {config.cnpj && (
        <Button type="button" variant="outline" onClick={copyCnpj}><Copy />Copiar meu CNPJ</Button>
      )}
    </div>
    <ol className="list-decimal pl-5 space-y-3 text-sm">...(mantém igual)...</ol>
    <p className="text-xs text-muted-foreground">Nenhum dado é enviado ao portal automaticamente. Não informe senha gov.br na Biztrivo.</p>
  </div>;
}