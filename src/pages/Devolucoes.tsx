import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TextField, SelectField, BusinessState } from '@/components/BusinessFields';
import { useBusinessRecords } from '@/hooks/useBusinessRecords';
import { useBusinessT } from '@/lib/business-i18n';
import { useStore } from '@/contexts/StoreContext';

export default function Devolucoes(){
 const t=useBusinessT();const {refreshData}=useStore();const api=useBusinessRecords();
 const [sales,setSales]=useState<{id:string;description:string;quantity:number;returnedQuantity?:number}[]>([]);const [sale,setSale]=useState('');
 const [qty,setQty]=useState('1');const [reason,setReason]=useState('');const [customer,setCustomer]=useState('');const [description,setDescription]=useState('');const [restock,setRestock]=useState(true);const [busy,setBusy]=useState(false);const [saleError,setSaleError]=useState(false);
 const reload=async()=>{try{setSales(await api.sales());setSaleError(false);}catch{setSaleError(true);}};
 useEffect(()=>{void reload();},[]);
 const returns=api.records.filter(r=>r.kind==='return');
 async function act(fn:()=>Promise<void>){setBusy(true);try{await fn();toast.success(t('saved'));}catch{toast.error(t('error'));}finally{setBusy(false);}}
 return <div className="space-y-6"><h1 className="text-2xl font-heading font-bold">{t('returns')}</h1><section className="space-y-4 border-b border-border pb-6"><h2 className="font-semibold">{t('refund')}</h2>
  <form className="grid sm:grid-cols-2 gap-4" onSubmit={e=>{e.preventDefault();if(window.confirm(t('refundConfirm')))void act(async()=>{await api.refund(sale,Number(qty),restock,reason);await reload();await refreshData();setReason('');});}}>
    <SelectField label={t('sale')} value={sale} onChange={setSale} options={[{value:'',label:t('sale')},...sales.map(s=>({value:s.id,label:`${s.description} (${s.quantity-(s.returnedQuantity??0)})`}))]}/>
    <TextField label={t('quantity')} type="number" min={1} max={(sales.find(s=>s.id===sale)?.quantity??0)-(sales.find(s=>s.id===sale)?.returnedQuantity??0)} step="1" value={qty} onChange={setQty}/>
    <TextField label={t('reason')} value={reason} onChange={setReason}/><label className="flex items-center gap-2 text-sm"><Checkbox checked={restock} onCheckedChange={v=>setRestock(v===true)}/>{t('returnStock')}</label>
    <Button disabled={busy||!sale||saleError} type="submit" className="justify-self-start">{t('refund')}</Button>
  </form>{saleError?<p role="alert" className="text-destructive">{t('error')}</p>:!sales.length&&<p className="text-muted-foreground text-sm">{t('noSale')}</p>}</section>
  <section className="space-y-4"><h2 className="font-semibold">{t('exchange')}</h2><p className="text-sm text-muted-foreground">{t('returnNote')}</p>
   <form className="grid sm:grid-cols-2 gap-4" onSubmit={e=>{e.preventDefault();void act(async()=>{await api.save({kind:'return',customer,description,reason,status:'requested'});setCustomer('');setDescription('');});}}><TextField label={t('customer')} value={customer} onChange={setCustomer}/><TextField label={t('description')} value={description} onChange={setDescription}/><TextField label={t('reason')} value={reason} onChange={setReason}/><Button type="submit" disabled={busy||api.error||api.loading} className="self-end justify-self-start">{t('save')}</Button></form>
   <BusinessState loading={api.loading} error={api.error} empty={!returns.length} t={t}/>{returns.map(r=>r.kind==='return'&&<article className="border border-border rounded-lg p-4 flex flex-wrap gap-3 justify-between" key={r.id}><div><h3 className="font-semibold break-words">{r.customer}</h3><p className="text-sm break-words">{r.description} · {r.reason}</p><p className="text-sm text-muted-foreground">{t(r.status)}</p></div><div className="flex gap-2">{r.status==='requested'&&<Button disabled={busy} variant="outline" onClick={()=>void act(()=>api.save({...r,status:'approved'},r.id))}>{t('approved')}</Button>}{r.status==='approved'&&<Button disabled={busy} onClick={()=>void act(()=>api.save({...r,status:'completed'},r.id))}>{t('completed')}</Button>}{!['completed','cancelled'].includes(r.status)&&<Button disabled={busy} variant="ghost" onClick={()=>{if(window.confirm(t('confirmCancel')))void act(()=>api.save({...r,status:'cancelled'},r.id));}}>{t('cancel')}</Button>}</div></article>)}
  </section></div>;
}