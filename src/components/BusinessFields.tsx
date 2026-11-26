import { type ReactNode, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { blockInvalidNumberKeys } from '@/lib/inputMask';
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 min-w-0 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}
export function TextField({label, value, onChange, type='text', min, max, step, required=true, inputMode, onKeyDown}: {label:string;value:string|number;onChange:(v:string)=>void;type?:string;min?:number;max?:number;step?:string;required?:boolean;inputMode?:'text'|'decimal'|'numeric'|'tel'|'email';onKeyDown?:(e:KeyboardEvent<HTMLInputElement>)=>void}) {
  return <Field label={label}><Input aria-label={label} type={type} value={value} onChange={e=>onChange(e.target.value)} min={min} max={max} step={step} required={required} maxLength={type==='text'?160:undefined} inputMode={inputMode ?? (type === 'number' ? 'decimal' : undefined)} onKeyDown={onKeyDown ?? (type === 'number' ? blockInvalidNumberKeys : undefined)}/></Field>;
}
export function SelectField({label,value,onChange,options}: {label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}) {
  return <Field label={label}><select aria-label={label} className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full" value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>;
}
export function BusinessState({loading,error,empty,t}: {loading:boolean;error:boolean;empty:boolean;t:(key:'loading'|'error'|'empty')=>string}) {
  return loading||error||empty ? <p role={error?'alert':undefined} className={error?'text-destructive':'text-muted-foreground'}>{t(error?'error':loading?'loading':'empty')}</p> : null;
}