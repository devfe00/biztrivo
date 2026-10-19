import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TextField, SelectField } from '@/components/BusinessFields';
import { useStore } from '@/contexts/StoreContext';

export default function OwnerPayments(){
 const {addTransaction}=useStore();const [kind,setKind]=useState('Pró-labore');const [amount,setAmount]=useState('');const [date,setDate]=useState('');const [busy,setBusy]=useState(false);
 return <section className="space-y-3 border-b border-border pb-6"><h2 className="font-heading text-xl font-semibold">Remuneração do titular</h2>
 <form className="grid sm:grid-cols-3 gap-3" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);try{const value=Number(amount);const d=new Date(`${date}T12:00:00`);if(!Number.isFinite(value)||value<=0||!Number.isFinite(d.getTime()))throw new Error('Invalid');await addTransaction({type:'saida',value,description:kind,category:kind,isPersonal:true,date:d.toISOString()});setAmount('');toast.success('Retirada registrada no Caixa.');}catch{toast.error('Não foi possível registrar a retirada.');}finally{setBusy(false);}}}>
 <SelectField label="Tipo de retirada" value={kind} onChange={setKind} options={['Pró-labore','Distribuição de lucros','Pessoal'].map(v=>({value:v,label:v}))}/><TextField label="Valor da retirada" type="number" min={0.01} step="0.01" value={amount} onChange={setAmount}/><TextField label="Data da retirada" type="date" value={date} onChange={setDate}/><Button type="submit" disabled={busy} className="justify-self-start">Registrar retirada</Button>
 </form><p className="text-xs text-muted-foreground">Registra a saída financeira separadamente de despesas operacionais. Encargos de pró-labore, folha e IRPF precisam de apuração específica; este registro não calcula nem recolhe tributos.</p></section>;
}