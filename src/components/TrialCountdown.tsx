import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/integrations/firebase/firebase';

const TrialCountdown = () => {
  const { user } = useAuth();
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'subscriptions', user.uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.plan !== 'trial') return;
      const end = data.currentPeriodEnd
        ? (typeof data.currentPeriodEnd === 'object' && data.currentPeriodEnd.toDate
            ? data.currentPeriodEnd.toDate()
            : new Date(data.currentPeriodEnd as string))
        : null;
      if (end) setEndsAt(end);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const diff = endsAt.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Período encerrado'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return null;

  const diff = endsAt.getTime() - Date.now();
  const totalDays = Math.ceil(diff / 86400000);
  const isUrgent = totalDays <= 7;

  const handleUpgrade = () => {
    const email = user?.email ?? '';
    window.open(`https://buy.stripe.com/dRm9AT25ccwKejpdkp00002?prefilled_email=${encodeURIComponent(email)}`, '_blank');
  };

  return (
    <div className={`
      mt-4 rounded-xl border px-4 py-3
      flex items-center justify-between gap-3
      ${isUrgent
        ? 'border-amber-500/30 bg-amber-500/5'
        : 'border-border bg-muted/40'}
    `}>
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${isUrgent ? 'bg-amber-400' : 'bg-primary'}`} />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">Acesso gratuito</span>
          <span className="text-[11px] text-muted-foreground">
            {diff <= 0 ? 'Período encerrado' : `Expira em ${totalDays > 1 ? `${totalDays} dias` : 'menos de 1 dia'}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`
          font-mono text-sm font-bold tabular-nums px-3 py-1 rounded-lg
          ${isUrgent ? 'text-amber-500 bg-amber-500/10' : 'text-primary bg-primary/10'}
        `}>
          {timeLeft}
        </div>
        <button
          onClick={handleUpgrade}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Assinar agora
        </button>
      </div>
    </div>
  );
};

export default TrialCountdown;