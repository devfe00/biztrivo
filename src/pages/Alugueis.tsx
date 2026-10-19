import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TextField, SelectField, BusinessState } from '@/components/BusinessFields';
import { useBusinessRecords } from '@/hooks/useBusinessRecords';
import { useBusinessT } from '@/lib/business-i18n';
 import { rentalDistribution } from '@/lib/business';

export default function Alugueis(){
 const t=useBusinessT();const api=useBusinessRecords();const [busy,setBusy]=useState(false);
 const [customer,setCustomer]=useState('');const [phone,setPhone]=useState('');const [description,setDescription]=useState('');const [amount,setAmount]=useState('');
 const [start,setStart]=useState('');const [end,setEnd]=useState('');const [dueDay,setDueDay]=useState('10');const [commission,setCommission]=useState('0');
 const [adjustment,setAdjustment]=useState<'IPCA'|'IGPM'|'manual'>('IPCA');const [month,setMonth]=useState(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`);
 const [rates,setRates]=useState<Record<string,string>>({});
 const [effective,setEffective]=useState<Record<string,string>>({});
 async function act(fn:()=>Promise<void>){setBusy(true);try{await fn();toast.success(t('saved'));}catch{toast.error(t('error'));}finally{setBusy(false);}}
 const rentals=api.records.filter(r=>r.kind==='rental');
 return <div className="space-y-6"><h1 className="font-heading text-2xl font-bold">{t('rentals')}</h1>
 <form className="grid sm:grid-cols-2 gap-4 border-b border-border pb-6" onSubmit={e=>{e.preventDefault();void act(async()=>{await api.save({kind:'rental',customer,phone:phone.replace(/\D/g,''),description,amount:Number(amount),start,end,dueDay:Number(dueDay),commission:Number(commission),adjustment,status:'active',adjustments:[]});setCustomer('');setDescription('');});}}>
 <TextField label={t('customer')} value={customer} onChange={setCustomer}/><TextField label={t('phone')} value={phone} onChange={setPhone}/><TextField label={t('property')} value={description} onChange={setDescription}/><TextField label={t('amount')} value={amount} onChange={setAmount} type="number" min={0.01} step="0.01"/>
 <TextField label={t('start')} value={start} onChange={setStart} type="date"/><TextField label={t('end')} value={end} onChange={setEnd} type="date"/><TextField label={t('dueDay')} value={dueDay} onChange={setDueDay} type="number" min={1} max={28} step="1"/><TextField label={t('commission')} value={commission} onChange={setCommission} type="number" min={0} max={100} step="0.01"/>
 <SelectField label={t('adjustment')} value={adjustment} onChange={v=>setAdjustment(v as typeof adjustment)} options={['IPCA','IGPM','manual'].map(v=>({value:v,label:v}))}/><Button type="submit" disabled={busy||api.loading||api.error} className="justify-self-start self-end">{t('save')}</Button></form>
 <div className="max-w-xs"><TextField label={t('month')} type="month" value={month} onChange={setMonth}/></div><BusinessState loading={api.loading} error={api.error} empty={!rentals.length} t={t}/>
 {rentals.map(r=>r.kind==='rental'&&<article key={r.id} className="border border-border rounded-lg p-4 space-y-4"><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold break-words">{r.description}</h2><p className="text-sm">{r.customer} · {t(r.status)}</p><p className="text-sm text-muted-foreground">{r.start} → {r.end} · {r.adjustment}</p></div><p className="font-bold">R$ {r.amount.toFixed(2)}</p></div>
 <p className="text-sm">{t('owner')}: R$ {rentalDistribution(r.amount,r.commission).owner.toFixed(2)} · {t('fee')}: R$ {rentalDistribution(r.amount,r.commission).fee.toFixed(2)}</p>
 {r.status==='active'&&<><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={()=>void act(()=>api.createRent(r.id,month))}>{t('createRent')}</Button><Button disabled={busy} variant="ghost" onClick={()=>{if(window.confirm(t('confirmCancel')))void act(()=>api.save({...r,status:'ended'},r.id));}}>{t('close')}</Button></div>
 {new Date().getTime()-new Date(r.adjustments.at(-1)?.effective??r.start).getTime()>=365*86400000&&<p className="text-warning text-sm">{t('adjustmentDue')}</p>}
 <div className="flex flex-wrap items-end gap-3"><TextField label={t('applyAdjustment')} value={rates[r.id]??''} onChange={v=>setRates(a=>({...a,[r.id]:v}))} type="number" min={-99.99} max={100} step="0.01" required={false}/><TextField label={t('date')} type="date" value={effective[r.id]??''} onChange={v=>setEffective(a=>({...a,[r.id]:v}))} required={false}/><Button variant="outline" disabled={busy||!rates[r.id]||!effective[r.id]} onClick={()=>{const rate=Number(rates[r.id]);if(!Number.isFinite(rate)||rate<=-100||rate>100||effective[r.id]<r.start||effective[r.id]>r.end){toast.error(t('invalid'));return;}if(window.confirm(`${t('applyAdjustment')}: ${rate}%`))void act(()=>api.save({...r,amount:Math.round(r.amount*(1+rate/100)*100)/100,adjustments:[...r.adjustments,{oldAmount:r.amount,percentage:rate,effective:effective[r.id]}]},r.id));}}>{t('save')}</Button></div></>}
 {r.adjustments.map((a,i)=><p key={i} className="text-xs text-muted-foreground">{t('adjustments')}: {a.effective} · {a.percentage}% · R$ {a.oldAmount.toFixed(2)}</p>)}
 </article>)}</div>;
}