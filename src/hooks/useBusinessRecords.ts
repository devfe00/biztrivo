import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, where, runTransaction, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/integrations/firebase/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { validateOperation, restoreInventory, returnAmount, installmentSchedule, type BusinessRecord, type Operation } from '@/lib/business';
import { sanitizeText } from '@/lib/sanitize';

export function useBusinessRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    setRecords([]); setError(false); setLoading(true);
    if (!user) { setLoading(false); return; }
    return onSnapshot(query(collection(db, 'businessRecords'), where('userId', '==', user.uid)), snap => {
      try {
        setRecords(snap.docs.map(d => ({ ...validateOperation(d.data()), id: d.id })));
        setError(false);
      } catch { setError(true); }
      setLoading(false);
    }, () => { setError(true); setLoading(false); });
  }, [user?.uid]);

  async function save(input: Operation, id?: string) {
    if (!user) throw new Error('Sign in required');
    const fields = validateOperation(input);
    const target = id ? doc(db, 'businessRecords', id) : doc(collection(db, 'businessRecords'));
    await runTransaction(db, async tx => {
      const old = await tx.get(target);
      if (old.exists()) {
        const value = old.data();
        if (value.userId !== user.uid || value.kind !== fields.kind || ['paid', 'completed', 'delivered'].includes(value.status)) throw new Error('Locked record');
      }
      tx.set(target, { ...fields, userId: user.uid, updatedAt: serverTimestamp(), ...(!old.exists() ? { createdAt: serverTimestamp() } : {}) }, { merge: true });
    });
  }

  async function createInstallments(input: Extract<Operation, {kind: 'receivable'}>, count: number) {
    if (!user || !Number.isInteger(count) || count < 1 || count > 24) throw new Error('Invalid installments');
    const value = validateOperation(input);
    const batch = writeBatch(db);
    const groupId = crypto.randomUUID();
    installmentSchedule(input.amount,input.due,count).forEach((item,i)=> {
      batch.set(doc(collection(db, 'businessRecords')), { ...value, ...item, description: sanitizeText(`${input.description} (${i+1}/${count})`), groupId, userId: user.uid, createdAt: serverTimestamp() });
    });
    await batch.commit();
  }

  async function settle(id: string) {
    if (!user) throw new Error('Sign in required');
    const recordRef = doc(db, 'businessRecords', id);
    const cashRef = doc(db, 'transactions', `receipt-${id}`);
    await runTransaction(db, async tx => {
      const record = await tx.get(recordRef);
      const cash = await tx.get(cashRef);
      if (!record.exists() || record.data().userId !== user.uid) throw new Error('Forbidden');
      const data = validateOperation(record.data());
      if (data.kind !== 'receivable' || data.status !== 'pending' || cash.exists()) throw new Error('Already settled');
      tx.set(cashRef, { userId: user.uid, type: 'entrada', value: data.amount, description: sanitizeText(`${data.customer}: ${data.description}`), category: data.rentalId ? 'Aluguel' : 'Venda', isPersonal: false, date: new Date().toISOString(), businessRecordId: id, createdAt: serverTimestamp() });
      tx.update(recordRef, { status: 'paid', paidAt: new Date().toISOString(), updatedAt: serverTimestamp() });
    });
  }

  async function createRent(id: string, month: string) {
    if (!user || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Invalid month');
    const rentRef = doc(db, 'businessRecords', id);
    const chargeRef = doc(db, 'businessRecords', `rent-${id}-${month}`);
    await runTransaction(db, async tx => {
      const rent = await tx.get(rentRef);
      const charge = await tx.get(chargeRef);
      if (!rent.exists() || rent.data().userId !== user.uid || charge.exists()) throw new Error('Unavailable');
      const data = validateOperation(rent.data());
      if (data.kind !== 'rental' || data.status !== 'active') throw new Error('Inactive lease');
      const due = `${month}-${String(data.dueDay).padStart(2, '0')}`;
      if (due < data.start || due > data.end) throw new Error('Outside contract period');
      tx.set(chargeRef, { kind: 'receivable', customer: data.customer, phone: data.phone, description: `${data.description} ${month}`, amount: data.amount, due, status: 'pending', rentalId: id, userId: user.uid, createdAt: serverTimestamp() });
    });
  }

  async function refund(saleId: string, quantity: number, restock: boolean, reason: string) {
    if (!user || !reason.trim() || reason.length > 160) throw new Error('Invalid return');
    const saleRef = doc(db, 'transactions', saleId);
    const refundRef = doc(collection(db, 'transactions'));
    const auditRef = doc(collection(db, 'businessReturns'));
    await runTransaction(db, async tx => {
      const sale = await tx.get(saleRef);
      if (!sale.exists() || sale.data().userId !== user.uid || sale.data().type !== 'entrada') throw new Error('Forbidden');
      const data = sale.data();
      if (typeof data.productId !== 'string') throw new Error('Sale has no inventory reference');
      const productRef = doc(db, 'products', data.productId);
      const product = await tx.get(productRef);
      const value = returnAmount(data.value, data.quantity, data.returnedQuantity ?? 0, quantity);
      if (restock) {
        if (!product.exists() || product.data().userId !== user.uid) throw new Error('Product unavailable');
        const p = product.data();
        tx.update(productRef, { ...restoreInventory({ stock: p.stock, variants: p.variants }, quantity, data.variantId ?? undefined), updatedAt: serverTimestamp() });
      }
      tx.set(refundRef, { userId: user.uid, type:'saida', value, description: sanitizeText(reason), category:'Devolução', isPersonal:false, date:new Date().toISOString(), originalSaleId:saleId, createdAt:serverTimestamp() });
      tx.update(saleRef, { returnedQuantity: (data.returnedQuantity ?? 0) + quantity, updatedAt:serverTimestamp() });
      tx.set(auditRef, { userId:user.uid, saleId, quantity, restock, reason:sanitizeText(reason), refundId:refundRef.id, value, createdAt:serverTimestamp() });
    });
  }
  async function sales() {
    if (!user) throw new Error('Sign in required');
    const snap = await getDocs(query(collection(db, 'transactions'), where('userId', '==', user.uid)));
    return snap.docs.flatMap(d => {
      const value=d.data();
      if (value.type!=='entrada'||typeof value.productId!=='string'||typeof value.description!=='string') return [];
      try { returnAmount(value.value,value.quantity,value.returnedQuantity??0,1); }
      catch { return []; }
      return [{id:d.id,description:value.description,quantity:value.quantity as number,returnedQuantity:(value.returnedQuantity??0) as number}];
    });
  }
  return { records, loading, error, save, createInstallments, settle, createRent, refund, sales };
}