import { useState } from 'react';
import { Download, Wallet, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FiscalInput, FiscalPreview } from '@/components/FiscalFields';
import { useStore } from '@/contexts/StoreContext';
import { useFiscalT } from '@/lib/fiscal-i18n';
import { paymentDraftSchema } from '@/lib/fiscal';

const initial={customer:'',taxId:'',email:'',description:'',amount:'',method:'pix',due:''};
export default function Pagamentos() {
  const t=useFiscalT();const {config}=useStore();const [fields,setFields]=useState(initial);const [preview,setPreview]=useState('');const [error,setError]=useState(false);
  function field(key:keyof typeof initial,value:string) {setFields(old=>({...old,[key]:value}));setPreview('');setError(false);}
  function prepare() {
    const result=paymentDraftSchema.safeParse({...fields,amount:Number(fields.amount)});
    if(!result.success){setError(true);setPreview('');return;}
    setError(false);setPreview(JSON.stringify({schemaVersion:1,status:'draft_not_submitted',currency:'BRL',...result.data},null,2));
  }
  function download() {
    if(!preview)return;
    const url=URL.createObjectURL(new Blob([preview],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='solicitacao-cobranca-rascunho.json';link.click();URL.revokeObjectURL(url);
  }
  if(config.paisBase!=='BR')return <p className="text-muted-foreground">{t('brazil')}</p>;
  return <div className="space-y-6"><h1 className="font-heading text-2xl font-bold flex gap-2 items-center"><Wallet className="text-primary"/>{t('payments')}</h1>
    <section className="border-y border-border py-4 space-y-3"><p className="inline-flex gap-2 items-center text-sm font-medium"><ShieldCheck className="w-4 h-4 text-primary"/>{t('pending')}</p><p className="text-sm text-muted-foreground">{t('paymentNotice')}</p><p role="status" className="text-sm text-muted-foreground">{t('blocked')}</p></section>
    <form onSubmit={e=>{e.preventDefault();prepare();}} className="space-y-4"><div className="grid sm:grid-cols-2 gap-4">
      <FiscalInput label={t('customer')} value={fields.customer} onChange={v=>field('customer',v)}/><FiscalInput label={t('taxId')} value={fields.taxId} onChange={v=>field('taxId',v)} maxLength={18}/>
      <FiscalInput label={t('email')} value={fields.email} onChange={v=>field('email',v)} type="email" maxLength={255}/><FiscalInput label={t('description')} value={fields.description} onChange={v=>field('description',v)}/>
      <FiscalInput label={t('amount')} value={fields.amount} onChange={v=>field('amount',v)} type="number"/><FiscalInput label={t('due')} value={fields.due} onChange={v=>field('due',v)} type="date"/>
      <label className="grid gap-1.5 text-sm"><span className="font-medium">{t('method')}</span><select aria-label={t('method')} value={fields.method} onChange={e=>field('method',e.target.value)} className="h-10 border border-input bg-background rounded-md px-3"><option value="pix">Pix</option><option value="boleto">Boleto</option></select></label>
    </div>{error&&<p role="alert" className="text-sm text-destructive">{t('invalid')}</p>}<div className="flex flex-wrap gap-2"><Button type="submit">{t('prepare')}</Button><Button type="button" variant="ghost" onClick={()=>{setFields(initial);setPreview('');setError(false);}}>{t('clear')}</Button></div></form>
    {preview&&<><p role="status" className="text-sm font-medium">{t('ready')}</p><Button variant="outline" onClick={download}><Download/>{t('download')}</Button><FiscalPreview value={preview}/></>}
    <p className="text-xs text-muted-foreground">{t('privacy')}</p>
  </div>;
}