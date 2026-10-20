import { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FiscalInput } from '@/components/FiscalFields';
import { useStore } from '@/contexts/StoreContext';
import { validateDas, OFFICIAL_PORTALS } from '@/lib/fiscal';

export default function DasMei() {
  const {config}=useStore(); const [cnpj,setCnpj]=useState(''); const [month,setMonth]=useState(''); const [error,setError]=useState(false);
  // MEI tools intentionally remain Portuguese-only, independent of interface language.
  function open() {
    try {validateDas(cnpj,month);setError(false);window.open(OFFICIAL_PORTALS.das,'_blank','noopener,noreferrer');}
    catch {setError(true);}
  }
  if(config.paisBase!=='BR') return <p className="text-muted-foreground">Disponível para operações no Brasil.</p>;
  return <div className="space-y-6"><h1 className="font-heading text-2xl font-bold flex gap-2 items-center"><FileText className="text-primary"/>DAS do MEI</h1>
    <p className="text-sm text-muted-foreground border-y border-border py-4">O DAS e seu Pix são gerados somente no PGMEI oficial. A Biztrivo não emite a guia, não calcula multas oficiais e não confirma pagamento.</p>
    <form onSubmit={e=>{e.preventDefault();open();}} className="grid sm:grid-cols-2 gap-4">
      <FiscalInput label="CNPJ do MEI" value={cnpj} onChange={v=>{setCnpj(v);setError(false);}} maxLength={18}/>
      <FiscalInput label="Competência" type="month" value={month} onChange={v=>{setMonth(v);setError(false);}}/>
      {error&&<p role="alert" className="text-destructive text-sm sm:col-span-2">Confira o CNPJ e a competência informados.</p>}
      <Button className="justify-self-start sm:col-span-2" type="submit"><ExternalLink/>Pagar DAS do Mês</Button>
    </form>
    <ol className="list-decimal pl-5 space-y-3 text-sm"><li>Entre no PGMEI com seu CNPJ. O site oficial é da Receita Federal.</li><li>Escolha “Emitir Guia de Pagamento (DAS)”, o ano e a competência desejada.</li><li>Gere a guia e copie o Pix disponibilizado pelo portal, se disponível. Confira o valor e o destinatário antes de pagar.</li></ol>
    <p className="text-xs text-muted-foreground">CNPJ e competência não são enviados ao portal automaticamente nem salvos na sua conta. Não informe senha gov.br na Biztrivo.</p>
    <Button variant="link" asChild><a href={OFFICIAL_PORTALS.das} target="_blank" rel="noopener noreferrer">Acessar PGMEI oficial</a></Button>
  </div>;
}