import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { callFunction, FUNCTIONS } from '@/integrations/firebase/firebase';

interface TrialItem {
  email: string;
  endsAt: string | null;
  active: boolean;
  daysLeft: number;
  usedByUid: string | null;
  grantedAt: string | null;
}

const Admin = () => {
  const { user, loading, signOut, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [days, setDays] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [items, setItems] = useState<TrialItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    const { error } = await signInWithGoogle();
    if (error) setLoginError(error);
    setLoginLoading(false);
  };

  const fetchList = async () => {
    setLoadingList(true);
    try {
      const res = await callFunction(FUNCTIONS.listTrialAccess);
      setItems((res as any).items ?? []);
    } catch (err: any) {
      if (err?.status === 403) setForbidden(true);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user) fetchList();
  }, [user]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      await callFunction(FUNCTIONS.grantTrialAccess, { email: email.trim(), days: Number(days) });
      setMsg({ type: 'ok', text: `Trial de ${days} dias concedido para ${email}` });
      setEmail('');
      fetchList();
    } catch (err: any) {
      if (err?.status === 403) setForbidden(true);
      else setMsg({ type: 'err', text: err?.message ?? 'Erro ao conceder trial' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (targetEmail: string) => {
    if (!confirm(`Revogar trial de ${targetEmail}?`)) return;
    try {
      await callFunction(FUNCTIONS.revokeTrialAccess, { email: targetEmail });
      fetchList();
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao revogar');
    }
  };

  if (loading) return null;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm space-y-3">
        <p className="text-sm font-semibold">Admin — Login</p>
        {loginError && <p className="text-xs text-red-500">{loginError}</p>}
        <button
          onClick={handleGoogleLogin}
          disabled={loginLoading}
          className="w-full py-2.5 border border-border rounded-lg text-sm font-semibold bg-background hover:bg-muted disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loginLoading ? 'Entrando...' : 'Entrar com Google'}
        </button>
      </div>
    </div>
  );

  if (forbidden) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-3">
      <p className="text-sm text-muted-foreground">Acesso negado.</p>
      <button onClick={signOut} className="text-xs text-red-500 hover:text-red-700">
        Sair e trocar de conta
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Admin — Trials</h1>
        <button
          onClick={signOut}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
        >
          Sair
        </button>
      </div>

      <form onSubmit={handleGrant} className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
        <p className="text-sm font-semibold">Novo acesso gratuito</p>
        <input
          type="email"
          placeholder="email@loja.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Dias:</label>
          <input
            type="number"
            min={1}
            max={730}
            placeholder="60"
            value={days}
            onChange={e => setDays(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-24 px-3 py-2 border border-border rounded-lg text-sm bg-background"
          />
        </div>
        {msg && (
          <p className={`text-xs ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? 'Salvando...' : 'Conceder trial'}
        </button>
      </form>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold mb-3">Trials cadastrados</p>
        {loadingList ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum trial cadastrado.</p>
        ) : (
          <ul className="space-y-3">
            {items.map(item => (
              <li key={item.email} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{item.email}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${item.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {item.active ? `${item.daysLeft}d restantes` : 'expirado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {item.usedByUid ? 'Conta criada' : 'Aguardando cadastro'} •{' '}
                    {item.endsAt ? new Date(item.endsAt).toLocaleDateString('pt-BR') : '—'}
                  </span>
                  {item.active && (
                    <button
                      onClick={() => handleRevoke(item.email)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Revogar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Admin;