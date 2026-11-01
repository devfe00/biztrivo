import { describe, it, expect } from 'vitest';
import { validTaxId, serviceDraftSchema, goodsDraftSchema, goodsTotal, validateDas, paymentDraftSchema } from '@/lib/fiscal';

const service={customer:'Cliente teste',taxId:'52998224725',issuerCnpj:'11222333000181',description:'Serviço',amount:100.25,serviceCode:'010101',date:'2026-10-20',city:'São Paulo',state:'SP'};
describe('Fiscal preparation validation',()=>{
  it('validates CPF check digits and rejects a changed digit',()=>{expect(validTaxId('529.982.247-25')).toBe(true);expect(validTaxId('52998224726')).toBe(false);expect(validTaxId('11111111111')).toBe(false);});
  it('supports numeric and 2026 alphanumeric CNPJ check digits',()=>{expect(validTaxId('11.222.333/0001-81')).toBe(true);expect(validTaxId('12.ABC.345/01DE-35')).toBe(true);expect(validTaxId('12ABC34501DE36')).toBe(false);});
  it('requires six-digit national service code rather than seven-digit CNAE',()=>{expect(serviceDraftSchema.safeParse(service).success).toBe(true);expect(serviceDraftSchema.safeParse({...service,serviceCode:'1234567'}).success).toBe(false);});
  it('rejects nonexistent calendar dates',()=>{expect(serviceDraftSchema.safeParse({...service,date:'2026-02-30'}).success).toBe(false);});
  it('requires a CNPJ, not a CPF, for the issuer',()=>{expect(serviceDraftSchema.safeParse({...service,issuerCnpj:'52998224725'}).success).toBe(false);});
  it('computes product totals in cents and rejects fractional unit counts',()=>{const items=[{description:'Livro',quantity:3,unitPrice:10.1,ncm:''}];expect(goodsTotal(items)).toBe(30.3);expect(()=>goodsTotal([{...items[0],quantity:1.5}])).toThrow();});
  it('requires eight-digit NCM if provided without treating it as verified classification',()=>{const goods={...service,address:'Rua 1',postalCode:'01001000',items:[{description:'Livro',quantity:1,unitPrice:10,ncm:'49019900'}]};expect(goodsDraftSchema.safeParse(goods).success).toBe(true);expect(goodsDraftSchema.safeParse({...goods,items:[{...goods.items[0],ncm:'123'}]}).success).toBe(false);});
  it('validates DAS competence without generating a tax payment',()=>{expect(validateDas('11222333000181','2026-10').competence).toBe('2026-10');expect(()=>validateDas('11222333000181','2026-13')).toThrow();});
  it('rejects client-supplied receiver or confirmed status in payment drafts',()=>{const draft={customer:'Cliente',taxId:'52998224725',email:'test@example.com',description:'Livro',amount:10,method:'pix',due:'2026-10-20'};expect(paymentDraftSchema.safeParse(draft).success).toBe(true);expect(paymentDraftSchema.safeParse({...draft,status:'approved'}).success).toBe(false);expect(paymentDraftSchema.safeParse({...draft,receiverId:'another-seller'}).success).toBe(false);});
  it('rejects negative payments and sub-cent amounts',()=>{expect(serviceDraftSchema.safeParse({...service,amount:-1}).success).toBe(false);expect(serviceDraftSchema.safeParse({...service,amount:1.001}).success).toBe(false);});
});