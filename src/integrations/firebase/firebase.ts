// src/integrations/firebase/firebase.ts
// Substitui src/integrations/supabase/client.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// URLs das Cloud Functions
export const FUNCTIONS = {
  setupUser:            'https://southamerica-east1-biztrivo-491617.cloudfunctions.net/setupUser',
  stripeWebhook:        'https://stripewebhook-mfnr6ijotq-rj.a.run.app',
  generateInstagramPost:'https://generateinstagrampost-mfnr6ijotq-rj.a.run.app',
  ajudaeSync:           'https://ajudaesync-mfnr6ijotq-rj.a.run.app',
  applyAjudaeCoupon:    'https://applyajudaecoupon-mfnr6ijotq-rj.a.run.app',
  cancelSubscription:   'https://cancelsubscription-mfnr6ijotq-rj.a.run.app',
  compareInvoice:       'https://compareinvoice-mfnr6ijotq-rj.a.run.app',
  forecastCashflow:     'https://forecastcashflow-mfnr6ijotq-rj.a.run.app',
  getPublicStoreBySlug: 'https://getpublicstorebyslug-mfnr6ijotq-rj.a.run.app',
  postsIA:              'https://postsia-mfnr6ijotq-rj.a.run.app',
  activateMei:          'https://southamerica-east1-biztrivo-491617.cloudfunctions.net/activateMei',
};

// Helper para chamar functions autenticadas
export async function callFunction<T = unknown>(
  url: string,
  body?: unknown,
  method: 'POST' | 'GET' = 'POST'
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const error = new Error(err.error || res.statusText) as Error & { status: number };
    error.status = res.status;
    throw error;
  }
  return res.json();
}
