import { describe, it, expect } from 'vitest';
import { installmentSchedule, meiSummary, profitEstimate, recipeCost, rentalDistribution, restoreInventory, returnAmount, validateOperation } from '@/lib/business';
describe('Commercial rules',()=>{
 it('uses R$81,000 for an ordinary full-year MEI',()=>expect(meiSummary([],2026,'2025-01-01',0).limit).toBe(81000));
 it('includes the opening month in the proportional MEI ceiling',()=>expect(meiSummary([],2026,'2026-10-18',0).limit).toBe(20250));
 it('excludes personal receipts and non-sale cash entries from the advisory sales preview',()=>{
   const base={value:100,date:'2026-10-01',isPersonal:false,category:'Venda',type:'entrada'};
   expect(meiSummary([base,{...base,isPersonal:true},{...base,category:'Aporte'},{...base,type:'saida'}],2026,'',0).revenue).toBe(100);
 });
 it('rejects a service share above sales',()=>expect(()=>meiSummary([],2026,'',1)).toThrow());
 it('preserves exact installment totals',()=>expect(installmentSchedule(100,'2026-01-31',3).map(i=>i.amount)).toEqual([33.34,33.33,33.33]));
 it('clamps monthly installments to calendar month ends',()=>expect(installmentSchedule(90,'2026-01-31',3).map(i=>i.due)).toEqual(['2026-01-31','2026-02-28','2026-03-31']));
 it('rejects impossible calendar dates',()=>expect(()=>installmentSchedule(90,'2026-02-31',3)).toThrow());
 it('rejects installments above 24',()=>expect(()=>installmentSchedule(90,'2026-01-01',25)).toThrow());
 it('refunds partial sales without losing cents',()=>expect([returnAmount(10,3,0,1),returnAmount(10,3,1,1),returnAmount(10,3,2,1)]).toEqual([3.33,3.34,3.33]));
 it('cannot refund more than the original quantity',()=>expect(()=>returnAmount(10,3,2,2)).toThrow());
 it('restores only the selected variant and updates aggregate stock',()=>expect(restoreInventory({stock:3,variants:[{id:'a',size:'M',color:'red',stock:1},{id:'b',size:'L',color:'red',stock:2}]},2,'a')).toMatchObject({stock:5,variants:[{stock:3},{stock:2}]}));
 it('rejects restoration to a removed variant',()=>expect(()=>restoreInventory({stock:1,variants:[{id:'a',size:'M',color:'red',stock:1}]},1,'b')).toThrow());
 it('calculates ingredient cost per serving',()=>expect(recipeCost([{quantity:2,unitCost:5},{quantity:1,unitCost:4}],7)).toEqual({total:14,unit:2}));
 it('separates rental management fee from owner proceeds without moving money',()=>expect(rentalDistribution(1500,10)).toEqual({fee:150,owner:1350}));
 it('rejects contracts ending before they start',()=>expect(()=>validateOperation({kind:'rental',customer:'Ana',phone:'5511999999999',description:'Casa',amount:1500,dueDay:10,commission:10,start:'2026-10-01',end:'2026-09-01',adjustment:'IPCA',status:'active'})).toThrow());
 it('rejects rent adjustments outside the contract period',()=>expect(()=>validateOperation({kind:'rental',customer:'Ana',phone:'5511999999999',description:'Casa',amount:1500,dueDay:10,commission:10,start:'2026-10-01',end:'2027-10-01',adjustment:'IPCA',status:'active',adjustments:[{oldAmount:1400,percentage:7.14,effective:'2027-11-01'}]})).toThrow());
 it('bounds advisory exempt profit to actual profit',()=>expect(profitEstimate(10000,5000,9500,500)).toEqual({profit:500,exemptEstimate:500,potentiallyTaxable:0}));
 it('includes recorded service income in advisory revenue',()=>expect(meiSummary([{type:'entrada',value:100,date:'2026-10-01',category:'Serviços',isPersonal:false}],2026,'',100).revenue).toBe(100));
 it('subtracts same-year linked refunds without counting owner withdrawals',()=>{
  expect(meiSummary([{id:'s',type:'entrada',value:100,date:'2026-10-01',category:'Venda',isPersonal:false},{originalSaleId:'s',type:'saida',value:25,date:'2026-10-02',category:'Devolução',isPersonal:false}],2026,'',0).revenue).toBe(75);
 });
});