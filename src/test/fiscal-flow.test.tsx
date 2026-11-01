import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n';
import NotasFiscais from '@/pages/NotasFiscais';
import DasMei from '@/pages/DasMei';
import Pagamentos from '@/pages/Pagamentos';
import { OFFICIAL_PORTALS } from '@/lib/fiscal';

vi.mock('@/contexts/StoreContext',()=>({useStore:()=>({config:{paisBase:'BR'}})}));
const copy=vi.fn();
beforeEach(()=>{cleanup();vi.restoreAllMocks();copy.mockReset();copy.mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copy}});localStorage.setItem('biztrivo:lang','pt');});
function fill(values:Record<string,string>){for(const [label,value] of Object.entries(values))fireEvent.change(screen.getByLabelText(label),{target:{value}});}
describe('Assisted fiscal and payment flows',()=>{
  it('copies validated service details but does not send an invoice to an API',async()=>{
    const fetch=vi.spyOn(globalThis,'fetch');render(<I18nProvider><NotasFiscais/></I18nProvider>);
    fill({'CNPJ do emitente':'11222333000181','Nome do cliente':'Cliente teste','CPF/CNPJ do cliente':'52998224725','Município':'São Paulo','Data da prestação':'2026-10-20','Descrição':'Serviço de reparo','Código de tributação nacional (6 dígitos)':'010101','Valor (R$)':'125.50'});
    fireEvent.click(screen.getByRole('button',{name:'Copiar dados'}));await waitFor(()=>expect(copy).toHaveBeenCalled());expect(copy.mock.calls[0][0]).toContain('125,50');expect(fetch).not.toHaveBeenCalled();
  });
  it('opens official PGMEI without CNPJ or competence in URL',()=>{
    const open=vi.spyOn(window,'open').mockReturnValue(null);render(<DasMei/>);fill({'CNPJ do MEI':'11222333000181','Competência':'2026-10'});fireEvent.click(screen.getByRole('button',{name:'Pagar DAS do Mês'}));expect(open).toHaveBeenCalledWith(OFFICIAL_PORTALS.das,'_blank','noopener,noreferrer');
  });
  it('prepares a payment draft without contacting a provider or claiming settlement',()=>{
    const fetch=vi.spyOn(globalThis,'fetch');render(<I18nProvider><Pagamentos/></I18nProvider>);fill({'Nome do cliente':'Cliente teste','CPF/CNPJ do cliente':'52998224725','E-mail do cliente':'test@example.com','Descrição':'Livro','Valor (R$)':'50','Vencimento':'2026-10-20'});fireEvent.click(screen.getByRole('button',{name:'Preparar cobrança'}));const draft=JSON.parse((screen.getByLabelText('Dados para conferência') as HTMLTextAreaElement).value);expect(draft.status).toBe('draft_not_submitted');expect(draft.amount).toBe(50);expect(draft.method).toBe('pix');expect(fetch).not.toHaveBeenCalled();
  });
});