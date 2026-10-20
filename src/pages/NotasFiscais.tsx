import { useState } from 'react';
import { Copy, ExternalLink, Plus, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FiscalInput, StateField, FiscalPreview } from '@/components/FiscalFields';
import { useStore } from '@/contexts/StoreContext';
import { useFiscalT } from '@/lib/fiscal-i18n';
import { serviceDraftSchema, goodsDraftSchema, goodsTotal, brl, OFFICIAL_PORTALS } from '@/lib/fiscal';

const newItem = () => ({id:crypto.randomUUID(),description:'',quantity:'1',unitPrice:'',ncm:''});
const initial = {customer:'',taxId:'',issuerCnpj:'',description:'',amount:'',serviceCode:'',date:'',city:'',state:'SP',address:'',postalCode:''};
export default function NotasFiscais() {
  const t=useFiscalT(); const {config}=useStore(); const [mode,setMode]=useState('services');
  const [fields,setFields]=useState(initial); const [items,setItems]=useState([newItem()]); const [preview,setPreview]=useState(''); const [error,setError]=useState(false);
  function field(key:keyof typeof initial,value:string) {setFields(f=>({...f,[key]:value}));setPreview('');setError(false);}
  function changeItem(id:string,key:'description'|'quantity'|'unitPrice'|'ncm',value:string) {setItems(old=>old.map(i=>i.id===id?{...i,[key]:value}:i));setPreview('');setError(false);}
  const goodsLink=fields.state==='RS'?'https://atendimento.receita.rs.gov.br/como-preencher-e-emitir-nota-fiscal-avulsa-nfa-e-sendo-um-mei':fields.state==='SC'?'https://www.sef.sc.gov.br/orientacoes/nff-nota-fiscal-facil-mei-microempreendedor-individual':'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/nota-fiscal';
  async function prepare() {
    try {
      let value='';
      if(mode==='services') {
        const d=serviceDraftSchema.parse({...fields,amount:Number(fields.amount)});
        value=[t('serviceNotice'),'',`${t('issuer')}: ${d.issuerCnpj}`,`${t('customer')}: ${d.customer}`,`${t('taxId')}: ${d.taxId}`,`${t('date')}: ${d.date}`,`${t('city')}: ${d.city} / ${d.state}`,`${t('code')}: ${d.serviceCode}`,`${t('description')}: ${d.description}`,`${t('amount')}: ${brl(d.amount)}`].join('\n');
      } else {
        const d=goodsDraftSchema.parse({...fields,items:items.map(i=>({...i,quantity:Number(i.quantity),unitPrice:Number(i.unitPrice)}))});
        value=[t('goodsNotice'),'',`${t('issuer')}: ${d.issuerCnpj}`,`${t('state')}: ${d.state}`,`${t('customer')}: ${d.customer}`,`${t('taxId')}: ${d.taxId}`,`${t('address')}: ${d.address}`,`${t('city')}: ${d.city}`,`${t('postal')}: ${d.postalCode}`,...d.items.map(i=>`${i.description} | ${i.quantity} × ${brl(i.unitPrice)}${i.ncm?` | NCM: ${i.ncm}`:''}`),`${t('total')}: ${brl(goodsTotal(d.items as {description:string;quantity:number;unitPrice:number;ncm:string}[]))}`].join('\n');
      }
      setError(false);setPreview(value);
      try {await navigator.clipboard.writeText(value);toast.success(t('copied'));} catch {toast.error(t('clipboard'));}
    } catch {setPreview('');setError(true);}
  }
  if(config.paisBase!=='BR') return <p className="text-muted-foreground">{t('brazil')}</p>;
  return <div className="space-y-6">
    <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><FileText className="text-primary"/>{t('fiscal')}</h1>
    <Tabs value={mode} onValueChange={v=>{setMode(v);setPreview('');setError(false);}}>
      <TabsList className="w-full sm:w-auto"><TabsTrigger className="flex-1" value="services">{t('services')}</TabsTrigger><TabsTrigger className="flex-1" value="goods">{t('goods')}</TabsTrigger></TabsList>
      <TabsContent value="services"><p className="text-sm text-muted-foreground border-y border-border py-4">{t('serviceNotice')}</p></TabsContent>
      <TabsContent value="goods"><p className="text-sm text-muted-foreground border-y border-border py-4">{t('goodsNotice')}</p></TabsContent>
    </Tabs>
    <form className="space-y-4" onSubmit={e=>{e.preventDefault();void prepare();}}>
      <div className="grid sm:grid-cols-2 gap-4">
        <FiscalInput label={t('issuer')} value={fields.issuerCnpj} onChange={v=>field('issuerCnpj',v)} maxLength={18}/>
        <StateField value={fields.state} onChange={v=>field('state',v)}/>
        <FiscalInput label={t('customer')} value={fields.customer} onChange={v=>field('customer',v)}/>
        <FiscalInput label={t('taxId')} value={fields.taxId} onChange={v=>field('taxId',v)} maxLength={18}/>
        <FiscalInput label={t('city')} value={fields.city} onChange={v=>field('city',v)}/>
        {mode==='services'?<><FiscalInput label={t('date')} value={fields.date} onChange={v=>field('date',v)} type="date"/><FiscalInput label={t('description')} value={fields.description} onChange={v=>field('description',v)}/><FiscalInput label={t('code')} value={fields.serviceCode} onChange={v=>field('serviceCode',v)} maxLength={6}/><FiscalInput label={t('amount')} value={fields.amount} onChange={v=>field('amount',v)} type="number"/></>:<><FiscalInput label={t('address')} value={fields.address} onChange={v=>field('address',v)}/><FiscalInput label={t('postal')} value={fields.postalCode} onChange={v=>field('postalCode',v)} maxLength={8}/></>}
      </div>
      {mode==='goods'&&<section className="space-y-4 border-y border-border py-4">{items.map((item,index)=><div key={item.id} className="grid sm:grid-cols-2 gap-3">
        <FiscalInput label={`${t('item')} ${index+1}`} value={item.description} onChange={v=>changeItem(item.id,'description',v)}/>
        <FiscalInput label={`${t('quantity')} ${index+1}`} type="number" value={item.quantity} onChange={v=>changeItem(item.id,'quantity',v)}/>
        <FiscalInput label={`${t('price')} ${index+1}`} type="number" value={item.unitPrice} onChange={v=>changeItem(item.id,'unitPrice',v)}/>
        <FiscalInput label={`${t('ncm')} ${index+1}`} value={item.ncm} onChange={v=>changeItem(item.id,'ncm',v)} maxLength={8} optional/>
        <Button aria-label={`${t('remove')} ${index+1}`} title={t('remove')} size="icon" type="button" variant="ghost" disabled={items.length===1} onClick={()=>{setItems(old=>old.filter(i=>i.id!==item.id));setPreview('');}}><Trash2/></Button>
      </div>)}<Button type="button" variant="outline" disabled={items.length>=100} onClick={()=>{setItems(old=>[...old,newItem()]);setPreview('');}}><Plus/>{t('add')}</Button></section>}
      {error&&<p role="alert" className="text-sm text-destructive">{t('invalid')}</p>}
      <div className="flex flex-wrap gap-2"><Button type="submit"><Copy/>{t('copy')}</Button><Button type="button" variant="ghost" onClick={()=>{setFields(initial);setItems([newItem()]);setPreview('');setError(false);}}>{t('clear')}</Button></div>
    </form>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" asChild><a target="_blank" rel="noopener noreferrer" href={mode==='services'?OFFICIAL_PORTALS.nfse:goodsLink} className="whitespace-normal h-auto min-h-10"><ExternalLink/>{t(mode==='services'?'openService':'openGoods')}</a></Button>
      {mode==='services'&&<Button variant="ghost" asChild><a href={OFFICIAL_PORTALS.mobile} target="_blank" rel="noopener noreferrer"><ExternalLink/>{t('mobile')}</a></Button>}
    </div>
    <FiscalPreview value={preview}/><p className="text-xs text-muted-foreground">{t('privacy')}</p>
  </div>;
}