import { auth } from '@/integrations/firebase/firebase';

const FUNCTION_URLS: Record<string, string> = {
  'compare-invoice': 'https://compareinvoice-mfnr6ijotq-rj.a.run.app',
  'generate-instagram-post': 'https://generateinstagrampost-mfnr6ijotq-rj.a.run.app',
  'forecast-cashflow': 'https://forecastcashflow-mfnr6ijotq-rj.a.run.app',
  'apply-ajudae-coupon': 'https://applyajudaecoupon-mfnr6ijotq-rj.a.run.app',
  'cancel-subscription': 'https://cancelsubscription-mfnr6ijotq-rj.a.run.app',
};

export async function callFunction(name: keyof typeof FUNCTION_URLS, body: any = {}) {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  const res = await fetch(FUNCTION_URLS[name], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Erro na função');
  return { data, error: null };
}