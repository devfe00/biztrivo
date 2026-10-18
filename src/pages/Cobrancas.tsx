import { useState } from 'react';
import { MessageCircle, Check, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TextField, BusinessState } from '@/components/BusinessFields';
import { useBusinessRecords } from '@/hooks/useBusinessRecords';
import { useBusinessT } from '@/lib/business-i18n';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/lib/i18n';
import type { BusinessRecord } from '@/lib/business';

export default function Cobrancas() {
  const t=useBusinessT(); const {lang}=useI18n(); const {config,refreshData}=useStore();
  const {records,loading,error,createInstallments,settle,save}=useBusinessRecords();
  const [customer,setCustomer]=useState(''); const [phone,setPhone]=useState(''); const [description,setDescription]=useState('');
  const [amount,setAmount]=useState(''); const [due,setDue]=useState(''); const [count,setCount]=useState('1'); const [busy,setBusy]=useState(false);
  const charges=records.filter((r):r is Extract<BusinessRecord,{kind:'receivable'}>=>r.kind==='receivable').sort((a,b)=>a.due.localeCompare(b.due));
  const fmt=(v:number)=>v.toLocaleString({pt:'pt-BR',en:'en-US',es:'es-ES',fr:'fr-FR'}[lang],{style:'currency',currency:'BRL'});
  const today=new Date().toLocaleDateString('en-CA');
  const pending=charges.filter(r=>r.status==='pending');
  async function act(fn:()=>Promise<void>) {setBusy(true);try {await fn();toast.success(t('saved'));}catch {toast.error(t('error'));}finally{setBusy(false);}}
  function receipt(r:Extract<BusinessRecord,{kind:'receivable'}>){
    const pdf=new jsPDF();pdf.setFontSize(18);pdf.text(`${config.storeName} | ${t('receipt')}`,14,20);pdf.setFontSize(11);
    pdf.text([`${t('receivedFrom')}: ${r.customer}`,r.description,`${t('amount')}: ${fmt(r.amount)}`,`${t('due')}: ${r.due}`,`${t('status')}: ${t('paid')}`,`ID: ${r.id}`,t('notOfficial')],14,35);pdf.save(`recibo-${r.id}.pdf`);
  }
  return <div className="space-y-6"><h1 className="font-heading text-2xl font-bold">{t('receivable')}</h1>
    <div className="grid sm:grid-cols-2 gap-4 border-y border-border py-4"><div><p className="text-muted-foreground text-sm">{t('total')}</p><p className="text-2xl font-bold">{fmt(pending.reduce((s,r)=>s+r.amount,0))}</p></div><div><p className="text-muted-foreground text-sm">{t('overdue')}</p><p className="text-2xl font-bold text-destructive">{fmt(pending.filter(r=>r.due<today).reduce((s,r)=>s+r.amount,0))}</p></div></div>
    <form className="grid sm:grid-cols-2 gap-4" onSubmit={e=>{e.preventDefault();void act(async()=>{await createInstallments({kind:'receivable',customer,phone:phone.replace(/\D/g,''),description,amount:Number(amount),due,status:'pending'},Number(count));setCustomer('');setDescription('');setAmount('');});}}>
      <TextField label={t('customer')} value={customer} onChange={setCustomer}/><TextField label={t('phone')} value={phone} onChange={setPhone}/>
      <TextField label={t('description')} value={description} onChange={setDescription}/><TextField label={t('amount')} type="number" min={0.01} step="0.01" value={amount} onChange={setAmount}/>
      <TextField label={t('due')} type="date" value={due} onChange={setDue}/><TextField label={t('installments')} type="number" min={1} max={24} step="1" value={count} onChange={setCount}/>
      <Button disabled={busy||loading||error} className="sm:col-span-2 justify-self-start" type="submit">{t('save')}</Button>
    </form><p className="text-sm text-muted-foreground">{t('notice')}</p>
    <BusinessState loading={loading} error={error} empty={!charges.length} t={t}/>
    <div className="space-y-3">{charges.map(r=><article key={r.id} className="border border-border rounded-lg p-4 flex flex-wrap justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold break-words">{r.customer}</h2><p className="text-sm break-words">{r.description}</p><p className="text-sm text-muted-foreground">{r.due} · {fmt(r.amount)} · {t(r.status)}</p></div><div className="flex flex-wrap items-center gap-2">
      {r.status==='pending'&&<><Button variant="outline" size="sm" asChild><a href={`https://wa.me/${r.phone}?text=${encodeURIComponent(t('message',{name:r.customer,description:r.description,amount:fmt(r.amount),due:r.due,store:config.storeName}))}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-2"/>{t('reminder')}</a></Button><Button disabled={busy} size="sm" onClick={()=>{if(window.confirm(t('paymentConfirm')))void act(async()=>{await settle(r.id);await refreshData();});}}><Check className="w-4 h-4 mr-2"/>{t('paid')}</Button><Button disabled={busy} size="sm" variant="ghost" onClick={()=>{if(window.confirm(t('confirmCancel')))void act(()=>save({...r,status:'cancelled'},r.id));}}>{t('cancel')}</Button></>}
      {r.status==='paid'&&<Button size="sm" variant="outline" onClick={()=>receipt(r)}><Download className="w-4 h-4 mr-2"/>{t('receipt')}</Button>}
    </div></article>)}</div>
  </div>;
}