import { supabase } from '@/integrations/supabase/client';

export const getStripeCheckoutUrl = (email?: string | null) => {
  const isBrazil = navigator.language?.startsWith('pt-BR') ||
    Intl.DateTimeFormat().resolvedOptions().timeZone === 'America/Sao_Paulo';
  const paymentLink = isBrazil
    ? 'https://buy.stripe.com/00w5kEbOLdj35OmfwpgEg00'
    : 'https://buy.stripe.com/5kQ8wQcSPa6Ra4CfwpgEg01';
  return `${paymentLink}?prefilled_email=${encodeURIComponent(email ?? '')}`;
};

export const redirectToCheckout = (email?: string | null) => {
  window.location.href = getStripeCheckoutUrl(email);
};

export const hasActiveSubscription = (sub?: { status?: string | null; plan?: string | null; current_period_end?: string | null } | null) => {
  if (!sub || sub.plan !== 'pro') return false;
  if (sub.status === 'active') return !sub.current_period_end || new Date(sub.current_period_end) > new Date();
  if (sub.status === 'cancelled') return !!sub.current_period_end && new Date(sub.current_period_end) > new Date();
  return false;
};

export const getCurrentSubscription = async (userId: string) => {
  const { data } = await supabase
    .from('subscriptions')
    .select('status, plan, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
};