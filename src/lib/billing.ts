// src/lib/billing.ts
// Substitui a versão com Supabase — usa Firestore diretamente
import { doc, getDoc } from 'firebase/firestore';
import { db, FUNCTIONS, callFunction } from '@/integrations/firebase/firebase';

export const getStripeCheckoutUrl = (email?: string | null) => {
  const isBrazil = navigator.language?.startsWith('pt-BR') ||
    Intl.DateTimeFormat().resolvedOptions().timeZone === 'America/Sao_Paulo';
  const paymentLink = isBrazil
   ? 'https://buy.stripe.com/dRm9AT25ccwKejpdkp00002'
: 'https://buy.stripe.com/cNi5kD11854idfldkp00003'
  return `${paymentLink}?prefilled_email=${encodeURIComponent(email ?? '')}`;
};

export const redirectToCheckout = (email?: string | null) => {
  window.location.href = getStripeCheckoutUrl(email);
};

export const hasActiveSubscription = (sub?: {
  status?: string | null;
  plan?: string | null;
  currentPeriodEnd?: { toDate?: () => Date } | string | null;
} | null) => {
  if (!sub || (sub.plan !== 'pro' && sub.plan !== 'trial')) return false;

  // Suporta tanto Firestore Timestamp quanto string ISO
  const endDate = sub.currentPeriodEnd
    ? (typeof sub.currentPeriodEnd === 'object' && sub.currentPeriodEnd.toDate
        ? sub.currentPeriodEnd.toDate()
        : new Date(sub.currentPeriodEnd as string))
    : null;

  if (sub.status === 'active') return !endDate || endDate > new Date();
  if (sub.status === 'cancelled') return !!endDate && endDate > new Date();
  return false;
};

export const getCurrentSubscription = async (userId: string) => {
  const snap = await getDoc(doc(db, 'subscriptions', userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    status: data.status,
    plan: data.plan,
    currentPeriodEnd: data.currentPeriodEnd,
  };
};

export const cancelSubscription = async () => {
  return callFunction(FUNCTIONS.cancelSubscription);
};

export const applyAjudaeCoupon = async () => {
  return callFunction(FUNCTIONS.applyAjudaeCoupon);
};
