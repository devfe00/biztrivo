import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n';
import Cobrancas from '@/pages/Cobrancas';
import OwnerPayments from '@/components/OwnerPayments';
import Comandas from '@/pages/Comandas';
const state=vi.hoisted(()=>({ createInstallments:vi.fn(),save:vi.fn(),settle:vi.fn(),addTransaction:vi.fn(),records:[] as any[] }));
vi.mock('@/hooks/useBusinessRecords',()=>({useBusinessRecords:()=>({records:state.records,loading:false,error:false,createInstallments:state.createInstallments,settle:state.settle,save:state.save})}));
vi.mock('@/contexts/StoreContext',()=>({useStore:()=>({config:{storeName:'Loja'},refreshData:vi.fn(),addTransaction:state.addTransaction})}));
beforeEach(()=>{cleanup();vi.clearAllMocks();state.records=[];localStorage.setItem('biztrivo:lang','pt');});
describe('Commercial forms',()=>{
 it('passes the total debt and chosen monthly installments, not a multiplied total',async()=>{
  render(<I18nProvider><Cobrancas/></I18nProvider>);
  for(const [label,value] of [['Cliente','Ana'],['WhatsApp com código do país','5511999999999'],['Descrição','Compra'],['Valor','100'],['Vencimento','2026-10-20'],['Parcelas','3']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
  fireEvent.click(screen.getByRole('button',{name:'Salvar'}));
  await waitFor(()=>expect(state.createInstallments).toHaveBeenCalledWith(expect.objectContaining({amount:100,phone:'5511999999999',status:'pending'}),3));
 });
 it('records owner distributions as personal outflows, not operating costs',async()=>{
  render(<OwnerPayments/>);fireEvent.change(screen.getByLabelText('Tipo de retirada'),{target:{value:'Distribuição de lucros'}});fireEvent.change(screen.getByLabelText('Valor da retirada'),{target:{value:'250'}});fireEvent.change(screen.getByLabelText('Data da retirada'),{target:{value:'2026-10-20'}});fireEvent.click(screen.getByRole('button',{name:'Registrar retirada'}));
  await waitFor(()=>expect(state.addTransaction).toHaveBeenCalledWith(expect.objectContaining({type:'saida',value:250,category:'Distribuição de lucros',isPersonal:true})));
 });
 it('advances an order to preparing without claiming payment',async()=>{
  state.records=[{id:'o',kind:'order',customer:'Mesa 1',description:'Pizza',amount:40,status:'new'}];render(<I18nProvider><Comandas/></I18nProvider>);fireEvent.click(screen.getByRole('button',{name:'Avançar'}));
  await waitFor(()=>expect(state.save).toHaveBeenCalledWith(expect.objectContaining({status:'preparing'}),'o'));expect(state.addTransaction).not.toHaveBeenCalled();
 });
});