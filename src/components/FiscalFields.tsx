import { Input } from '@/components/ui/input';
import { useFiscalT } from '@/lib/fiscal-i18n';
import { BRAZIL_STATES } from '@/lib/fiscal';

export function FiscalInput({label,value,onChange,type='text',maxLength=160,optional=false}: {label:string;value:string;onChange:(v:string)=>void;type?:string;maxLength?:number;optional?:boolean}) {
  return <label className="grid gap-1.5 min-w-0 text-sm"><span className="font-medium">{label}</span><Input aria-label={label} value={value} onChange={e=>onChange(e.target.value)} type={type} maxLength={maxLength} required={!optional} min={type==='number'?0.01:undefined} step={type==='number'?'0.01':undefined}/></label>;
}
export function StateField({value,onChange}: {value:string;onChange:(v:string)=>void}) {
  const t=useFiscalT(); return <label className="grid gap-1.5 text-sm"><span className="font-medium">{t('state')}</span><select aria-label={t('state')} className="h-10 rounded-md border border-input bg-background px-3" value={value} onChange={e=>onChange(e.target.value)}>{BRAZIL_STATES.map(s=><option key={s}>{s}</option>)}</select></label>;
}
export function FiscalPreview({value}: {value:string}) { const t=useFiscalT(); return value ? <section className="space-y-2 border-t border-border pt-4"><h2 className="font-semibold">{t('notes')}</h2><textarea aria-label={t('notes')} readOnly value={value} className="w-full min-h-64 rounded-md border border-input bg-muted p-3 text-sm"/></section> : null; }