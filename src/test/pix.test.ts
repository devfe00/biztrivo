import { describe, expect, it } from 'vitest';
import { hasError, parsePix } from 'pix-utils';
import { generatePix, normalizePixKey, pixAmountCents, type PixInput } from '@/lib/pix';
const input: PixInput = { keyType:'email', key:'seller@example.com', name:'Loja São João', city:'São Paulo', amount:'50,25', description:'Livro' };
function crc(text:string) { let crc=0xffff; for(const char of text) { crc ^= char.charCodeAt(0)<<8; for(let i=0;i<8;i++) crc=((crc<<1)^((crc&0x8000)?0x1021:0))&0xffff; } return crc.toString(16).toUpperCase().padStart(4,'0'); }
describe('Direct static Pix',()=>{
  it('encodes seller key, BRL amount and reference with independently verified CRC16',()=>{
    const result=generatePix(input,'BIZ123');const parsed=parsePix(result.payload);
    expect(hasError(parsed)).toBe(false);if(hasError(parsed)) throw new Error('Invalid Pix');
    expect(parsed.pixKey).toBe('seller@example.com');expect(parsed.transactionAmount).toBe(50.25);expect(parsed.txid).toBe('BIZ123');expect(parsed.merchantName).toBe('LOJA SAO JOAO');expect(parsed.merchantCity).toBe('SAO PAULO');expect(parsed.transactionCurrency).toBe('986');
    expect(result.payload.slice(-4)).toBe(crc(result.payload.slice(0,-4)));
  });
  it('validates CPF and CNPJ check digits',()=>{expect(normalizePixKey('cpf','529.982.247-25')).toBe('52998224725');expect(normalizePixKey('cnpj','11.222.333/0001-81')).toBe('11222333000181');expect(()=>normalizePixKey('cpf','52998224726')).toThrow();});
  it('requires international phone format and accepts UUID keys',()=>{expect(normalizePixKey('phone','+55 (11) 99999-9999')).toBe('+5511999999999');expect(()=>normalizePixKey('phone','11999999999')).toThrow();expect(normalizePixKey('random','123e4567-e89b-12d3-a456-426614174000')).toBe('123e4567-e89b-12d3-a456-426614174000');});
  it('rejects malformed email and random keys',()=>{expect(()=>normalizePixKey('email','x@')).toThrow();expect(()=>normalizePixKey('random','abc')).toThrow();});
  it('uses cents exactly and rejects zero, negative, exponent and sub-cent values',()=>{expect(pixAmountCents('0,01')).toBe(1);expect(pixAmountCents('100.10')).toBe(10010);for(const amount of ['0','-1','1e3','1.001','1.000,00'])expect(()=>pixAmountCents(amount)).toThrow();});
  it('enforces the 99 byte nested account field for long keys and descriptions',()=>{const key=`${'a'.repeat(65)}@example.com`;expect(key.length).toBe(77);expect(()=>generatePix({...input,key,description:'X'},'BIZ123')).toThrow('description');expect(generatePix({...input,key,description:''},'BIZ123').payload).toContain('2699');});
  it('rejects invalid reference, empty receiver and overlong city',()=>{expect(()=>generatePix(input,'BAD-ID')).toThrow();expect(()=>generatePix({...input,name:''},'BIZ123')).toThrow('name');expect(()=>generatePix({...input,city:'CIDADE MUITO LONGA'},'BIZ123')).toThrow('city');});
});